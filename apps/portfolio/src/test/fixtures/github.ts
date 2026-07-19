/**
 * Sanitized GitHub GraphQL fixtures shaped to match the response types in
 * `@/lib/fleet-metrics` (`GithubGraphqlResponse`, `GithubRepositoryNode`).
 *
 * No real tokens or private data — every owner/repo/sha is invented.
 */

/** A full `data` payload with two repo aliases, mixed CI, and a release. */
export const githubGraphqlResponseFixture = {
  data: {
    app0: {
      nameWithOwner: "acme/console",
      url: "https://github.com/acme/console",
      isPrivate: false,
      isArchived: false,
      pushedAt: "2026-07-18T14:22:03Z",
      stargazerCount: 42,
      forkCount: 7,
      pullRequests: { totalCount: 3 },
      issues: { totalCount: 11 },
      refs: { totalCount: 5 },
      defaultBranchRef: {
        name: "main",
        target: {
          oid: "a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4",
          url: "https://github.com/acme/console/commit/a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4",
          committedDate: "2026-07-18T14:20:00Z",
          messageHeadline: "feat: add fleet metrics refresh",
          statusCheckRollup: {
            state: "FAILURE",
            contexts: {
              totalCount: 2,
              pageInfo: { hasNextPage: false },
              nodes: [
                {
                  __typename: "CheckRun",
                  name: "build",
                  status: "COMPLETED",
                  conclusion: "SUCCESS",
                  detailsUrl:
                    "https://github.com/acme/console/actions/runs/1001",
                },
                {
                  __typename: "CheckRun",
                  name: "e2e",
                  status: "COMPLETED",
                  conclusion: "FAILURE",
                  detailsUrl:
                    "https://github.com/acme/console/actions/runs/1002",
                },
              ],
            },
          },
        },
      },
      latestRelease: {
        tagName: "v1.4.0",
        publishedAt: "2026-07-10T09:00:00Z",
        url: "https://github.com/acme/console/releases/tag/v1.4.0",
        isPrerelease: false,
      },
    },
    app1: {
      nameWithOwner: "acme/edge",
      url: "https://github.com/acme/edge",
      isPrivate: true,
      isArchived: false,
      pushedAt: "2026-07-17T08:11:47Z",
      stargazerCount: 0,
      forkCount: 0,
      pullRequests: { totalCount: 0 },
      issues: { totalCount: 2 },
      refs: { totalCount: 1 },
      defaultBranchRef: {
        name: "main",
        target: {
          oid: "f0e1d2c3b4a5968778695a4b3c2d1e0f9a8b7c6d",
          url: "https://github.com/acme/edge/commit/f0e1d2c3b4a5968778695a4b3c2d1e0f9a8b7c6d",
          committedDate: "2026-07-17T08:10:00Z",
          messageHeadline: "chore: bump dependencies",
          statusCheckRollup: {
            state: "SUCCESS",
            contexts: {
              totalCount: 1,
              pageInfo: { hasNextPage: false },
              nodes: [
                {
                  __typename: "StatusContext",
                  context: "vercel",
                  state: "SUCCESS",
                  targetUrl: "https://vercel.com/acme/edge/deployments",
                },
              ],
            },
          },
        },
      },
      latestRelease: null,
    },
  },
} as const;

/** A rate-limited GraphQL error payload with an absent `data` field. */
export const githubErrorResponseFixture = {
  data: null,
  errors: [
    {
      type: "RATE_LIMITED",
      message: "API rate limit exceeded for installation.",
      path: ["app0"],
    },
  ],
} as const;
