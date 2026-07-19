import "server-only";

import { unstable_cache } from "next/cache";
import { recentAudit } from "@/lib/fleet/audit";
import { collectApp } from "@/lib/fleet/collectors";
import { deriveAttention } from "@/lib/fleet/derive/attention";
import { sortBySeverity } from "@/lib/fleet/derive/health";
import { presentAppDetail } from "@/lib/fleet/present";
import { FLEET_APPS, getFleetApp, type FleetAppId } from "@/lib/fleet/registry";
import type {
  ActivityEntry,
  AppDetailSample,
  AttentionItem,
} from "@/components/fleet/sample";

const CONSOLE_REVALIDATE_SECONDS = 120;

const labelOf = (appId: FleetAppId): string =>
  getFleetApp(appId)?.label ?? appId;

async function loadAppDetail(appId: FleetAppId): Promise<AppDetailSample> {
  const app = getFleetApp(appId);
  if (!app) throw new Error(`Unknown app: ${appId}`);
  const detail = presentAppDetail(await collectApp(app));
  return { ...detail, activity: await loadActivity(appId) };
}

/** Live per-app detail, cached to avoid hammering GitHub/Vercel on each view. */
export function getAppDetail(appId: FleetAppId): Promise<AppDetailSample> {
  return unstable_cache(
    () => loadAppDetail(appId),
    ["fleet-console-app", appId],
    { revalidate: CONSOLE_REVALIDATE_SECONDS, tags: ["fleet-console", `fleet-console:${appId}`] },
  )();
}

async function loadAttention(): Promise<AttentionItem[]> {
  const observedAt = new Date().toISOString();
  const perApp = await Promise.all(FLEET_APPS.map((app) => collectApp(app)));
  const signals = sortBySeverity(perApp.flatMap(deriveAttention));
  return signals.map(
    (signal): AttentionItem => ({
      id: signal.fingerprint,
      appId: signal.appId,
      appLabel: labelOf(signal.appId),
      severity: signal.severity,
      title: signal.title,
      detail: signal.detail,
      observedAt,
    }),
  );
}

/** Live fleet-wide attention feed, severity-sorted. */
export function getFleetAttention(): Promise<AttentionItem[]> {
  return unstable_cache(loadAttention, ["fleet-console-attention"], {
    revalidate: CONSOLE_REVALIDATE_SECONDS,
    tags: ["fleet-console"],
  })();
}

async function loadActivity(appId?: FleetAppId): Promise<ActivityEntry[]> {
  const events = await recentAudit(50);
  return events
    .filter((event) => !appId || event.appId === appId)
    .map(
      (event): ActivityEntry => ({
        id: event.id,
        appId: (event.appId as FleetAppId) ?? "portfolio",
        appLabel: labelOf((event.appId as FleetAppId) ?? "portfolio"),
        kind: "audit",
        title: event.action,
        detail: event.result,
        actor: event.actor,
        at: event.createdAt.toISOString(),
      }),
    );
}

/** Fleet-wide activity from the audit log (empty until the DB is provisioned). */
export function getFleetActivity(): Promise<ActivityEntry[]> {
  return loadActivity();
}
