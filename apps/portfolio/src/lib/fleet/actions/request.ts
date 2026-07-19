import "server-only";

import { eq } from "drizzle-orm";
import { db, isDatabaseConfigured, schema } from "../db/client";

export type ActionRequestRow = typeof schema.actionRequests.$inferSelect;

function requireDb() {
  if (!isDatabaseConfigured()) {
    throw new Error("action requests require a database");
  }
}

async function selectByKey(
  idempotencyKey: string,
): Promise<ActionRequestRow | undefined> {
  const rows = await db()
    .select()
    .from(schema.actionRequests)
    .where(eq(schema.actionRequests.idempotencyKey, idempotencyKey))
    .limit(1);
  return rows[0];
}

export async function beginActionRequest({
  idempotencyKey,
  actor,
  action,
  appId,
  input,
}: {
  idempotencyKey: string;
  actor: string;
  action: string;
  appId?: string;
  input: unknown;
}): Promise<{ created: boolean; request: ActionRequestRow }> {
  requireDb();

  const existing = await selectByKey(idempotencyKey);
  if (existing) {
    return { created: false, request: existing };
  }

  const inserted = await db()
    .insert(schema.actionRequests)
    .values({
      idempotencyKey,
      actor,
      action,
      appId: appId ?? null,
      status: "pending",
      input: input ?? null,
    })
    .onConflictDoNothing({ target: schema.actionRequests.idempotencyKey })
    .returning();

  const created = inserted[0];
  if (created) {
    return { created: true, request: created };
  }

  const raced = await selectByKey(idempotencyKey);
  if (!raced) {
    throw new Error("action request insert lost the race but row is missing");
  }
  return { created: false, request: raced };
}

export async function completeActionRequest(
  id: string,
  { status, result }: { status: string; result?: unknown },
): Promise<void> {
  requireDb();
  await db()
    .update(schema.actionRequests)
    .set({
      status,
      result: result ?? null,
      completedAt: new Date(),
    })
    .where(eq(schema.actionRequests.id, id));
}
