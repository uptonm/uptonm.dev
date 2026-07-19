import "server-only";

import { lt } from "drizzle-orm";

import { db, schema } from "./client";

const DAY_MS = 24 * 60 * 60 * 1000;

const { healthChecks, metricRollups, observations } = schema;

/** Cutoff timestamp `days` before `now`; rows at or before it are prunable. */
export function retentionCutoff(days: number, now: Date = new Date()): Date {
  return new Date(now.getTime() - days * DAY_MS);
}

export async function pruneObservations(
  olderThanDays = 30,
  now: Date = new Date(),
): Promise<void> {
  await db()
    .delete(observations)
    .where(lt(observations.observedAt, retentionCutoff(olderThanDays, now)));
}

export async function pruneHealthChecks(
  olderThanDays = 30,
  now: Date = new Date(),
): Promise<void> {
  await db()
    .delete(healthChecks)
    .where(lt(healthChecks.checkedAt, retentionCutoff(olderThanDays, now)));
}

export async function pruneRollups(
  olderThanDays = 395,
  now: Date = new Date(),
): Promise<void> {
  await db()
    .delete(metricRollups)
    .where(lt(metricRollups.bucketStart, retentionCutoff(olderThanDays, now)));
}

/** Run every retention prune with its default window. */
export async function retentionSweep(now: Date = new Date()): Promise<void> {
  await pruneObservations(30, now);
  await pruneHealthChecks(30, now);
  await pruneRollups(395, now);
}
