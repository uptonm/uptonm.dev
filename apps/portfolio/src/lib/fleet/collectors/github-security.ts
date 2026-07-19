import "server-only";

import {
  type Observation,
  ok,
  partial,
  unconfigured,
  unsupported,
} from "../observation";
import type { FleetApp } from "../registry";
import { collect } from "../collector/collect";
import {
  classifyError,
  fetchJson,
  ProviderRequestError,
} from "../collector/http";

const PROVIDER = "GitHub Security";
const API_BASE = "https://api.github.com";
const GITHUB_ACCEPT = "application/vnd.github+json";
const DEFAULT_BRANCH = "main";

export type SecuritySurface =
  | "dependabot"
  | "secretScanning"
  | "codeScanning"
  | "branchProtection";

export type SurfaceStatus = "ok" | "forbidden" | "unsupported";

export type SurfaceAvailability = {
  status: SurfaceStatus;
  message?: string;
};

export type SeverityCounts = {
  critical: number;
  high: number;
  medium: number;
  low: number;
};

export type DependabotSummary = {
  bySeverity: SeverityCounts;
  totalOpen: number;
};

export type CodeScanningSummary = {
  bySeverity: SeverityCounts;
  totalOpen: number;
};

export type BranchProtectionSummary = {
  branch: string;
  enabled: boolean;
  requiresPrReview: boolean;
  requiresStatusChecks: boolean;
  enforceAdmins: boolean;
  restrictsPushes: boolean;
};

export type GithubSecurityMetrics = {
  nameWithOwner: string;
  defaultBranch: string;
  dependabot: DependabotSummary | null;
  secretScanning: { totalOpen: number } | null;
  codeScanning: CodeScanningSummary | null;
  branchProtection: BranchProtectionSummary | null;
  availability: Record<SecuritySurface, SurfaceAvailability>;
};

type DependabotAlert = {
  security_advisory?: { severity?: string | null } | null;
  security_vulnerability?: { severity?: string | null } | null;
};

type CodeScanningAlert = {
  rule?: { security_severity_level?: string | null; severity?: string | null } | null;
};

type BranchProtectionResponse = {
  required_pull_request_reviews?: unknown;
  required_status_checks?: unknown;
  enforce_admins?: { enabled?: boolean | null } | null;
  restrictions?: unknown;
};

function githubToken(): string {
  return (
    process.env.GITHUB_TOKEN?.trim() || process.env.github_pat?.trim() || ""
  );
}

function emptySeverityCounts(): SeverityCounts {
  return { critical: 0, high: 0, medium: 0, low: 0 };
}

function tallySeverity(
  counts: SeverityCounts,
  severity: string | null | undefined,
): void {
  switch ((severity ?? "").toLowerCase()) {
    case "critical":
      counts.critical += 1;
      break;
    case "high":
      counts.high += 1;
      break;
    case "medium":
    case "moderate":
      counts.medium += 1;
      break;
    case "low":
      counts.low += 1;
      break;
  }
}

/** A 403/404 marks the surface unavailable; anything else propagates. */
function surfaceFailure(error: unknown): SurfaceAvailability {
  const status = error instanceof ProviderRequestError ? error.status : null;
  if (status === 403 || status === 401) {
    return { status: "forbidden", message: classifyError(PROVIDER, error).message };
  }
  if (status === 404) {
    return {
      status: "unsupported",
      message: classifyError(PROVIDER, error).message,
    };
  }
  throw error;
}

async function fetchSurface<T>(url: string, token: string): Promise<T> {
  return fetchJson<T>(url, {
    token,
    provider: PROVIDER,
    init: { headers: { Accept: GITHUB_ACCEPT } },
  });
}

function summarizeDependabot(alerts: DependabotAlert[]): DependabotSummary {
  const bySeverity = emptySeverityCounts();
  for (const alert of alerts) {
    tallySeverity(
      bySeverity,
      alert.security_advisory?.severity ??
        alert.security_vulnerability?.severity,
    );
  }
  return { bySeverity, totalOpen: alerts.length };
}

function summarizeCodeScanning(alerts: CodeScanningAlert[]): CodeScanningSummary {
  const bySeverity = emptySeverityCounts();
  for (const alert of alerts) {
    tallySeverity(
      bySeverity,
      alert.rule?.security_severity_level ?? alert.rule?.severity,
    );
  }
  return { bySeverity, totalOpen: alerts.length };
}

function summarizeBranchProtection(
  branch: string,
  response: BranchProtectionResponse,
): BranchProtectionSummary {
  return {
    branch,
    enabled: true,
    requiresPrReview: Boolean(response.required_pull_request_reviews),
    requiresStatusChecks: Boolean(response.required_status_checks),
    enforceAdmins: Boolean(response.enforce_admins?.enabled),
    restrictsPushes: Boolean(response.restrictions),
  };
}

async function loadGithubSecurity(
  app: FleetApp,
  branch: string,
): Promise<Observation<GithubSecurityMetrics>> {
  const token = githubToken();
  const nameWithOwner = `${app.github.owner}/${app.github.repo}`;
  const sourceUrl = `https://github.com/${nameWithOwner}/security`;
  const meta = { source: `${PROVIDER}:${nameWithOwner}`, sourceUrl };

  if (!token) {
    return unconfigured<GithubSecurityMetrics>(
      "Add GITHUB_TOKEN to enable security metrics.",
      meta,
    );
  }

  const repoBase = `${API_BASE}/repos/${app.github.owner}/${app.github.repo}`;
  const availability: Record<SecuritySurface, SurfaceAvailability> = {
    dependabot: { status: "ok" },
    secretScanning: { status: "ok" },
    codeScanning: { status: "ok" },
    branchProtection: { status: "ok" },
  };

  const [dependabotResult, secretResult, codeResult, protectionResult] =
    await Promise.allSettled([
      fetchSurface<DependabotAlert[]>(
        `${repoBase}/dependabot/alerts?state=open&per_page=100`,
        token,
      ),
      fetchSurface<unknown[]>(
        `${repoBase}/secret-scanning/alerts?state=open`,
        token,
      ),
      fetchSurface<CodeScanningAlert[]>(
        `${repoBase}/code-scanning/alerts?state=open`,
        token,
      ),
      fetchSurface<BranchProtectionResponse>(
        `${repoBase}/branches/${branch}/protection`,
        token,
      ),
    ]);

  let dependabot: DependabotSummary | null = null;
  if (dependabotResult.status === "fulfilled") {
    dependabot = summarizeDependabot(dependabotResult.value ?? []);
  } else {
    availability.dependabot = surfaceFailure(dependabotResult.reason);
  }

  let secretScanning: { totalOpen: number } | null = null;
  if (secretResult.status === "fulfilled") {
    secretScanning = { totalOpen: (secretResult.value ?? []).length };
  } else {
    availability.secretScanning = surfaceFailure(secretResult.reason);
  }

  let codeScanning: CodeScanningSummary | null = null;
  if (codeResult.status === "fulfilled") {
    codeScanning = summarizeCodeScanning(codeResult.value ?? []);
  } else {
    availability.codeScanning = surfaceFailure(codeResult.reason);
  }

  let branchProtection: BranchProtectionSummary | null = null;
  if (protectionResult.status === "fulfilled") {
    branchProtection = summarizeBranchProtection(
      branch,
      protectionResult.value ?? {},
    );
  } else {
    availability.branchProtection = surfaceFailure(protectionResult.reason);
  }

  const metrics: GithubSecurityMetrics = {
    nameWithOwner,
    defaultBranch: branch,
    dependabot,
    secretScanning,
    codeScanning,
    branchProtection,
    availability,
  };

  const surfaces = Object.values(availability);
  const okSurfaces = surfaces.filter((surface) => surface.status === "ok");

  if (okSurfaces.length === 0) {
    return unsupported<GithubSecurityMetrics>(
      "The configured GitHub token cannot read any security surface for this repository.",
      meta,
    );
  }

  if (okSurfaces.length < surfaces.length) {
    return partial<GithubSecurityMetrics>(
      metrics,
      {
        code: "forbidden",
        message:
          "Some GitHub security surfaces are unavailable with the configured token.",
      },
      meta,
    );
  }

  return ok<GithubSecurityMetrics>(metrics, meta);
}

export function collectGithubSecurity(
  app: FleetApp,
  opts?: { defaultBranch?: string },
): Promise<Observation<GithubSecurityMetrics>> {
  const branch = opts?.defaultBranch?.trim() || DEFAULT_BRANCH;
  return collect<GithubSecurityMetrics>({
    appId: app.id,
    category: "security",
    trigger: "manual",
    collector: () => loadGithubSecurity(app, branch),
  });
}
