import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  githubErrorResponseFixture,
  githubGraphqlResponseFixture,
} from "@/test/fixtures/github";
import { mockFetchOnce } from "@/test/mocks/fetch";
import type { FleetApp } from "../registry";
import { collectGithubDelivery } from "./github-delivery";

const APP: FleetApp = {
  id: "portfolio",
  label: "Portfolio",
  url: "https://uptonm.dev",
  iconSrc: "/gates/portfolio.png",
  github: { owner: "acme", repo: "console" },
  vercel: { projectId: "prj_test", projectName: "console" },
  isControlPlane: true,
  capabilities: ["delivery"],
};

const base = githubGraphqlResponseFixture.data.app0;

const happyPathResponse = {
  data: {
    repository: {
      nameWithOwner: base.nameWithOwner,
      url: base.url,
      pushedAt: base.pushedAt,
      defaultBranchRef: {
        name: "main",
        target: {
          oid: base.defaultBranchRef.target.oid,
          history: { totalCount: 4 },
        },
      },
      pullRequests: {
        nodes: [
          {
            number: 42,
            title: "feat: add fleet delivery collector",
            createdAt: "2026-06-01T00:00:00Z",
            isDraft: false,
            reviewDecision: "REVIEW_REQUIRED",
            mergeable: "CONFLICTING",
            commits: {
              nodes: [
                {
                  commit: {
                    statusCheckRollup: {
                      contexts: {
                        nodes: [
                          {
                            __typename: "CheckRun",
                            status: "COMPLETED",
                            conclusion: "FAILURE",
                          },
                          {
                            __typename: "CheckRun",
                            status: "IN_PROGRESS",
                            conclusion: null,
                          },
                        ],
                      },
                    },
                  },
                },
              ],
            },
          },
        ],
      },
      refs: {
        nodes: [
          { name: "main", target: { committedDate: "2026-07-18T14:20:00Z" } },
          {
            name: "old/feature",
            target: {
              committedDate: "2026-01-01T00:00:00Z",
              associatedPullRequests: { nodes: [{ merged: false }] },
            },
          },
          {
            name: "shipped/thing",
            target: {
              committedDate: "2026-07-01T00:00:00Z",
              associatedPullRequests: { nodes: [{ merged: true }] },
            },
          },
        ],
      },
      latestRelease: base.latestRelease,
    },
  },
};

describe("collectGithubDelivery", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-07-19T00:00:00Z"));
    vi.stubEnv("GITHUB_TOKEN", "ghp_test_token");
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllEnvs();
  });

  it("parses PR, branch, and release fields on the happy path", async () => {
    const restore = mockFetchOnce(happyPathResponse);
    try {
      const observation = await collectGithubDelivery(APP);

      expect(observation.status).toBe("ok");
      const data = observation.data;
      expect(data).not.toBeNull();
      if (!data) throw new Error("expected data");

      const pr = data.pullRequests.open[0];
      if (!pr) throw new Error("expected an open PR");
      expect(pr.number).toBe(42);
      expect(pr.reviewDecision).toBe("REVIEW_REQUIRED");
      expect(pr.hasConflicts).toBe(true);
      expect(pr.failingCheckCount).toBe(1);
      expect(pr.pendingCheckCount).toBe(1);
      expect(data.pullRequests.waitingForReviewCount).toBe(1);
      expect(data.pullRequests.stalePrCount).toBe(1);

      expect(data.branches.staleCount).toBe(1);
      expect(data.branches.mergedCount).toBe(1);
      expect(data.branches.activeCount).toBe(1);

      expect(data.release?.tag).toBe("v1.4.0");
      expect(data.activity.commitsLast7d).toBe(4);
    } finally {
      restore();
    }
  });

  it("returns a non-ok observation on a rate-limited GraphQL error", async () => {
    const restore = mockFetchOnce(githubErrorResponseFixture);
    try {
      const observation = await collectGithubDelivery(APP);

      expect(observation.status).not.toBe("ok");
      expect(observation.data).toBeNull();
      expect(observation.error?.code).toBe("rate_limited");
    } finally {
      restore();
    }
  });

  it("reports unconfigured when no token is present", async () => {
    vi.stubEnv("GITHUB_TOKEN", "");
    vi.stubEnv("github_pat", "");
    const observation = await collectGithubDelivery(APP);
    expect(observation.status).toBe("unconfigured");
    expect(observation.error?.code).toBe("not_configured");
  });
});
