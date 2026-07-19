import type { Observation } from "@/lib/fleet/observation";
import type {
  GithubRepositoryMetrics,
  VercelProjectMetrics,
} from "@/lib/fleet-metrics";

/** Build a valid `Observation<T>` with sensible `ok` defaults. */
export function makeObservation<T>(
  overrides: Partial<Observation<T>> = {},
): Observation<T> {
  return {
    status: "ok",
    data: null,
    observedAt: "2026-07-18T14:22:03.000Z",
    staleAt: "2026-07-18T14:24:03.000Z",
    source: "test",
    sourceUrl: "https://example.dev/source",
    ...overrides,
  };
}

/** Build a `GithubRepositoryMetrics` object with sensible defaults. */
export function makeGithubMetrics(
  overrides: Partial<GithubRepositoryMetrics> = {},
): GithubRepositoryMetrics {
  return {
    nameWithOwner: "acme/console",
    url: "https://github.com/acme/console",
    isPrivate: false,
    isArchived: false,
    openPullRequests: 3,
    openIssues: 11,
    branchCount: 5,
    stars: 42,
    forks: 7,
    pushedAt: "2026-07-18T14:22:03Z",
    defaultBranch: "main",
    head: {
      sha: "a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4",
      url: "https://github.com/acme/console/commit/a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4",
      message: "feat: add fleet metrics refresh",
      committedAt: "2026-07-18T14:20:00Z",
    },
    ci: {
      state: "failure",
      total: 2,
      truncated: false,
      passed: 1,
      failed: 1,
      pending: 0,
      skipped: 0,
      attentionChecks: [
        {
          name: "e2e",
          state: "failure",
          url: "https://github.com/acme/console/actions/runs/1002",
        },
      ],
    },
    latestRelease: {
      tag: "v1.4.0",
      publishedAt: "2026-07-10T09:00:00Z",
      url: "https://github.com/acme/console/releases/tag/v1.4.0",
      isPrerelease: false,
    },
    ...overrides,
  };
}

/** Build a `VercelProjectMetrics` object with sensible defaults. */
export function makeVercelMetrics(
  overrides: Partial<VercelProjectMetrics> = {},
): VercelProjectMetrics {
  return {
    projectId: "prj_SanitizedProjectId000000000000000",
    projectName: "console",
    productionBranch: "main",
    live: {
      id: "dpl_ready0000000000000000000000000",
      state: "READY",
      environment: "production",
      readySubstate: "PROMOTED",
      createdAt: "2026-07-08T20:00:00.000Z",
      buildingAt: "2026-07-08T20:00:05.000Z",
      readyAt: "2026-07-08T20:01:35.000Z",
      queueDurationMs: 5_000,
      buildDurationMs: 90_000,
      totalDurationMs: 95_000,
      deploymentUrl: "https://console-abc123.vercel.app",
      inspectorUrl:
        "https://vercel.com/acme/console/dpl_ready0000000000000000000000000",
      branch: "main",
      commitSha: "a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4",
      commitMessage: "feat: add fleet metrics refresh",
      checksConclusion: "succeeded",
      errorCode: null,
      errorMessage: null,
    },
    latest: null,
    recent: {
      sampleSize: 3,
      failed: 1,
      canceled: 0,
      active: 1,
    },
    ...overrides,
  };
}
