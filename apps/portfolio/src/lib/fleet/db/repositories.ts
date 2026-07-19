import "server-only";

import { and, desc, eq, inArray, isNull, not } from "drizzle-orm";

import type { Observation } from "../observation";
import type { FleetAppId } from "../registry";
import type { CollectionCategory } from "../thresholds";
import { db, schema } from "./client";

function expectOne<T>(rows: T[]): T {
  const row = rows[0];
  if (!row) {
    throw new Error("expected an inserted row but none was returned");
  }
  return row;
}

const {
  attentionItems,
  attentionState,
  collectionRuns,
  cronRuns,
  deployments,
  healthChecks,
  incidents,
  metricRollups,
  observations,
} = schema;

type CollectionRunRow = typeof collectionRuns.$inferSelect;
type ObservationRow = typeof observations.$inferSelect;
type DeploymentInsert = typeof deployments.$inferInsert;
type DeploymentRow = typeof deployments.$inferSelect;
type HealthCheckInsert = typeof healthChecks.$inferInsert;
type HealthCheckRow = typeof healthChecks.$inferSelect;
type AttentionItemInsert = typeof attentionItems.$inferInsert;
type AttentionItemRow = typeof attentionItems.$inferSelect;
type AttentionStateRow = typeof attentionState.$inferSelect;
type IncidentInsert = typeof incidents.$inferInsert;
type IncidentRow = typeof incidents.$inferSelect;
type CronRunInsert = typeof cronRuns.$inferInsert;
type CronRunRow = typeof cronRuns.$inferSelect;
type MetricRollupInsert = typeof metricRollups.$inferInsert;
type MetricRollupRow = typeof metricRollups.$inferSelect;

export type StartCollectionRunInput = {
  category: CollectionCategory;
  trigger: string;
  appId?: FleetAppId | null;
  status?: string;
};

/** Begin a collection pass; returns the row id used to link observations. */
export async function startCollectionRun(
  input: StartCollectionRunInput,
): Promise<string> {
  const rows = await db()
    .insert(collectionRuns)
    .values({
      category: input.category,
      trigger: input.trigger,
      appId: input.appId ?? null,
      status: input.status ?? "running",
    })
    .returning({ id: collectionRuns.id });
  return expectOne(rows).id;
}

export type FinishCollectionRunInput = {
  status: string;
  error?: string | null;
  durationMs?: number | null;
};

export async function finishCollectionRun(
  id: string,
  input: FinishCollectionRunInput,
): Promise<void> {
  await db()
    .update(collectionRuns)
    .set({
      status: input.status,
      error: input.error ?? null,
      durationMs: input.durationMs ?? null,
      finishedAt: new Date(),
    })
    .where(eq(collectionRuns.id, id));
}

export type RecordObservationInput = {
  appId: FleetAppId;
  category: CollectionCategory;
  observation: Observation<unknown>;
  runId?: string | null;
};

/** Append-only insert of one collector result. */
export async function recordObservation(
  input: RecordObservationInput,
): Promise<string> {
  const { observation: obs } = input;
  const rows = await db()
    .insert(observations)
    .values({
      runId: input.runId ?? null,
      appId: input.appId,
      category: input.category,
      status: obs.status,
      source: obs.source,
      sourceUrl: obs.sourceUrl ?? null,
      data: obs.data ?? null,
      errorCode: obs.error?.code ?? null,
      errorMessage: obs.error?.message ?? null,
      observedAt: obs.observedAt ? new Date(obs.observedAt) : new Date(),
      staleAt: obs.staleAt ? new Date(obs.staleAt) : null,
    })
    .returning({ id: observations.id });
  return expectOne(rows).id;
}

export async function latestObservation(
  appId: FleetAppId,
  category: CollectionCategory,
): Promise<ObservationRow | null> {
  const [row] = await db()
    .select()
    .from(observations)
    .where(
      and(eq(observations.appId, appId), eq(observations.category, category)),
    )
    .orderBy(desc(observations.observedAt))
    .limit(1);
  return row ?? null;
}

/** Newest observation row per category for one app. */
export async function latestObservationsForApp(
  appId: FleetAppId,
): Promise<ObservationRow[]> {
  const rows = await db()
    .select()
    .from(observations)
    .where(eq(observations.appId, appId))
    .orderBy(desc(observations.observedAt));

  const seen = new Set<string>();
  const latest: ObservationRow[] = [];
  for (const row of rows) {
    if (seen.has(row.category)) continue;
    seen.add(row.category);
    latest.push(row);
  }
  return latest;
}

export async function upsertDeployment(
  row: DeploymentInsert,
): Promise<void> {
  await db()
    .insert(deployments)
    .values(row)
    .onConflictDoUpdate({
      target: deployments.id,
      set: {
        appId: row.appId,
        environment: row.environment,
        state: row.state,
        branch: row.branch ?? null,
        commitSha: row.commitSha ?? null,
        commitMessage: row.commitMessage ?? null,
        isProductionServing: row.isProductionServing ?? false,
        createdAt: row.createdAt ?? null,
        readyAt: row.readyAt ?? null,
        buildDurationMs: row.buildDurationMs ?? null,
        inspectorUrl: row.inspectorUrl ?? null,
        errorCode: row.errorCode ?? null,
        recordedAt: new Date(),
      },
    });
}

export async function recentDeployments(
  appId: FleetAppId,
  limit: number,
): Promise<DeploymentRow[]> {
  return db()
    .select()
    .from(deployments)
    .where(eq(deployments.appId, appId))
    .orderBy(desc(deployments.createdAt))
    .limit(limit);
}

export async function recordHealthCheck(
  row: HealthCheckInsert,
): Promise<string> {
  const rows = await db()
    .insert(healthChecks)
    .values(row)
    .returning({ id: healthChecks.id });
  return expectOne(rows).id;
}

/** Upsert by fingerprint; bump lastSeenAt and reopen if previously resolved. */
export async function upsertAttentionItem(
  row: AttentionItemInsert,
): Promise<void> {
  const lastSeenAt = row.lastSeenAt ?? new Date();
  await db()
    .insert(attentionItems)
    .values({ ...row, lastSeenAt })
    .onConflictDoUpdate({
      target: attentionItems.fingerprint,
      set: {
        appId: row.appId,
        rule: row.rule,
        severity: row.severity,
        title: row.title,
        detail: row.detail ?? null,
        sourceUrl: row.sourceUrl ?? null,
        lastSeenAt,
        resolvedAt: null,
      },
    });
}

/**
 * Resolve attention items for an app+rule whose condition no longer holds:
 * everything currently open that is not in the active fingerprint set.
 */
export async function resolveAttentionItemsExcept(
  appId: FleetAppId,
  rule: string,
  activeFingerprints: string[],
  now: Date = new Date(),
): Promise<void> {
  const conditions = [
    eq(attentionItems.appId, appId),
    eq(attentionItems.rule, rule),
    isNull(attentionItems.resolvedAt),
  ];
  if (activeFingerprints.length > 0) {
    conditions.push(
      not(inArray(attentionItems.fingerprint, activeFingerprints)),
    );
  }
  await db()
    .update(attentionItems)
    .set({ resolvedAt: now })
    .where(and(...conditions));
}

export type OpenAttentionItem = AttentionItemRow & {
  state: AttentionStateRow | null;
};

/** Open (unresolved) attention items joined with their ack/snooze state. */
export async function openAttentionItems(): Promise<OpenAttentionItem[]> {
  const rows = await db()
    .select({ item: attentionItems, state: attentionState })
    .from(attentionItems)
    .leftJoin(
      attentionState,
      eq(attentionItems.fingerprint, attentionState.fingerprint),
    )
    .where(isNull(attentionItems.resolvedAt))
    .orderBy(desc(attentionItems.lastSeenAt));
  return rows.map((r) => ({ ...r.item, state: r.state }));
}

export type SetAttentionStateInput = {
  acknowledgedBy?: string | null;
  snoozedUntil?: Date | null;
  note?: string | null;
};

export async function setAttentionState(
  fingerprint: string,
  input: SetAttentionStateInput,
  now: Date = new Date(),
): Promise<void> {
  const acknowledgedBy = input.acknowledgedBy ?? null;
  const acknowledgedAt = acknowledgedBy ? now : null;
  await db()
    .insert(attentionState)
    .values({
      fingerprint,
      acknowledgedBy,
      acknowledgedAt,
      snoozedUntil: input.snoozedUntil ?? null,
      note: input.note ?? null,
    })
    .onConflictDoUpdate({
      target: attentionState.fingerprint,
      set: {
        acknowledgedBy,
        acknowledgedAt,
        snoozedUntil: input.snoozedUntil ?? null,
        note: input.note ?? null,
      },
    });
}

export async function openIncident(row: IncidentInsert): Promise<string> {
  const rows = await db()
    .insert(incidents)
    .values(row)
    .returning({ id: incidents.id });
  return expectOne(rows).id;
}

export async function resolveIncident(
  id: string,
  now: Date = new Date(),
): Promise<void> {
  await db()
    .update(incidents)
    .set({ resolvedAt: now })
    .where(eq(incidents.id, id));
}

export async function openIncidents(
  appId?: FleetAppId,
): Promise<IncidentRow[]> {
  const conditions = [isNull(incidents.resolvedAt)];
  if (appId) conditions.push(eq(incidents.appId, appId));
  return db()
    .select()
    .from(incidents)
    .where(and(...conditions))
    .orderBy(desc(incidents.startedAt));
}

export async function recordCronRun(row: CronRunInsert): Promise<string> {
  const rows = await db()
    .insert(cronRuns)
    .values(row)
    .returning({ id: cronRuns.id });
  return expectOne(rows).id;
}

export async function recentCronRuns(
  appId: FleetAppId,
  job: string,
  limit = 20,
): Promise<CronRunRow[]> {
  return db()
    .select()
    .from(cronRuns)
    .where(and(eq(cronRuns.appId, appId), eq(cronRuns.job, job)))
    .orderBy(desc(cronRuns.recordedAt))
    .limit(limit);
}

/** Upsert by the unique (appId, metric, granularity, bucketStart) key. */
export async function upsertMetricRollup(
  row: MetricRollupInsert,
): Promise<void> {
  await db()
    .insert(metricRollups)
    .values(row)
    .onConflictDoUpdate({
      target: [
        metricRollups.appId,
        metricRollups.metric,
        metricRollups.granularity,
        metricRollups.bucketStart,
      ],
      set: {
        value: row.value ?? null,
        sampleCount: row.sampleCount ?? 0,
        meta: row.meta ?? null,
      },
    });
}

export type {
  AttentionItemRow,
  AttentionStateRow,
  CollectionRunRow,
  CronRunRow,
  DeploymentRow,
  HealthCheckRow,
  IncidentRow,
  MetricRollupRow,
  ObservationRow,
};
