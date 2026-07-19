import "server-only";

import { collect } from "../collector/collect";
import { classifyError, fetchJson, ProviderRequestError } from "../collector/http";
import {
  failed,
  type Observation,
  ok,
  type ObservationError,
  unconfigured,
  unsupported,
} from "../observation";
import type { FleetApp } from "../registry";
import { FLEET_THRESHOLDS } from "../thresholds";

const PROVIDER = "GitHub";
const GRAPHQL_ENDPOINT = "https://api.github.com/graphql";
const MS_PER_DAY = 24 * 60 * 60 * 1000;

export type PrReviewDecision =
  | "APPROVED"
  | "CHANGES_REQUESTED"
  | "REVIEW_REQUIRED"
  | null;

export type PullRequestQuality = {
  number: number;
  title: string;
  createdAt: string;
  ageDays: number;
  isDraft: boolean;
  reviewDecision: PrReviewDecision;
  mergeable: boolean;
  hasConflicts: boolean;
  failingCheckCount: number;
  pendingCheckCount: number;
};

export type BranchClass = "active" | "stale" | "merged" | "unknown";

export type BranchHygiene = {
  name: string;
  lastCommitAt: string | null;
  lastCommitAgeDays: number | null;
  isMerged: boolean;
  class: BranchClass;
};

export type GithubDeliveryMetrics = {
  repository: {
    nameWithOwner: string;
    url: string;
    defaultBranch: string | null;
  };
  pullRequests: {
    open: PullRequestQuality[];
    oldestPrAgeDays: number | null;
    waitingForReviewCount: number;
    stalePrCount: number;
  };
  branches: {
    items: BranchHygiene[];
    activeCount: number;
    staleCount: number;
    mergedCount: number;
    unknownCount: number;
  };
  drift: {
    defaultBranch: string | null;
    headSha: string | null;
    productionSha: string | null;
    aheadBy: number | null;
    behindBy: number | null;
    unshippedCommitCount: number | null;
  };
  release: {
    tag: string;
    publishedAt: string | null;
    url: string;
    isPrerelease: boolean;
  } | null;
  activity: {
    pushedAt: string | null;
    commitsLast7d?: number;
  };
};

type CheckNode = {
  __typename?: string;
  status?: string | null;
  conclusion?: string | null;
  state?: string | null;
};

type CommitTarget = {
  oid?: string | null;
  committedDate?: string | null;
  statusCheckRollup?: {
    contexts?: { nodes?: Array<CheckNode | null> | null } | null;
  } | null;
  associatedPullRequests?: {
    nodes?: Array<{ merged?: boolean | null } | null> | null;
  } | null;
  history?: { totalCount?: number | null } | null;
};

type PullRequestNode = {
  number?: number | null;
  title?: string | null;
  createdAt?: string | null;
  isDraft?: boolean | null;
  reviewDecision?: string | null;
  mergeable?: string | null;
  commits?: {
    nodes?: Array<{ commit?: CommitTarget | null } | null> | null;
  } | null;
};

type RefNode = {
  name?: string | null;
  target?: CommitTarget | null;
};

type RepositoryNode = {
  nameWithOwner?: string | null;
  url?: string | null;
  pushedAt?: string | null;
  defaultBranchRef?: {
    name?: string | null;
    target?: CommitTarget | null;
  } | null;
  pullRequests?: { nodes?: Array<PullRequestNode | null> | null } | null;
  refs?: { nodes?: Array<RefNode | null> | null } | null;
  latestRelease?: {
    tagName?: string | null;
    publishedAt?: string | null;
    url?: string | null;
    isPrerelease?: boolean | null;
  } | null;
};

type GraphqlResponse = {
  data?: { repository?: RepositoryNode | null } | null;
  errors?: Array<{ message?: string; type?: string }> | null;
};

type CompareResponse = {
  ahead_by?: number | null;
  behind_by?: number | null;
  total_commits?: number | null;
};

const DELIVERY_QUERY = `
  query FleetDelivery($owner: String!, $repo: String!, $since: GitTimestamp!) {
    repository(owner: $owner, name: $repo) {
      nameWithOwner
      url
      pushedAt
      defaultBranchRef {
        name
        target {
          ... on Commit {
            oid
            history(since: $since) {
              totalCount
            }
          }
        }
      }
      pullRequests(states: OPEN, first: 20, orderBy: { field: CREATED_AT, direction: ASC }) {
        nodes {
          number
          title
          createdAt
          isDraft
          reviewDecision
          mergeable
          commits(last: 1) {
            nodes {
              commit {
                statusCheckRollup {
                  contexts(first: 100) {
                    nodes {
                      __typename
                      ... on CheckRun {
                        status
                        conclusion
                      }
                      ... on StatusContext {
                        state
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
      refs(refPrefix: "refs/heads/", first: 50) {
        nodes {
          name
          target {
            ... on Commit {
              oid
              committedDate
              associatedPullRequests(first: 1) {
                nodes {
                  merged
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
  }
`;

function token(): string {
  return (
    process.env.GITHUB_TOKEN?.trim() || process.env.github_pat?.trim() || ""
  );
}

function ageDays(iso: string | null | undefined, now: number): number | null {
  if (!iso) return null;
  const parsed = Date.parse(iso);
  if (!Number.isFinite(parsed)) return null;
  return Math.max(0, Math.floor((now - parsed) / MS_PER_DAY));
}

function checkState(node: CheckNode): "failing" | "pending" | "other" {
  if (node.__typename === "StatusContext") {
    if (node.state === "FAILURE" || node.state === "ERROR") return "failing";
    if (node.state === "SUCCESS") return "other";
    return "pending";
  }
  if (node.status !== "COMPLETED") return "pending";
  if (node.conclusion === "FAILURE" || node.conclusion === "TIMED_OUT") {
    return "failing";
  }
  if (node.conclusion === "CANCELLED" || node.conclusion === "ACTION_REQUIRED") {
    return "failing";
  }
  return "other";
}

function normalizeReviewDecision(value: string | null | undefined): PrReviewDecision {
  if (
    value === "APPROVED" ||
    value === "CHANGES_REQUESTED" ||
    value === "REVIEW_REQUIRED"
  ) {
    return value;
  }
  return null;
}

function normalizePullRequest(
  node: PullRequestNode,
  now: number,
): PullRequestQuality | null {
  if (typeof node.number !== "number") return null;
  const checks = node.commits?.nodes?.[0]?.commit?.statusCheckRollup?.contexts
    ?.nodes;
  let failingCheckCount = 0;
  let pendingCheckCount = 0;
  for (const check of checks ?? []) {
    if (!check) continue;
    const state = checkState(check);
    if (state === "failing") failingCheckCount += 1;
    else if (state === "pending") pendingCheckCount += 1;
  }
  const createdAt = node.createdAt ?? new Date(now).toISOString();
  return {
    number: node.number,
    title: node.title ?? "",
    createdAt,
    ageDays: ageDays(createdAt, now) ?? 0,
    isDraft: node.isDraft ?? false,
    reviewDecision: normalizeReviewDecision(node.reviewDecision),
    mergeable: node.mergeable === "MERGEABLE",
    hasConflicts: node.mergeable === "CONFLICTING",
    failingCheckCount,
    pendingCheckCount,
  };
}

function classifyBranch(
  ref: RefNode,
  defaultBranch: string | null,
  now: number,
): BranchHygiene {
  const committedDate = ref.target?.committedDate ?? null;
  const lastCommitAgeDays = ageDays(committedDate, now);
  const isMerged = Boolean(
    ref.target?.associatedPullRequests?.nodes?.some((pr) => pr?.merged),
  );
  let branchClass: BranchClass;
  if (ref.name === defaultBranch) {
    branchClass = "active";
  } else if (lastCommitAgeDays === null) {
    branchClass = "unknown";
  } else if (isMerged) {
    branchClass = "merged";
  } else if (lastCommitAgeDays >= FLEET_THRESHOLDS.staleBranchDays) {
    branchClass = "stale";
  } else {
    branchClass = "active";
  }
  return {
    name: ref.name ?? "",
    lastCommitAt: committedDate,
    lastCommitAgeDays,
    isMerged,
    class: branchClass,
  };
}

function mapGraphqlErrors(
  errors: NonNullable<GraphqlResponse["errors"]>,
): { error: ObservationError; unsupported: boolean } {
  const detail = errors
    .map((error) => `${error.type ?? ""} ${error.message ?? ""}`)
    .join(" ")
    .toLowerCase();
  if (detail.includes("rate") && detail.includes("limit")) {
    return {
      error: {
        code: "rate_limited",
        message: `${PROVIDER} rate-limited the dashboard. Try again shortly.`,
      },
      unsupported: false,
    };
  }
  if (detail.includes("forbidden") || detail.includes("not accessible")) {
    return {
      error: {
        code: "forbidden",
        message: `${PROVIDER} denied access to this repository.`,
      },
      unsupported: true,
    };
  }
  if (detail.includes("not_found") || detail.includes("could not resolve")) {
    return {
      error: {
        code: "not_found",
        message: `${PROVIDER} could not find this repository.`,
      },
      unsupported: true,
    };
  }
  return {
    error: {
      code: "unavailable",
      message: `${PROVIDER} returned incomplete delivery metrics.`,
    },
    unsupported: false,
  };
}

async function loadDrift(
  app: FleetApp,
  authToken: string,
  headSha: string | null,
  productionSha: string | null | undefined,
): Promise<GithubDeliveryMetrics["drift"]> {
  const base = {
    defaultBranch: null as string | null,
    headSha,
    productionSha: productionSha ?? null,
    aheadBy: null as number | null,
    behindBy: null as number | null,
    unshippedCommitCount: null as number | null,
  };
  if (!productionSha || !headSha) return base;
  if (productionSha === headSha) {
    return { ...base, aheadBy: 0, behindBy: 0, unshippedCommitCount: 0 };
  }
  try {
    const compare = await fetchJson<CompareResponse>(
      `https://api.github.com/repos/${app.github.owner}/${app.github.repo}/compare/${productionSha}...${headSha}`,
      { token: authToken, provider: PROVIDER },
    );
    return {
      ...base,
      aheadBy: compare.ahead_by ?? null,
      behindBy: compare.behind_by ?? null,
      unshippedCommitCount: compare.ahead_by ?? null,
    };
  } catch {
    return base;
  }
}

/**
 * Collect PR quality, branch hygiene, production drift, and release/activity
 * signals for a fleet app's GitHub repository. Never throws: missing token,
 * HTTP failures, and GraphQL errors each map to a distinct observation status.
 */
export function collectGithubDelivery(
  app: FleetApp,
  opts?: { productionSha?: string | null },
): Promise<Observation<GithubDeliveryMetrics>> {
  const sourceUrl = `https://github.com/${app.github.owner}/${app.github.repo}`;
  const meta = { source: "github", sourceUrl };

  return collect<GithubDeliveryMetrics>({
    appId: app.id,
    category: "pullRequests",
    trigger: "manual",
    collector: async () => {
      const authToken = token();
      if (!authToken) {
        return unconfigured<GithubDeliveryMetrics>(
          "Add GITHUB_TOKEN to enable delivery metrics.",
          meta,
        );
      }

      const now = Date.now();
      const since = new Date(now - 7 * MS_PER_DAY).toISOString();

      try {
        const response = await fetchJson<GraphqlResponse>(GRAPHQL_ENDPOINT, {
          token: authToken,
          provider: PROVIDER,
          init: {
            method: "POST",
            body: JSON.stringify({
              query: DELIVERY_QUERY,
              variables: { owner: app.github.owner, repo: app.github.repo, since },
            }),
          },
        });

        const repository = response.data?.repository;
        if (!repository) {
          if (response.errors?.length) {
            const mapped = mapGraphqlErrors(response.errors);
            return mapped.unsupported
              ? unsupported<GithubDeliveryMetrics>(mapped.error.message, meta)
              : failed<GithubDeliveryMetrics>(mapped.error, meta);
          }
          return failed<GithubDeliveryMetrics>(
            {
              code: "unavailable",
              message: `${PROVIDER} returned no repository data.`,
            },
            meta,
          );
        }

        const defaultBranch = repository.defaultBranchRef?.name ?? null;
        const headSha = repository.defaultBranchRef?.target?.oid ?? null;

        const open = (repository.pullRequests?.nodes ?? [])
          .map((node) => (node ? normalizePullRequest(node, now) : null))
          .filter((pr): pr is PullRequestQuality => pr !== null);
        const oldestPrAgeDays = open.reduce<number | null>(
          (max, pr) => (max === null ? pr.ageDays : Math.max(max, pr.ageDays)),
          null,
        );
        const waitingForReviewCount = open.filter(
          (pr) => !pr.isDraft && pr.reviewDecision === "REVIEW_REQUIRED",
        ).length;
        const stalePrCount = open.filter(
          (pr) => pr.ageDays >= FLEET_THRESHOLDS.stalePrDays,
        ).length;

        const branchItems = (repository.refs?.nodes ?? [])
          .filter((ref): ref is RefNode => ref !== null)
          .map((ref) => classifyBranch(ref, defaultBranch, now));

        const drift = await loadDrift(
          app,
          authToken,
          headSha,
          opts?.productionSha,
        );

        const release = repository.latestRelease;
        const data: GithubDeliveryMetrics = {
          repository: {
            nameWithOwner: repository.nameWithOwner ?? `${app.github.owner}/${app.github.repo}`,
            url: repository.url ?? sourceUrl,
            defaultBranch,
          },
          pullRequests: {
            open,
            oldestPrAgeDays,
            waitingForReviewCount,
            stalePrCount,
          },
          branches: {
            items: branchItems,
            activeCount: branchItems.filter((b) => b.class === "active").length,
            staleCount: branchItems.filter((b) => b.class === "stale").length,
            mergedCount: branchItems.filter((b) => b.class === "merged").length,
            unknownCount: branchItems.filter((b) => b.class === "unknown").length,
          },
          drift: { ...drift, defaultBranch },
          release:
            release?.tagName && release.url
              ? {
                  tag: release.tagName,
                  publishedAt: release.publishedAt ?? null,
                  url: release.url,
                  isPrerelease: release.isPrerelease ?? false,
                }
              : null,
          activity: {
            pushedAt: repository.pushedAt ?? null,
            ...(typeof repository.defaultBranchRef?.target?.history?.totalCount ===
            "number"
              ? { commitsLast7d: repository.defaultBranchRef.target.history.totalCount }
              : {}),
          },
        };

        return ok(data, { ...meta, observedAt: new Date(now).toISOString() });
      } catch (error) {
        const observationError = classifyError(PROVIDER, error);
        if (
          error instanceof ProviderRequestError &&
          (error.status === 403 || error.status === 404)
        ) {
          return unsupported<GithubDeliveryMetrics>(
            observationError.message,
            meta,
          );
        }
        return failed<GithubDeliveryMetrics>(observationError, meta);
      }
    },
  });
}
