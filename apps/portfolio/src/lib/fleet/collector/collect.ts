import "server-only";

import { isDatabaseConfigured } from "../db/client";
import {
  finishCollectionRun,
  latestObservation,
  type ObservationRow,
  recordObservation,
  startCollectionRun,
} from "../db/repositories";
import {
  failed,
  hasData,
  type Observation,
  stale,
} from "../observation";
import type { FleetAppId } from "../registry";
import {
  type CollectionCategory,
  COLLECTION_INTERVALS_SECONDS,
} from "../thresholds";

export type CollectorContext = {
  appId: FleetAppId;
  category: CollectionCategory;
  trigger: string;
  /** Set once a collection run is opened; `null` when no DB is configured. */
  runId: string | null;
};

export type Collector<T> = (ctx: CollectorContext) => Promise<Observation<T>>;

export type CollectInput<T> = {
  appId: FleetAppId;
  category: CollectionCategory;
  trigger: string;
  collector: Collector<T>;
  /** Overrides the category default freshness window used to set `staleAt`. */
  revalidateSeconds?: number;
};

/** Stable cache tags for Next.js `revalidateTag`. */
export const CACHE_TAGS = {
  fleetTag(category: CollectionCategory): string {
    return `fleet:${category}`;
  },
  fleetAppTag(appId: FleetAppId, category: CollectionCategory): string {
    return `fleet:${appId}:${category}`;
  },
} as const;

function isErrorStatus(status: string): boolean {
  return status === "error";
}

function withStaleAt<T>(
  observation: Observation<T>,
  revalidateSeconds: number,
): Observation<T> {
  const observedAt = observation.observedAt ?? new Date().toISOString();
  const staleAt = new Date(
    Date.parse(observedAt) + revalidateSeconds * 1000,
  ).toISOString();
  return { ...observation, observedAt, staleAt };
}

/** Re-wrap a persisted row as a `stale` observation, or `null` if unusable. */
function lastKnownGood<T>(row: ObservationRow | null): Observation<T> | null {
  if (!row || row.data === null || isErrorStatus(row.status)) {
    return null;
  }
  const meta = {
    source: row.source,
    ...(row.sourceUrl ? { sourceUrl: row.sourceUrl } : {}),
    ...(row.observedAt
      ? { observedAt: row.observedAt.toISOString() }
      : {}),
    ...(row.staleAt ? { staleAt: row.staleAt.toISOString() } : {}),
  };
  return stale(row.data as T, meta);
}

/**
 * Run a collector inside a tracked collection run with last-known-good
 * fallback. Never throws to the caller: a thrown or error-status collector
 * degrades to the newest usable persisted observation (`stale`), or a `failed`
 * observation when none exists. DB access is skipped entirely when no database
 * is configured, so this works before the DB is provisioned.
 */
export async function collect<T>({
  appId,
  category,
  trigger,
  collector,
  revalidateSeconds,
}: CollectInput<T>): Promise<Observation<T>> {
  const dbEnabled = isDatabaseConfigured();
  const revalidate = revalidateSeconds ?? COLLECTION_INTERVALS_SECONDS[category];
  const startedAt = Date.now();

  let runId: string | null = null;
  if (dbEnabled) {
    runId = await startCollectionRun({ appId, category, trigger });
  }

  const finish = async (status: string, error?: string): Promise<void> => {
    if (!dbEnabled || !runId) return;
    await finishCollectionRun(runId, {
      status,
      error: error ?? null,
      durationMs: Date.now() - startedAt,
    });
  };

  const degrade = async (
    error: string,
    fallbackSource: string,
  ): Promise<Observation<T>> => {
    if (dbEnabled) {
      const recovered = lastKnownGood<T>(
        await latestObservation(appId, category),
      );
      if (recovered) {
        await finish("degraded", error);
        return recovered;
      }
    }
    await finish("failed", error);
    return failed<T>(
      { code: "unavailable", message: error },
      { source: fallbackSource },
    );
  };

  try {
    const observation = await collector({ appId, category, trigger, runId });

    if (isErrorStatus(observation.status)) {
      const message = observation.error?.message ?? "collector reported error";
      if (!dbEnabled) {
        return observation;
      }
      return await degrade(message, observation.source);
    }

    const fresh = hasData(observation)
      ? withStaleAt(observation, revalidate)
      : observation;

    if (dbEnabled) {
      await recordObservation({ appId, category, observation: fresh, runId });
    }
    await finish("ok");
    return fresh;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return await degrade(message, `fleet:${category}`);
  }
}
