import "server-only";

import {
  failed,
  type Observation,
  ok,
  partial,
  unconfigured,
} from "../observation";
import type { FleetApp } from "../registry";
import { collect, type Collector } from "../collector/collect";
import { classifyError, fetchJson } from "../collector/http";

const PROVIDER = "Vercel";
const DEPLOYMENTS_LIMIT = 100;
const WINDOW_7_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
const WINDOW_30_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export type VercelDeploymentState =
  | "QUEUED"
  | "INITIALIZING"
  | "BUILDING"
  | "READY"
  | "ERROR"
  | "CANCELED"
  | "BLOCKED"
  | "DELETED"
  | "UNKNOWN";

export type VercelDeploymentFailure = {
  id: string | null;
  createdAt: string | null;
  errorCode: string | null;
  commitSha: string | null;
};

export type VercelRollbackCandidate = {
  id: string | null;
  sha: string | null;
  createdAt: string | null;
};

export type VercelDeploymentHealth = {
  projectId: string;
  projectName: string;
  sampleSize: number;
  successRate7d: number | null;
  successRate30d: number | null;
  deploymentsPerDay7d: number;
  activeBuilds: number;
  buildDuration: {
    averageMs: number | null;
    p50Ms: number | null;
    p95Ms: number | null;
  };
  leadTime: {
    averageMs: number | null;
    p50Ms: number | null;
  };
  latestFailure: VercelDeploymentFailure | null;
  currentProductionSha: string | null;
  rollbackCandidate: VercelRollbackCandidate | null;
};

type RawVercelDeployment = {
  id?: string | null;
  uid?: string | null;
  state?: string | null;
  readyState?: string | null;
  target?: string | null;
  created?: number | string | null;
  createdAt?: number | string | null;
  buildingAt?: number | string | null;
  buildContainerFinishedAt?: number | string | null;
  buildErrorAt?: number | string | null;
  ready?: number | string | null;
  readyAt?: number | string | null;
  canceledAt?: number | string | null;
  errorCode?: string | null;
  meta?: {
    githubCommitRef?: string | null;
    githubCommitSha?: string | null;
    githubCommitTimestamp?: number | string | null;
  } | null;
};

type VercelDeploymentsResponse = {
  deployments?: Array<RawVercelDeployment | null> | null;
};

type VercelProjectResponse = {
  id?: string | null;
  name?: string | null;
  targets?: {
    production?: RawVercelDeployment | null;
  } | null;
};

function vercelToken(): string {
  return (
    process.env.VERCEL_TOKEN?.trim() || process.env.vercel_pat?.trim() || ""
  );
}

function timestamp(value: number | string | null | undefined): number | null {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (/^\d+$/.test(value)) {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : null;
  }
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function isoTimestamp(
  value: number | string | null | undefined,
): string | null {
  const milliseconds = timestamp(value);
  return milliseconds === null ? null : new Date(milliseconds).toISOString();
}

function positiveDuration(
  start: number | string | null | undefined,
  end: number | string | null | undefined,
): number | null {
  const startAt = timestamp(start);
  const endAt = timestamp(end);
  if (startAt === null || endAt === null || endAt < startAt) return null;
  return endAt - startAt;
}

function deploymentId(deployment: RawVercelDeployment): string | null {
  return deployment.id ?? deployment.uid ?? null;
}

function deploymentState(
  deployment: RawVercelDeployment,
): VercelDeploymentState {
  const state = (
    deployment.readyState ??
    deployment.state ??
    "UNKNOWN"
  ).toUpperCase();
  switch (state) {
    case "QUEUED":
    case "INITIALIZING":
    case "BUILDING":
    case "READY":
    case "ERROR":
    case "CANCELED":
    case "BLOCKED":
    case "DELETED":
      return state;
    default:
      return "UNKNOWN";
  }
}

function createdAtMs(deployment: RawVercelDeployment): number | null {
  return timestamp(deployment.createdAt ?? deployment.created);
}

function completedAt(
  deployment: RawVercelDeployment,
): number | string | null | undefined {
  return (
    deployment.ready ??
    deployment.readyAt ??
    deployment.buildContainerFinishedAt ??
    deployment.buildErrorAt ??
    deployment.canceledAt
  );
}

function isActive(deployment: RawVercelDeployment): boolean {
  return ["QUEUED", "INITIALIZING", "BUILDING"].includes(
    deploymentState(deployment),
  );
}

function isSettled(deployment: RawVercelDeployment): boolean {
  return ["READY", "ERROR", "CANCELED", "BLOCKED"].includes(
    deploymentState(deployment),
  );
}

function successRate(
  deployments: RawVercelDeployment[],
): number | null {
  const settled = deployments.filter(isSettled);
  if (!settled.length) return null;
  const ready = settled.filter(
    (deployment) => deploymentState(deployment) === "READY",
  ).length;
  return ready / settled.length;
}

function percentile(values: number[], fraction: number): number | null {
  if (!values.length) return null;
  const sorted = [...values].sort((left, right) => left - right);
  const index = Math.min(
    sorted.length - 1,
    Math.max(0, Math.ceil(fraction * sorted.length) - 1),
  );
  return sorted[index] ?? null;
}

function average(values: number[]): number | null {
  if (!values.length) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function newestFirst(
  deployments: Array<RawVercelDeployment | null>,
): RawVercelDeployment[] {
  return deployments
    .filter((deployment): deployment is RawVercelDeployment =>
      Boolean(deployment),
    )
    .sort(
      (left, right) => (createdAtMs(right) ?? 0) - (createdAtMs(left) ?? 0),
    );
}

function withinWindow(
  deployments: RawVercelDeployment[],
  windowMs: number,
  now: number,
): RawVercelDeployment[] {
  return deployments.filter((deployment) => {
    const created = createdAtMs(deployment);
    return created !== null && now - created <= windowMs;
  });
}

function buildHealth(
  app: FleetApp,
  deployments: Array<RawVercelDeployment | null>,
  project: VercelProjectResponse | null,
  now: number,
): VercelDeploymentHealth {
  const ordered = newestFirst(deployments);
  const last7d = withinWindow(ordered, WINDOW_7_DAYS_MS, now);
  const last30d = withinWindow(ordered, WINDOW_30_DAYS_MS, now);

  const buildDurations = ordered
    .map((deployment) =>
      positiveDuration(deployment.buildingAt, completedAt(deployment)),
    )
    .filter((value): value is number => value !== null);

  const leadTimes = ordered
    .map((deployment) =>
      positiveDuration(deployment.meta?.githubCommitTimestamp, completedAt(deployment)),
    )
    .filter((value): value is number => value !== null);

  const latestFailedDeployment = ordered.find(
    (deployment) => deploymentState(deployment) === "ERROR",
  );

  const currentProduction = project?.targets?.production ?? null;
  const currentSha = currentProduction?.meta?.githubCommitSha ?? null;
  const currentId = currentProduction
    ? deploymentId(currentProduction)
    : null;

  const rollback = ordered.find(
    (deployment) =>
      deploymentState(deployment) === "READY" &&
      deploymentId(deployment) !== currentId,
  );

  return {
    projectId: project?.id ?? app.vercel.projectId,
    projectName: project?.name ?? app.vercel.projectName,
    sampleSize: ordered.length,
    successRate7d: successRate(last7d),
    successRate30d: successRate(last30d),
    deploymentsPerDay7d: last7d.length / 7,
    activeBuilds: ordered.filter(isActive).length,
    buildDuration: {
      averageMs: average(buildDurations),
      p50Ms: percentile(buildDurations, 0.5),
      p95Ms: percentile(buildDurations, 0.95),
    },
    leadTime: {
      averageMs: average(leadTimes),
      p50Ms: percentile(leadTimes, 0.5),
    },
    latestFailure: latestFailedDeployment
      ? {
          id: deploymentId(latestFailedDeployment),
          createdAt: isoTimestamp(
            latestFailedDeployment.createdAt ?? latestFailedDeployment.created,
          ),
          errorCode: latestFailedDeployment.errorCode ?? null,
          commitSha: latestFailedDeployment.meta?.githubCommitSha ?? null,
        }
      : null,
    currentProductionSha: currentSha,
    rollbackCandidate: rollback
      ? {
          id: deploymentId(rollback),
          sha: rollback.meta?.githubCommitSha ?? null,
          createdAt: isoTimestamp(rollback.createdAt ?? rollback.created),
        }
      : null,
  };
}

export async function collectVercelDeployments(
  app: FleetApp,
): Promise<Observation<VercelDeploymentHealth>> {
  const collector: Collector<VercelDeploymentHealth> = async () => {
    const token = vercelToken();
    const teamId = process.env.VERCEL_TEAM_ID?.trim();

    if (!token || !teamId) {
      const missing = [
        !token ? "VERCEL_TOKEN" : null,
        !teamId ? "VERCEL_TEAM_ID" : null,
      ].filter((value): value is string => Boolean(value));
      return unconfigured<VercelDeploymentHealth>(
        `Add ${missing.join(" and ")} to enable deployment metrics.`,
        { source: PROVIDER },
      );
    }

    const deploymentsQuery = new URLSearchParams({
      projectId: app.vercel.projectId,
      target: "production",
      limit: String(DEPLOYMENTS_LIMIT),
      teamId,
    });
    const deploymentsUrl = `https://api.vercel.com/v6/deployments?${deploymentsQuery.toString()}`;
    const projectUrl = `https://api.vercel.com/v9/projects/${encodeURIComponent(
      app.vercel.projectId,
    )}?teamId=${encodeURIComponent(teamId)}`;

    const [deploymentsResult, projectResult] = await Promise.allSettled([
      fetchJson<VercelDeploymentsResponse>(deploymentsUrl, {
        token,
        provider: PROVIDER,
      }),
      fetchJson<VercelProjectResponse>(projectUrl, {
        token,
        provider: PROVIDER,
      }),
    ]);

    if (deploymentsResult.status === "rejected") {
      return failed<VercelDeploymentHealth>(
        classifyError(PROVIDER, deploymentsResult.reason),
        { source: PROVIDER, sourceUrl: deploymentsUrl },
      );
    }

    const now = Date.now();
    const deployments = deploymentsResult.value.deployments ?? [];
    const project =
      projectResult.status === "fulfilled" ? projectResult.value : null;
    const data = buildHealth(app, deployments, project, now);
    const meta = { source: PROVIDER, sourceUrl: deploymentsUrl };

    if (projectResult.status === "rejected") {
      return partial(data, classifyError(PROVIDER, projectResult.reason), meta);
    }
    return ok(data, meta);
  };

  return collect({
    appId: app.id,
    category: "deployments",
    trigger: "manual",
    collector,
  });
}
