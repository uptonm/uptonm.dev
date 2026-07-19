import "server-only";

import { desc } from "drizzle-orm";
import { db, isDatabaseConfigured, schema } from "./db/client";

export type AuditEventRow = typeof schema.auditEvents.$inferSelect;

export async function recordAudit({
  actor,
  action,
  appId,
  result,
  before,
  after,
}: {
  actor: string;
  action: string;
  appId?: string;
  result: "success" | "failure" | string;
  before?: unknown;
  after?: unknown;
}): Promise<void> {
  if (!isDatabaseConfigured()) {
    return;
  }
  await db()
    .insert(schema.auditEvents)
    .values({
      actor,
      action,
      appId: appId ?? null,
      result,
      before: before ?? null,
      after: after ?? null,
    });
}

export async function recentAudit(limit = 50): Promise<AuditEventRow[]> {
  if (!isDatabaseConfigured()) {
    return [];
  }
  return db()
    .select()
    .from(schema.auditEvents)
    .orderBy(desc(schema.auditEvents.createdAt))
    .limit(limit);
}
