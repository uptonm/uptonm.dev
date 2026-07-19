import "server-only";

import { GATED_APPS, type GatedApp, type GatedAppId } from "@/lib/gates";
import { unstable_cache } from "next/cache";

export const FLEET_METRICS_CACHE_TAG = "fleet-metrics";
export const FLEET_METRICS_REVALIDATE_SECONDS = 120;

const REQUEST_TIMEOUT_MS = 8_000;

export type ProviderErrorCode =
  | "not_configured"
  | "unauthorized"
  | "forbidden"
  | "not_found"
  | "rate_limited"
  | "timeout"
  | "unavailable";

export type ProviderResult<T> =
  | {
      status: "ok";
      data: T;
    }
  | {
      status: "error";
      code: ProviderErrorCode;
      message: string;
    };

export type GithubCiState =
  "success" | "pending" | "failure" | "expected" | "none";

export type GithubRepositoryMetrics = {
  nameWithOwner: string;
  url: string;
  isPrivate: boolean;
  isArchived: boolean;
  openPullRequests: number;
  openIssues: number;
  branchCount: number;
  stars: number;
  forks: number;
  pushedAt: string | null;
  defaultBranch: string | null;
  head: {
    sha: string;
    url: string;
    message: string;
    committedAt: string;
  } | null;
  ci: {
    state: GithubCiState;
    total: number;
    truncated: boolean;
    passed: number;
    failed: number;
    pending: number;
    skipped: number;
    attentionChecks: Array<{
      name: string;
      state: "failure" | "pending";
      url: string | null;
    }>;
  };
  latestRelease: {
    tag: string;
    publishedAt: string | null;
    url: string;
    isPrerelease: boolean;
  } | null;
};

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

export type VercelDeploymentMetrics = {
  id: string | null;
  state: VercelDeploymentState;
  environment: string;
  readySubstate: string | null;
  createdAt: string | null;
  buildingAt: string | null;
  readyAt: string | null;
  queueDurationMs: number | null;
  buildDurationMs: number | null;
  totalDurationMs: number | null;
  deploymentUrl: string | null;
  inspectorUrl: string | null;
  branch: string | null;
  commitSha: string | null;
  commitMessage: string | null;
  checksConclusion: string | null;
  errorCode: string | null;
  errorMessage: string | null;
};

export type VercelProjectMetrics = {
  projectId: string;
  projectName: string;
  productionBranch: string | null;
  live: VercelDeploymentMetrics | null;
  latest: VercelDeploymentMetrics | null;
  recent: {
    sampleSize: number;
    failed: number;
    canceled: number;
    active: number;
  } | null;
};

export type FleetMetricsSnapshot = {
  fetchedAt: string;
  revalidateSeconds: number;
  configured: {
    github: boolean;
    vercelToken: boolean;
    vercelTeam: boolean;
  };
  apps: Record<
    GatedAppId,
    {
      github: ProviderResult<GithubRepositoryMetrics>;
      vercel: ProviderResult<VercelProjectMetrics>;
    }
  >;
};

type GithubCheckRunNode = {
  __typename: "CheckRun";
  name?: string | null;
  status?: string | null;
  conclusion?: string | null;
  detailsUrl?: string | null;
};

type GithubStatusContextNode = {
  __typename: "StatusContext";
  context?: string | null;
  state?: string | null;
  targetUrl?: string | null;
};

type GithubCheckNode = GithubCheckRunNode | GithubStatusContextNode;

type GithubRepositoryNode = {
  nameWithOwner?: string | null;
  url?: string | null;
  isPrivate?: boolean | null;
  isArchived?: boolean | null;
  pushedAt?: string | null;
  stargazerCount?: number | null;
  forkCount?: number | null;
  pullRequests?: { totalCount?: number | null } | null;
  issues?: { totalCount?: number | null } | null;
  refs?: { totalCount?: number | null } | null;
  defaultBranchRef?: {
    name?: string | null;
    target?: {
      oid?: string | null;
      url?: string | null;
      committedDate?: string | null;
      messageHeadline?: string | null;
      statusCheckRollup?: {
        state?: string | null;
        contexts?: {
          totalCount?: number | null;
          nodes?: Array<GithubCheckNode | null> | null;
          pageInfo?: {
            hasNextPage?: boolean | null;
          } | null;
        } | null;
      } | null;
    } | null;
  } | null;
  latestRelease?: {
    tagName?: string | null;
    publishedAt?: string | null;
    url?: string | null;
    isPrerelease?: boolean | null;
  } | null;
};

type GithubGraphqlResponse = {
  data?: Record<string, GithubRepositoryNode | null> | null;
  errors?: Array<{
    message?: string;
    type?: string;
    path?: Array<string | number>;
  }>;
};

type RawVercelDeployment = {
  id?: string | null;
  uid?: string | null;
  state?: string | null;
  readyState?: string | null;
  target?: string | null;
  readySubstate?: string | null;
  created?: number | string | null;
  createdAt?: number | string | null;
  buildingAt?: number | string | null;
  buildContainerFinishedAt?: number | string | null;
  buildErrorAt?: number | string | null;
  ready?: number | string | null;
  readyAt?: number | string | null;
  canceledAt?: number | string | null;
  url?: string | null;
  inspectorUrl?: string | null;
  checksConclusion?: string | null;
  errorCode?: string | null;
  errorMessage?: string | null;
  meta?: {
    githubCommitRef?: string | null;
    githubCommitSha?: string | null;
    githubCommitMessage?: string | null;
  } | null;
};

type VercelProjectResponse = {
  id?: string | null;
  name?: string | null;
  link?: {
    productionBranch?: string | null;
  } | null;
  targets?: {
    production?: RawVercelDeployment | null;
  } | null;
  latestDeployments?: Array<RawVercelDeployment | null> | null;
};

type VercelDeploymentsResponse = {
  deployments?: Array<RawVercelDeployment | null> | null;
};

class ProviderRequestError extends Error {
  readonly status: number | null;

  constructor(
    readonly provider: "GitHub" | "Vercel",
    message: string,
    status: number | null = null,
  ) {
    super(message);
    this.name = "ProviderRequestError";
    this.status = status;
  }
}

function makeRecord<T>(
  values: Array<readonly [GatedAppId, T]>,
): Record<GatedAppId, T> {
  return Object.fromEntries(values) as Record<GatedAppId, T>;
}

function providerError(
  provider: "GitHub" | "Vercel",
  error: unknown,
): ProviderResult<never> {
  if (
    error instanceof DOMException &&
    (error.name === "AbortError" || error.name === "TimeoutError")
  ) {
    return {
      status: "error",
      code: "timeout",
      message: `${provider} took too long to respond.`,
    };
  }

  const status = error instanceof ProviderRequestError ? error.status : null;

  if (status === 401) {
    return {
      status: "error",
      code: "unauthorized",
      message: `${provider} rejected the configured token.`,
    };
  }
  if (status === 403) {
    return {
      status: "error",
      code: "forbidden",
      message: `${provider} denied access to this project.`,
    };
  }
  if (status === 404) {
    return {
      status: "error",
      code: "not_found",
      message: `${provider} could not find this project.`,
    };
  }
  if (status === 429) {
    return {
      status: "error",
      code: "rate_limited",
      message: `${provider} rate-limited the dashboard. Try again shortly.`,
    };
  }

  return {
    status: "error",
    code: "unavailable",
    message: `${provider} metrics are temporarily unavailable.`,
  };
}

async function fetchJson<T>(
  url: string,
  token: string,
  provider: "GitHub" | "Vercel",
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(url, {
    ...init,
    cache: "no-store",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "User-Agent": "uptonm.dev-fleet-dashboard",
      ...init?.headers,
    },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  if (!response.ok) {
    const status =
      response.status === 403 &&
      (response.headers.get("x-ratelimit-remaining") === "0" ||
        response.headers.has("retry-after"))
        ? 429
        : response.status;
    throw new ProviderRequestError(
      provider,
      `${provider} returned HTTP ${response.status}.`,
      status,
    );
  }

  return (await response.json()) as T;
}

function githubQuery(apps: readonly GatedApp[]): {
  query: string;
  variables: Record<string, string>;
} {
  const definitions: string[] = [];
  const repositories: string[] = [];
  const variables: Record<string, string> = {};

  apps.forEach((app, index) => {
    definitions.push(`$owner${index}: String!`, `$repo${index}: String!`);
    repositories.push(
      `app${index}: repository(owner: $owner${index}, name: $repo${index}) { ...FleetRepository }`,
    );
    variables[`owner${index}`] = app.github.owner;
    variables[`repo${index}`] = app.github.repo;
  });

  return {
    query: `
      query FleetDashboard(${definitions.join(", ")}) {
        ${repositories.join("\n")}
      }

      fragment FleetRepository on Repository {
        nameWithOwner
        url
        isPrivate
        isArchived
        pushedAt
        stargazerCount
        forkCount
        pullRequests(states: OPEN, first: 1) {
          totalCount
        }
        issues(states: OPEN, first: 1) {
          totalCount
        }
        refs(refPrefix: "refs/heads/", first: 1) {
          totalCount
        }
        defaultBranchRef {
          name
          target {
            ... on Commit {
              oid
              url
              committedDate
              messageHeadline
              statusCheckRollup {
                state
                contexts(first: 100) {
                  totalCount
                  pageInfo {
                    hasNextPage
                  }
                  nodes {
                    __typename
                    ... on CheckRun {
                      name
                      status
                      conclusion
                      detailsUrl
                    }
                    ... on StatusContext {
                      context
                      state
                      targetUrl
                    }
                  }
                }
              }
            }
          }
        }
        latestRelease {
          tagName
          publishedAt
          url
          isPrerelease
        }
      }
    `,
    variables,
  };
}

function checkState(
  node: GithubCheckNode,
): "passed" | "failure" | "pending" | "skipped" {
  if (node.__typename === "StatusContext") {
    if (node.state === "SUCCESS") return "passed";
    if (node.state === "FAILURE" || node.state === "ERROR") return "failure";
    return "pending";
  }

  if (node.status !== "COMPLETED") return "pending";
  if (node.conclusion === "SUCCESS") return "passed";
  if (node.conclusion === "NEUTRAL" || node.conclusion === "SKIPPED") {
    return "skipped";
  }
  return node.conclusion ? "failure" : "pending";
}

function checkName(node: GithubCheckNode): string {
  if (node.__typename === "CheckRun") return node.name || "Check run";
  return node.context || "Commit status";
}

function checkUrl(node: GithubCheckNode): string | null {
  if (node.__typename === "CheckRun") return node.detailsUrl || null;
  return node.targetUrl || null;
}

function normalizeGithubCi(
  rollup: GithubRepositoryNode["defaultBranchRef"] | null | undefined,
): GithubRepositoryMetrics["ci"] {
  const statusRollup = rollup?.target?.statusCheckRollup;
  const nodes =
    statusRollup?.contexts?.nodes?.filter((node): node is GithubCheckNode =>
      Boolean(node),
    ) ?? [];
  const counts = {
    passed: 0,
    failed: 0,
    pending: 0,
    skipped: 0,
  };
  const attentionChecks: GithubRepositoryMetrics["ci"]["attentionChecks"] = [];

  for (const node of nodes) {
    const state = checkState(node);
    if (state === "failure") {
      counts.failed += 1;
    } else {
      counts[state] += 1;
    }
    if (state === "failure" || state === "pending") {
      attentionChecks.push({
        name: checkName(node),
        state,
        url: checkUrl(node),
      });
    }
  }

  let state: GithubCiState = "none";
  switch (statusRollup?.state) {
    case "SUCCESS":
      state = "success";
      break;
    case "PENDING":
      state = "pending";
      break;
    case "EXPECTED":
      state = "expected";
      break;
    case "FAILURE":
    case "ERROR":
      state = "failure";
      break;
  }

  return {
    state,
    total: statusRollup?.contexts?.totalCount ?? nodes.length,
    truncated: statusRollup?.contexts?.pageInfo?.hasNextPage ?? false,
    ...counts,
    attentionChecks: attentionChecks
      .sort((left, right) =>
        left.state === right.state ? 0 : left.state === "failure" ? -1 : 1,
      )
      .slice(0, 3),
  };
}

function normalizeGithubRepository(
  app: GatedApp,
  repository: GithubRepositoryNode,
): GithubRepositoryMetrics {
  const branch = repository.defaultBranchRef;
  const target = branch?.target;
  const release = repository.latestRelease;

  return {
    nameWithOwner:
      repository.nameWithOwner ?? `${app.github.owner}/${app.github.repo}`,
    url:
      repository.url ??
      `https://github.com/${app.github.owner}/${app.github.repo}`,
    isPrivate: repository.isPrivate ?? false,
    isArchived: repository.isArchived ?? false,
    openPullRequests: repository.pullRequests?.totalCount ?? 0,
    openIssues: repository.issues?.totalCount ?? 0,
    branchCount: repository.refs?.totalCount ?? 0,
    stars: repository.stargazerCount ?? 0,
    forks: repository.forkCount ?? 0,
    pushedAt: repository.pushedAt ?? null,
    defaultBranch: branch?.name ?? null,
    head:
      target?.oid && target.url && target.committedDate
        ? {
            sha: target.oid,
            url: target.url,
            message: target.messageHeadline || "Commit",
            committedAt: target.committedDate,
          }
        : null,
    ci: normalizeGithubCi(branch),
    latestRelease:
      release?.tagName && release.url
        ? {
            tag: release.tagName,
            publishedAt: release.publishedAt ?? null,
            url: release.url,
            isPrerelease: release.isPrerelease ?? false,
          }
        : null,
  };
}

function githubGraphqlError(
  errors: GithubGraphqlResponse["errors"],
  alias: string | null,
): ProviderResult<never> | null {
  const matching =
    errors?.filter(
      (error) =>
        alias === null || !error.path?.length || error.path[0] === alias,
    ) ?? [];
  if (!matching.length) return null;

  const detail = matching
    .map((error) => `${error.type ?? ""} ${error.message ?? ""}`)
    .join(" ")
    .toLowerCase();

  if (detail.includes("rate") && detail.includes("limit")) {
    return {
      status: "error",
      code: "rate_limited",
      message: "GitHub rate-limited the dashboard. Try again shortly.",
    };
  }
  if (
    detail.includes("forbidden") ||
    detail.includes("resource not accessible")
  ) {
    return {
      status: "error",
      code: "forbidden",
      message: "GitHub denied access to this repository.",
    };
  }
  if (detail.includes("not_found") || detail.includes("not found")) {
    return {
      status: "error",
      code: "not_found",
      message: "GitHub could not find this repository.",
    };
  }
  return {
    status: "error",
    code: "unavailable",
    message: "GitHub returned incomplete repository metrics.",
  };
}

function githubToken(): string {
  return (
    process.env.GITHUB_TOKEN?.trim() || process.env.github_pat?.trim() || ""
  );
}

async function loadGithubMetrics(
  apps: readonly GatedApp[],
): Promise<Record<GatedAppId, ProviderResult<GithubRepositoryMetrics>>> {
  const token = githubToken();
  if (!token) {
    return makeRecord(
      apps.map((app) => [
        app.id,
        {
          status: "error",
          code: "not_configured",
          message: "Add GITHUB_TOKEN to enable repository metrics.",
        },
      ]),
    );
  }

  try {
    const payload = githubQuery(apps);
    const response = await fetchJson<GithubGraphqlResponse>(
      "https://api.github.com/graphql",
      token,
      "GitHub",
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
    );

    if (!response.data) {
      const graphqlError = githubGraphqlError(response.errors, null);
      if (graphqlError) {
        return makeRecord(apps.map((app) => [app.id, graphqlError]));
      }
      throw new ProviderRequestError(
        "GitHub",
        response.errors?.[0]?.message ?? "GitHub returned no data.",
      );
    }

    return makeRecord(
      apps.map(
        (
          app,
          index,
        ): readonly [GatedAppId, ProviderResult<GithubRepositoryMetrics>] => {
          const alias = `app${index}`;
          const graphqlError = githubGraphqlError(response.errors, alias);
          if (graphqlError) return [app.id, graphqlError];

          const repository = response.data?.[alias];
          if (!repository) {
            return [
              app.id,
              {
                status: "error",
                code: "not_found",
                message: `GitHub could not read ${app.github.owner}/${app.github.repo}.`,
              },
            ];
          }
          return [
            app.id,
            {
              status: "ok",
              data: normalizeGithubRepository(app, repository),
            },
          ];
        },
      ),
    );
  } catch (error) {
    const result = providerError("GitHub", error);
    return makeRecord(apps.map((app) => [app.id, result]));
  }
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

function duration(
  start: number | string | null | undefined,
  end: number | string | null | undefined,
): number | null {
  const startAt = timestamp(start);
  const endAt = timestamp(end);
  if (startAt === null || endAt === null || endAt < startAt) return null;
  return endAt - startAt;
}

function cleanText(value: string | null | undefined): string | null {
  if (!value) return null;
  const text = value.trim();
  return text || null;
}

function deploymentId(
  deployment: RawVercelDeployment | null | undefined,
): string | null {
  return deployment?.id ?? deployment?.uid ?? null;
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

function deploymentUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  return value.startsWith("http://") || value.startsWith("https://")
    ? value
    : `https://${value}`;
}

function mergeDeployment(
  base: RawVercelDeployment,
  detail: RawVercelDeployment | undefined,
): RawVercelDeployment {
  if (!detail) return base;
  return {
    ...base,
    ...detail,
    meta: {
      ...base.meta,
      ...detail.meta,
    },
  };
}

function normalizeVercelDeployment(
  deployment: RawVercelDeployment | null | undefined,
): VercelDeploymentMetrics | null {
  if (!deployment) return null;
  const completedAt =
    deployment.ready ??
    deployment.readyAt ??
    deployment.buildContainerFinishedAt ??
    deployment.buildErrorAt ??
    deployment.canceledAt;
  const createdAt = deployment.createdAt ?? deployment.created;

  return {
    id: deploymentId(deployment),
    state: deploymentState(deployment),
    environment: deployment.target ?? "preview",
    readySubstate: deployment.readySubstate ?? null,
    createdAt: isoTimestamp(createdAt),
    buildingAt: isoTimestamp(deployment.buildingAt),
    readyAt: isoTimestamp(deployment.ready ?? deployment.readyAt),
    queueDurationMs: duration(createdAt, deployment.buildingAt),
    buildDurationMs: duration(deployment.buildingAt, completedAt),
    totalDurationMs: duration(createdAt, completedAt),
    deploymentUrl: deploymentUrl(deployment.url),
    inspectorUrl: deployment.inspectorUrl ?? null,
    branch: deployment.meta?.githubCommitRef ?? null,
    commitSha: deployment.meta?.githubCommitSha ?? null,
    commitMessage: cleanText(deployment.meta?.githubCommitMessage),
    checksConclusion: deployment.checksConclusion ?? null,
    errorCode: deployment.errorCode ?? null,
    errorMessage: cleanText(deployment.errorMessage),
  };
}

function newestDeployments(
  deployments: Array<RawVercelDeployment | null>,
): RawVercelDeployment[] {
  return deployments
    .filter((deployment): deployment is RawVercelDeployment =>
      Boolean(deployment),
    )
    .sort(
      (left, right) =>
        (timestamp(right.createdAt ?? right.created) ?? 0) -
        (timestamp(left.createdAt ?? left.created) ?? 0),
    );
}

function isFailedDeployment(deployment: RawVercelDeployment): boolean {
  return ["ERROR", "BLOCKED"].includes(deploymentState(deployment));
}

function isCanceledDeployment(deployment: RawVercelDeployment): boolean {
  return deploymentState(deployment) === "CANCELED";
}

function isActiveDeployment(deployment: RawVercelDeployment): boolean {
  return ["QUEUED", "INITIALIZING", "BUILDING"].includes(
    deploymentState(deployment),
  );
}

async function loadVercelProject(
  app: GatedApp,
  token: string,
  teamId: string,
): Promise<VercelProjectMetrics> {
  const teamQuery = `?teamId=${encodeURIComponent(teamId)}`;
  const deploymentsQuery = new URLSearchParams({
    projectId: app.vercel.projectId,
    limit: "10",
    teamId,
  });

  const [projectResult, deploymentsResult] = await Promise.allSettled([
    fetchJson<VercelProjectResponse>(
      `https://api.vercel.com/v9/projects/${encodeURIComponent(app.vercel.projectId)}${teamQuery}`,
      token,
      "Vercel",
    ),
    fetchJson<VercelDeploymentsResponse>(
      `https://api.vercel.com/v7/deployments?${deploymentsQuery.toString()}`,
      token,
      "Vercel",
    ),
  ]);

  if (projectResult.status === "rejected") {
    throw projectResult.reason;
  }

  const project = projectResult.value;
  const listed =
    deploymentsResult.status === "fulfilled"
      ? newestDeployments(deploymentsResult.value.deployments ?? [])
      : null;
  const projectLatest = newestDeployments(project.latestDeployments ?? []);
  const latestRaw = listed?.[0] ?? projectLatest[0];
  const exactLiveRaw = project.targets?.production ?? null;
  const exactLiveId = deploymentId(exactLiveRaw);
  const listedLive = exactLiveId
    ? listed?.find((deployment) => deploymentId(deployment) === exactLiveId)
    : undefined;
  const liveRaw = exactLiveRaw
    ? mergeDeployment(exactLiveRaw, listedLive)
    : null;

  return {
    projectId: project.id ?? app.vercel.projectId,
    projectName: project.name ?? app.vercel.projectName,
    productionBranch: project.link?.productionBranch ?? null,
    live: normalizeVercelDeployment(liveRaw),
    latest: normalizeVercelDeployment(latestRaw),
    recent: listed
      ? {
          sampleSize: listed.length,
          failed: listed.filter(isFailedDeployment).length,
          canceled: listed.filter(isCanceledDeployment).length,
          active: listed.filter(isActiveDeployment).length,
        }
      : null,
  };
}

function vercelToken(): string {
  return (
    process.env.VERCEL_TOKEN?.trim() || process.env.vercel_pat?.trim() || ""
  );
}

async function loadVercelMetrics(
  apps: readonly GatedApp[],
): Promise<Record<GatedAppId, ProviderResult<VercelProjectMetrics>>> {
  const token = vercelToken();
  const teamId = process.env.VERCEL_TEAM_ID?.trim();
  if (!token || !teamId) {
    const missing = [
      !token ? "VERCEL_TOKEN" : null,
      !teamId ? "VERCEL_TEAM_ID" : null,
    ].filter((value): value is string => Boolean(value));
    return makeRecord(
      apps.map((app) => [
        app.id,
        {
          status: "error",
          code: "not_configured",
          message: `Add ${missing.join(" and ")} to enable deployment metrics.`,
        },
      ]),
    );
  }

  const entries = await Promise.all(
    apps.map(
      async (
        app,
      ): Promise<
        readonly [GatedAppId, ProviderResult<VercelProjectMetrics>]
      > => {
        try {
          return [
            app.id,
            {
              status: "ok",
              data: await loadVercelProject(app, token, teamId),
            },
          ] as const;
        } catch (error) {
          return [app.id, providerError("Vercel", error)] as const;
        }
      },
    ),
  );

  return makeRecord(entries);
}

async function loadFleetMetrics(): Promise<FleetMetricsSnapshot> {
  const githubConfigured = Boolean(githubToken());
  const vercelTokenConfigured = Boolean(vercelToken());
  const vercelTeamConfigured = Boolean(process.env.VERCEL_TEAM_ID?.trim());
  const [github, vercel] = await Promise.all([
    loadGithubMetrics(GATED_APPS),
    loadVercelMetrics(GATED_APPS),
  ]);

  return {
    fetchedAt: new Date().toISOString(),
    revalidateSeconds: FLEET_METRICS_REVALIDATE_SECONDS,
    configured: {
      github: githubConfigured,
      vercelToken: vercelTokenConfigured,
      vercelTeam: vercelTeamConfigured,
    },
    apps: makeRecord(
      GATED_APPS.map((app) => [
        app.id,
        {
          github: github[app.id],
          vercel: vercel[app.id],
        },
      ]),
    ),
  };
}

const getCachedFleetMetrics = unstable_cache(
  loadFleetMetrics,
  ["fleet-metrics-v1"],
  {
    revalidate: FLEET_METRICS_REVALIDATE_SECONDS,
    tags: [FLEET_METRICS_CACHE_TAG],
  },
);

/** Read a resilient, serializable telemetry snapshot for all fleet apps. */
export async function getFleetMetrics(): Promise<FleetMetricsSnapshot> {
  return getCachedFleetMetrics();
}
