/**
 * Sanitized Vercel fixtures shaped to match the response types in
 * `@/lib/fleet-metrics` (`VercelProjectResponse`, `RawVercelDeployment`,
 * `VercelDeploymentsResponse`). Timestamps are epoch millis.
 */

const READY_CREATED = 1_752_000_000_000;
const ERROR_CREATED = 1_751_990_000_000;
const BUILDING_CREATED = 1_752_010_000_000;

/** A project response with a production target and latestDeployments. */
export const vercelProjectResponseFixture = {
  id: "prj_SanitizedProjectId000000000000000",
  name: "console",
  link: {
    productionBranch: "main",
  },
  targets: {
    production: {
      id: "dpl_ready0000000000000000000000000",
      readyState: "READY",
      target: "production",
      readySubstate: "PROMOTED",
      createdAt: READY_CREATED,
      buildingAt: READY_CREATED + 5_000,
      ready: READY_CREATED + 95_000,
      url: "console-abc123.vercel.app",
      inspectorUrl:
        "https://vercel.com/acme/console/dpl_ready0000000000000000000000000",
      checksConclusion: "succeeded",
      meta: {
        githubCommitRef: "main",
        githubCommitSha: "a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4",
        githubCommitMessage: "feat: add fleet metrics refresh",
      },
    },
  },
  latestDeployments: [
    {
      id: "dpl_ready0000000000000000000000000",
      readyState: "READY",
      target: "production",
      createdAt: READY_CREATED,
      buildingAt: READY_CREATED + 5_000,
      ready: READY_CREATED + 95_000,
      url: "console-abc123.vercel.app",
      meta: {
        githubCommitRef: "main",
        githubCommitSha: "a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4",
        githubCommitMessage: "feat: add fleet metrics refresh",
      },
    },
  ],
} as const;

/** A deployments list including one READY, one ERROR, and one BUILDING. */
export const vercelDeploymentsResponseFixture = {
  deployments: [
    {
      uid: "dpl_building00000000000000000000000",
      state: "BUILDING",
      target: "production",
      createdAt: BUILDING_CREATED,
      buildingAt: BUILDING_CREATED + 4_000,
      url: "console-building.vercel.app",
      meta: {
        githubCommitRef: "main",
        githubCommitSha: "b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5",
        githubCommitMessage: "feat: streaming refresh",
      },
    },
    {
      uid: "dpl_ready0000000000000000000000000",
      readyState: "READY",
      target: "production",
      createdAt: READY_CREATED,
      buildingAt: READY_CREATED + 5_000,
      ready: READY_CREATED + 95_000,
      url: "console-abc123.vercel.app",
      checksConclusion: "succeeded",
      meta: {
        githubCommitRef: "main",
        githubCommitSha: "a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4",
        githubCommitMessage: "feat: add fleet metrics refresh",
      },
    },
    {
      uid: "dpl_error0000000000000000000000000",
      readyState: "ERROR",
      target: "production",
      createdAt: ERROR_CREATED,
      buildingAt: ERROR_CREATED + 6_000,
      buildErrorAt: ERROR_CREATED + 40_000,
      url: "console-error.vercel.app",
      errorCode: "BUILD_FAILED",
      errorMessage: "Command \"bun run build\" exited with 1",
      meta: {
        githubCommitRef: "fix/regression",
        githubCommitSha: "c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f6",
        githubCommitMessage: "fix: attempt regression patch",
      },
    },
  ],
} as const;
