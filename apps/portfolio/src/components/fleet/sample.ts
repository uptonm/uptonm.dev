// PLACEHOLDER — replaced by live collectors in Wave 3.
//
// Every builder here returns hand-authored, deterministic sample data so the
// console shells render before real telemetry exists. Wave 3 swaps these
// functions for live collectors that return the SAME exported types, so the
// route/component code consuming them does not change.

import type {
  Observation,
  ObservationStatus,
} from "@/lib/fleet/observation";
import {
  failed,
  ok,
  stale,
  unconfigured,
  unsupported,
} from "@/lib/fleet/observation";
import type { FleetAppId } from "@/lib/fleet/registry";
import type {
  GithubCiState,
  VercelDeploymentState,
} from "@/lib/fleet-metrics";
import type { Severity } from "./SeverityBadge";

const OBSERVED_AT = "2026-07-19T14:30:00.000Z";
const STALE_OBSERVED_AT = "2026-07-18T02:15:00.000Z";

export type DeliverySample = {
  ciState: GithubCiState;
  openPullRequests: number;
  stalePullRequests: number;
  deploymentState: VercelDeploymentState;
  productionBranch: string;
  liveMatchesHead: boolean;
  lastDeployAt: string;
};

export type ExperienceSample = {
  uptimePct: number;
  lcpMs: number;
  inpMs: number;
  cls: number;
  errorRatePct: number;
};

export type ConfigurationSample = {
  domainCount: number;
  tlsDaysRemaining: number;
  envVarsExpected: number;
  envVarsMissing: number;
  driftCount: number;
};

export type OperationsSample = {
  cronsHealthy: number;
  cronsTotal: number;
  openIncidents: number;
  monthlyCostUsd: number;
  budgetUsd: number;
};

export type AppDetailSample = {
  delivery: Observation<DeliverySample>;
  experience: Observation<ExperienceSample>;
  configuration: Observation<ConfigurationSample>;
  operations: Observation<OperationsSample>;
  activity: ActivityEntry[];
};

export type AttentionItem = {
  id: string;
  appId: FleetAppId;
  appLabel: string;
  severity: Severity;
  title: string;
  detail: string;
  observedAt: string;
};

export type ActivityKind = "deploy" | "incident" | "config" | "audit";

export type ActivityEntry = {
  id: string;
  appId: FleetAppId;
  appLabel: string;
  kind: ActivityKind;
  title: string;
  detail: string;
  actor: string;
  at: string;
};

const source = { source: "placeholder", observedAt: OBSERVED_AT };

/** Deterministically vary the demonstrated status so every state renders. */
function statusForApp(appId: FleetAppId): ObservationStatus {
  const cycle: ObservationStatus[] = [
    "ok",
    "ok",
    "stale",
    "unsupported",
    "unconfigured",
    "error",
    "ok",
  ];
  let hash = 0;
  for (const char of appId) hash = (hash + char.charCodeAt(0)) % cycle.length;
  return cycle[hash] ?? "ok";
}

function wrap<T>(appId: FleetAppId, data: T): Observation<T> {
  switch (statusForApp(appId)) {
    case "stale":
      return stale(data, { source: "placeholder", observedAt: STALE_OBSERVED_AT, staleAt: STALE_OBSERVED_AT });
    case "unsupported":
      return unsupported("Not available for this app.", source);
    case "unconfigured":
      return unconfigured("Add the collector token to enable this lane.", source);
    case "error":
      return failed(
        { code: "unavailable", message: "Telemetry is temporarily unavailable." },
        source,
      );
    default:
      return ok(data, source);
  }
}

export function buildAppDetailSample(appId: FleetAppId): AppDetailSample {
  return {
    delivery: ok(
      {
        ciState: "success",
        openPullRequests: 3,
        stalePullRequests: 1,
        deploymentState: "READY",
        productionBranch: "main",
        liveMatchesHead: true,
        lastDeployAt: OBSERVED_AT,
      },
      source,
    ),
    experience: wrap(appId, {
      uptimePct: 99.98,
      lcpMs: 1420,
      inpMs: 180,
      cls: 0.04,
      errorRatePct: 0.3,
    }),
    configuration: wrap(appId, {
      domainCount: 2,
      tlsDaysRemaining: 64,
      envVarsExpected: 12,
      envVarsMissing: 0,
      driftCount: 0,
    }),
    operations: wrap(appId, {
      cronsHealthy: 2,
      cronsTotal: 2,
      openIncidents: 0,
      monthlyCostUsd: 18,
      budgetUsd: 40,
    }),
    activity: buildActivity(appId).slice(0, 4),
  };
}

export function buildActivity(appId?: FleetAppId): ActivityEntry[] {
  const rows: ActivityEntry[] = [
    {
      id: "act-1",
      appId: "portfolio",
      appLabel: "Portfolio",
      kind: "deploy",
      title: "Production deploy READY",
      detail: "main @ a1b2c3d — Fleet console shell",
      actor: "vercel[bot]",
      at: "2026-07-19T14:28:00.000Z",
    },
    {
      id: "act-2",
      appId: "budget",
      appLabel: "Budget",
      kind: "incident",
      title: "Uptime probe recovered",
      detail: "budget.uptonm.dev returned 200 after 2 failed checks",
      actor: "uptime-kuma",
      at: "2026-07-19T12:04:00.000Z",
    },
    {
      id: "act-3",
      appId: "facet",
      appLabel: "Facet",
      kind: "config",
      title: "Gate set to private",
      detail: "Login now required for facet.uptonm.dev",
      actor: "mike@uptonm.dev",
      at: "2026-07-18T22:41:00.000Z",
    },
    {
      id: "act-4",
      appId: "home",
      appLabel: "Home",
      kind: "audit",
      title: "Env var drift resolved",
      detail: "SENTRY_DSN added to production",
      actor: "mike@uptonm.dev",
      at: "2026-07-18T16:10:00.000Z",
    },
    {
      id: "act-5",
      appId: "cairn",
      appLabel: "Cairn",
      kind: "deploy",
      title: "Preview deploy ERROR",
      detail: "feat/map-layers @ 9f8e7d6 — build failed",
      actor: "vercel[bot]",
      at: "2026-07-18T09:55:00.000Z",
    },
  ];
  return appId ? rows.filter((row) => row.appId === appId) : rows;
}

export function buildAttentionFeed(): AttentionItem[] {
  const severityRank: Record<Severity, number> = {
    critical: 0,
    warning: 1,
    info: 2,
  };
  const items: AttentionItem[] = [
    {
      id: "att-1",
      appId: "cairn",
      appLabel: "Cairn",
      severity: "critical",
      title: "Preview build failing",
      detail: "feat/map-layers has failed the last 3 builds on Vercel.",
      observedAt: "2026-07-19T09:55:00.000Z",
    },
    {
      id: "att-2",
      appId: "budget",
      appLabel: "Budget",
      severity: "warning",
      title: "TLS certificate expiring soon",
      detail: "budget.uptonm.dev renews in 6 days — under the 7-day threshold.",
      observedAt: "2026-07-19T08:00:00.000Z",
    },
    {
      id: "att-3",
      appId: "facet",
      appLabel: "Facet",
      severity: "warning",
      title: "Stale pull request",
      detail: "PR #42 has been open 18 days with no activity.",
      observedAt: "2026-07-18T20:12:00.000Z",
    },
    {
      id: "att-4",
      appId: "portfolio",
      appLabel: "Portfolio",
      severity: "info",
      title: "Live differs from HEAD",
      detail: "Production is 1 commit behind main; a deploy is queued.",
      observedAt: "2026-07-19T14:20:00.000Z",
    },
  ];
  return items.sort(
    (left, right) =>
      severityRank[left.severity] - severityRank[right.severity] ||
      Date.parse(right.observedAt) - Date.parse(left.observedAt),
  );
}
