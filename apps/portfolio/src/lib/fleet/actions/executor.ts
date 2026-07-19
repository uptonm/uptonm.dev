import "server-only";

import { revalidateTag } from "next/cache";
import { recordAudit } from "../audit";
import { fetchJson } from "../collector/http";
import { isDatabaseConfigured } from "../db/client";
import { setAttentionState } from "../db/repositories";
import { requirePermission, requiresReauth } from "../auth";
import type { FleetPermission } from "../permissions";
import { type FleetAppId, getFleetApp } from "../registry";
import { beginActionRequest, completeActionRequest } from "./request";

export type ActionOptions = {
  reauthenticated?: boolean;
  idempotencyKey: string;
  confirmationText?: string;
};

export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

const VERCEL_PROVIDER = "Vercel";

function vercelToken(): string {
  return (
    process.env.VERCEL_TOKEN?.trim() || process.env.vercel_pat?.trim() || ""
  );
}

function vercelTeamId(): string {
  return process.env.VERCEL_TEAM_ID?.trim() || "";
}

function requireVercelCredentials(): { token: string; teamId: string } {
  const token = vercelToken();
  const teamId = vercelTeamId();
  if (!token || !teamId) {
    throw new Error("vercel credentials are not configured");
  }
  return { token, teamId };
}

/** Hard gate: no live Vercel mutation may run unless explicitly enabled. */
function requireActionsEnabled(): void {
  if (process.env.FLEET_ACTIONS_ENABLED !== "true") {
    throw new Error("fleet actions are disabled");
  }
}

function requireDatabase(): void {
  if (!isDatabaseConfigured()) {
    throw new Error("fleet actions require a database");
  }
}

function requireApp(appId: FleetAppId): NonNullable<ReturnType<typeof getFleetApp>> {
  const app = getFleetApp(appId);
  if (!app) {
    throw new Error(`unknown fleet app: ${appId}`);
  }
  return app;
}

const CACHE_PROFILE = "max";

function revalidateAppCache(appId: FleetAppId): void {
  revalidateTag("fleet-console", CACHE_PROFILE);
  revalidateTag(`fleet-console:${appId}`, CACHE_PROFILE);
}

async function authorize(
  permission: FleetPermission,
  opts: ActionOptions,
): Promise<{ actor: string }> {
  const { userId } = await requirePermission(permission);
  if (requiresReauth(permission) && opts.reauthenticated !== true) {
    throw new Error("re-authentication is required for this action");
  }
  return { actor: userId };
}

function replayed<T>(result: unknown): ActionResult<T> {
  return result as ActionResult<T>;
}

async function runGuardedAction<T>(params: {
  permission: FleetPermission;
  action: string;
  appId?: FleetAppId;
  opts: ActionOptions;
  input: unknown;
  perform: (actor: string) => Promise<T>;
}): Promise<ActionResult<T>> {
  const { actor } = await authorize(params.permission, params.opts);

  requireDatabase();
  const begun = await beginActionRequest({
    idempotencyKey: params.opts.idempotencyKey,
    actor,
    action: params.action,
    appId: params.appId,
    input: params.input,
  });

  if (!begun.created && begun.request.result != null) {
    return replayed<T>(begun.request.result);
  }

  try {
    const data = await params.perform(actor);
    const result: ActionResult<T> = { ok: true, data };
    await recordAudit({
      actor,
      action: params.action,
      appId: params.appId,
      result: "success",
      after: data,
    });
    await completeActionRequest(begun.request.id, {
      status: "succeeded",
      result,
    });
    if (params.appId) {
      revalidateAppCache(params.appId);
    }
    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const result: ActionResult<T> = { ok: false, error: message };
    await recordAudit({
      actor,
      action: params.action,
      appId: params.appId,
      result: "failure",
      after: { error: message },
    });
    await completeActionRequest(begun.request.id, {
      status: "failed",
      result,
    });
    return result;
  }
}

export type RefreshData = { appId: FleetAppId; refreshedAt: string };

/** Read-only: revalidate the console cache for an app. Never gated. */
export async function refreshApp(
  appId: FleetAppId,
  opts: ActionOptions,
): Promise<ActionResult<RefreshData>> {
  await authorize("refresh", opts);
  requireApp(appId);
  revalidateAppCache(appId);
  return { ok: true, data: { appId, refreshedAt: new Date().toISOString() } };
}

export type AcknowledgeData = { fingerprint: string; snoozedUntil: string | null };

/** Acknowledge (and optionally snooze) an attention item. DB-guarded. */
export async function acknowledgeAttention(
  fingerprint: string,
  { snoozeMinutes }: { snoozeMinutes?: number },
  opts: ActionOptions,
): Promise<ActionResult<AcknowledgeData>> {
  return runGuardedAction<AcknowledgeData>({
    permission: "acknowledge",
    action: "acknowledge",
    opts,
    input: { fingerprint, snoozeMinutes },
    perform: async (actor) => {
      const snoozedUntil =
        typeof snoozeMinutes === "number" && snoozeMinutes > 0
          ? new Date(Date.now() + snoozeMinutes * 60_000)
          : null;
      await setAttentionState(fingerprint, {
        acknowledgedBy: actor,
        snoozedUntil,
      });
      return {
        fingerprint,
        snoozedUntil: snoozedUntil ? snoozedUntil.toISOString() : null,
      };
    },
  });
}

export type DeploymentData = { deploymentId: string };

/** Redeploy a production deployment. Live mutation — FLEET_ACTIONS_ENABLED gated. */
export async function redeployProduction(
  appId: FleetAppId,
  { deploymentId }: { deploymentId: string },
  opts: ActionOptions,
): Promise<ActionResult<DeploymentData>> {
  const app = requireApp(appId);
  return runGuardedAction<DeploymentData>({
    permission: "redeploy",
    action: "redeploy",
    appId,
    opts,
    input: { deploymentId },
    perform: async () => {
      requireActionsEnabled();
      const { token, teamId } = requireVercelCredentials();
      const query = new URLSearchParams({ teamId });
      const response = await fetchJson<{ id?: string; uid?: string }>(
        `https://api.vercel.com/v13/deployments?${query.toString()}`,
        {
          token,
          provider: VERCEL_PROVIDER,
          init: {
            method: "POST",
            body: JSON.stringify({
              name: app.vercel.projectName,
              project: app.vercel.projectId,
              target: "production",
              deploymentId,
            }),
          },
        },
      );
      return { deploymentId: response.id ?? response.uid ?? deploymentId };
    },
  });
}

/** Cancel an in-progress deployment. Live mutation — FLEET_ACTIONS_ENABLED gated. */
export async function cancelDeployment(
  appId: FleetAppId,
  { deploymentId }: { deploymentId: string },
  opts: ActionOptions,
): Promise<ActionResult<DeploymentData>> {
  requireApp(appId);
  return runGuardedAction<DeploymentData>({
    permission: "cancel_deployment",
    action: "cancel_deployment",
    appId,
    opts,
    input: { deploymentId },
    perform: async () => {
      requireActionsEnabled();
      const { token, teamId } = requireVercelCredentials();
      const query = new URLSearchParams({ teamId });
      await fetchJson<unknown>(
        `https://api.vercel.com/v12/deployments/${encodeURIComponent(
          deploymentId,
        )}/cancel?${query.toString()}`,
        {
          token,
          provider: VERCEL_PROVIDER,
          init: { method: "PATCH" },
        },
      );
      return { deploymentId };
    },
  });
}

export type RollbackData = { targetDeploymentId: string };

/**
 * Roll production back to a prior deployment. The most destructive action:
 * requires `rollback` permission, a fresh re-auth, an exact project-name
 * confirmation, and FLEET_ACTIONS_ENABLED.
 */
export async function rollbackProduction(
  appId: FleetAppId,
  { targetDeploymentId }: { targetDeploymentId: string },
  opts: ActionOptions,
): Promise<ActionResult<RollbackData>> {
  const app = requireApp(appId);
  return runGuardedAction<RollbackData>({
    permission: "rollback",
    action: "rollback",
    appId,
    opts,
    input: { targetDeploymentId },
    perform: async () => {
      if (opts.confirmationText !== app.vercel.projectName) {
        throw new Error("confirmation text does not match the project name");
      }
      requireActionsEnabled();
      const { token, teamId } = requireVercelCredentials();
      const query = new URLSearchParams({ teamId });
      await fetchJson<unknown>(
        `https://api.vercel.com/v9/projects/${encodeURIComponent(
          app.vercel.projectId,
        )}/rollback/${encodeURIComponent(targetDeploymentId)}?${query.toString()}`,
        {
          token,
          provider: VERCEL_PROVIDER,
          init: { method: "POST" },
        },
      );
      return { targetDeploymentId };
    },
  });
}
