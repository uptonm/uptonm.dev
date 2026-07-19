import "server-only";

import { type AppObservations } from "@/lib/fleet/collectors";
import { isDatabaseConfigured } from "@/lib/fleet/db/client";
import {
  openIncident,
  resolveAttentionItemsExcept,
  resolveIncident,
  upsertAttentionItem,
  upsertMetricRollup,
} from "@/lib/fleet/db/repositories";
import { hasData } from "@/lib/fleet/observation";
import type { FleetAppId } from "@/lib/fleet/registry";
import type { AttentionSignal } from "./attention";
import type { IncidentActions } from "./incidents";

/**
 * Persist derived attention signals: upsert every active signal, then resolve
 * anything previously open for a rule whose fingerprint is no longer present.
 * No-op without a configured database so callers need no guard of their own.
 */
export async function syncAttention(
  appId: FleetAppId,
  signals: AttentionSignal[],
  now: Date = new Date(),
): Promise<void> {
  if (!isDatabaseConfigured()) return;

  const activeByRule = new Map<string, string[]>();
  for (const signal of signals) {
    await upsertAttentionItem({
      fingerprint: signal.fingerprint,
      appId: signal.appId,
      rule: signal.rule,
      severity: signal.severity,
      title: signal.title,
      detail: signal.detail,
      sourceUrl: signal.sourceUrl ?? null,
      lastSeenAt: now,
    });
    const fingerprints = activeByRule.get(signal.rule) ?? [];
    fingerprints.push(signal.fingerprint);
    activeByRule.set(signal.rule, fingerprints);
  }

  const rules = new Set(signals.map((signal) => signal.rule));
  for (const rule of rules) {
    await resolveAttentionItemsExcept(
      appId,
      rule,
      activeByRule.get(rule) ?? [],
      now,
    );
  }
}

/** Open and resolve incidents implied by a derived `IncidentActions`. */
export async function syncIncidents(
  appId: FleetAppId,
  actions: IncidentActions,
  now: Date = new Date(),
): Promise<void> {
  if (!isDatabaseConfigured()) return;

  for (const incident of actions.open) {
    await openIncident({
      appId,
      kind: incident.kind,
      severity: incident.severity,
      summary: incident.summary,
    });
  }
  for (const id of actions.resolve) {
    await resolveIncident(id, now);
  }
}

/** Snapshot the current numeric health metrics into the rollup table. */
export async function writeRollups(
  appId: FleetAppId,
  obs: AppObservations,
  now: Date = new Date(),
): Promise<void> {
  if (!isDatabaseConfigured()) return;

  const bucketStart = now;
  if (hasData(obs.deployments) && obs.deployments.data.successRate7d !== null) {
    await upsertMetricRollup({
      appId,
      metric: "deploy_success_rate_7d",
      granularity: "hour",
      bucketStart,
      value: obs.deployments.data.successRate7d,
      sampleCount: obs.deployments.data.sampleSize,
    });
  }
  if (hasData(obs.operations)) {
    await upsertMetricRollup({
      appId,
      metric: "probe_latency_ms",
      granularity: "hour",
      bucketStart,
      value: obs.operations.data.httpProbe.latencyMs,
      sampleCount: 1,
    });
  }
}
