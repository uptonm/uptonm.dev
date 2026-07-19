import "server-only";

import { collect } from "../collector/collect";
import {
  classifyError,
  fetchJson,
  ProviderRequestError,
} from "../collector/http";
import type { EnvExpectation } from "../manifest";
import {
  type Observation,
  ok,
  partial,
  unconfigured,
  unsupported,
} from "../observation";
import type { FleetApp } from "../registry";
import { FLEET_THRESHOLDS } from "../thresholds";

const PROVIDER = "Vercel Config";
const API_BASE = "https://api.vercel.com";

export type ConfigSection = "domains" | "environment" | "billing";

export type SectionStatus = "ok" | "forbidden" | "unsupported";

export type SectionAvailability = {
  status: SectionStatus;
  message?: string;
};

export type TlsStatus = "ok" | "warning" | "critical";

export type DomainTls = {
  expiresAt: string | null;
  daysRemaining: number | null;
  status: TlsStatus | null;
};

export type DomainHealth = {
  name: string;
  verified: boolean;
  misconfigured: boolean;
  dnsTarget: string | null;
  expectedDnsTarget: string | null;
  httpsOk: boolean;
  redirect: string | null;
  redirectStatusCode: number | null;
  tls: DomainTls;
};

export type EnvTarget = "production" | "preview" | "development";

export type EnvVarMeta = {
  name: string;
  targets: EnvTarget[];
  type: string | null;
};

export type EnvDrift = {
  missing: Array<{ name: string; targets: EnvTarget[] }>;
  unexpected: string[];
  wrongTarget: Array<{
    name: string;
    expectedTargets: EnvTarget[];
    actualTargets: EnvTarget[];
  }>;
};

export type EnvironmentHealth = {
  variables: EnvVarMeta[];
  drift: EnvDrift | null;
};

export type BillingSummary = {
  supported: boolean;
  currency: string | null;
  usageCost: number | null;
  budget: number | null;
  budgetPercent: number | null;
};

export type VercelConfigMetrics = {
  projectId: string;
  projectName: string;
  teamId: string;
  domains: DomainHealth[] | null;
  environment: EnvironmentHealth | null;
  billing: BillingSummary;
  availability: Record<ConfigSection, SectionAvailability>;
};

type ProjectDomainEntry = {
  name?: string | null;
  verified?: boolean | null;
  redirect?: string | null;
  redirectStatusCode?: number | null;
};

type ProjectDomainsResponse = {
  domains?: Array<ProjectDomainEntry | null> | null;
};

type RecommendedRecord = string | { value?: string | null } | null;

type DomainConfigResponse = {
  misconfigured?: boolean | null;
  configuredBy?: string | null;
  recommendedCNAME?: RecommendedRecord[] | null;
  recommendedIPv4?: RecommendedRecord[] | null;
  acceptedChallenges?: string[] | null;
  cert?: { expiresAt?: number | string | null } | null;
};

type EnvEntry = {
  key?: string | null;
  target?: string[] | string | null;
  type?: string | null;
};

type EnvListResponse = {
  envs?: Array<EnvEntry | null> | null;
};

type BillingResponse = {
  currency?: string | null;
  total?: number | null;
  amount?: number | null;
  budget?: number | null;
  budgetAmount?: number | null;
};

function vercelToken(): string {
  return (
    process.env.VERCEL_TOKEN?.trim() || process.env.vercel_pat?.trim() || ""
  );
}

/** A 403/401 marks the section forbidden, a 404 unsupported; else propagate. */
function sectionFailure(error: unknown): SectionAvailability {
  const status = error instanceof ProviderRequestError ? error.status : null;
  if (status === 403 || status === 401) {
    return {
      status: "forbidden",
      message: classifyError(PROVIDER, error).message,
    };
  }
  if (status === 404) {
    return {
      status: "unsupported",
      message: classifyError(PROVIDER, error).message,
    };
  }
  throw error;
}

function recommendedValue(records: RecommendedRecord[] | null | undefined) {
  const first = records?.[0];
  if (!first) return null;
  if (typeof first === "string") return first;
  return first.value ?? null;
}

function daysUntil(expiresAt: number): number {
  return Math.floor((expiresAt - Date.now()) / 86_400_000);
}

function tlsFrom(config: DomainConfigResponse): DomainTls {
  const raw = config.cert?.expiresAt;
  if (raw === null || raw === undefined || raw === "") {
    return { expiresAt: null, daysRemaining: null, status: null };
  }
  const millis = typeof raw === "number" ? raw : Date.parse(raw);
  if (!Number.isFinite(millis)) {
    return { expiresAt: null, daysRemaining: null, status: null };
  }
  const daysRemaining = daysUntil(millis);
  const status: TlsStatus =
    daysRemaining <= FLEET_THRESHOLDS.tlsCriticalDays
      ? "critical"
      : daysRemaining <= FLEET_THRESHOLDS.tlsWarningDays
        ? "warning"
        : "ok";
  return {
    expiresAt: new Date(millis).toISOString(),
    daysRemaining,
    status,
  };
}

function normalizeTargets(target: EnvEntry["target"]): EnvTarget[] {
  const raw = Array.isArray(target) ? target : target ? [target] : [];
  const allowed: EnvTarget[] = ["production", "preview", "development"];
  return raw.filter((value): value is EnvTarget =>
    allowed.includes(value as EnvTarget),
  );
}

function sameTargets(left: EnvTarget[], right: EnvTarget[]): boolean {
  if (left.length !== right.length) return false;
  const sortedLeft = [...left].sort();
  const sortedRight = [...right].sort();
  return sortedLeft.every((value, index) => value === sortedRight[index]);
}

function diffEnvironment(
  variables: EnvVarMeta[],
  expected: EnvExpectation[],
): EnvDrift {
  const actualByName = new Map(variables.map((v) => [v.name, v]));
  const expectedNames = new Set(expected.map((e) => e.name));

  const missing: EnvDrift["missing"] = [];
  const wrongTarget: EnvDrift["wrongTarget"] = [];

  for (const expectation of expected) {
    const actual = actualByName.get(expectation.name);
    if (!actual) {
      missing.push({ name: expectation.name, targets: expectation.targets });
      continue;
    }
    if (!sameTargets(actual.targets, expectation.targets)) {
      wrongTarget.push({
        name: expectation.name,
        expectedTargets: expectation.targets,
        actualTargets: actual.targets,
      });
    }
  }

  const unexpected = variables
    .filter((v) => !expectedNames.has(v.name))
    .map((v) => v.name);

  return { missing, unexpected, wrongTarget };
}

async function loadDomains(
  projectId: string,
  token: string,
  teamQuery: string,
): Promise<DomainHealth[]> {
  const list = await fetchJson<ProjectDomainsResponse>(
    `${API_BASE}/v9/projects/${encodeURIComponent(projectId)}/domains${teamQuery}`,
    { token, provider: PROVIDER },
  );

  const entries = (list.domains ?? []).filter(
    (entry): entry is ProjectDomainEntry => Boolean(entry?.name),
  );

  const configs = await Promise.allSettled(
    entries.map((entry) =>
      fetchJson<DomainConfigResponse>(
        `${API_BASE}/v6/domains/${encodeURIComponent(entry.name ?? "")}/config${teamQuery}`,
        { token, provider: PROVIDER },
      ),
    ),
  );

  return entries.map((entry, index): DomainHealth => {
    const result = configs[index];
    const config: DomainConfigResponse =
      result?.status === "fulfilled" ? result.value : {};
    const verified = Boolean(entry.verified);
    const misconfigured = Boolean(config.misconfigured);
    return {
      name: entry.name ?? "",
      verified,
      misconfigured,
      dnsTarget: config.configuredBy ?? null,
      expectedDnsTarget:
        recommendedValue(config.recommendedCNAME) ??
        recommendedValue(config.recommendedIPv4),
      httpsOk: verified && !misconfigured,
      redirect: entry.redirect ?? null,
      redirectStatusCode: entry.redirectStatusCode ?? null,
      tls: tlsFrom(config),
    };
  });
}

async function loadEnvironment(
  projectId: string,
  token: string,
  teamQuery: string,
  expected: EnvExpectation[] | undefined,
): Promise<EnvironmentHealth> {
  const response = await fetchJson<EnvListResponse>(
    `${API_BASE}/v9/projects/${encodeURIComponent(projectId)}/env${teamQuery}`,
    { token, provider: PROVIDER },
  );

  const variables = (response.envs ?? [])
    .filter((entry): entry is EnvEntry => Boolean(entry?.key))
    .map(
      (entry): EnvVarMeta => ({
        name: entry.key ?? "",
        targets: normalizeTargets(entry.target),
        type: entry.type ?? null,
      }),
    );

  return {
    variables,
    drift:
      expected && expected.length > 0
        ? diffEnvironment(variables, expected)
        : null,
  };
}

const UNSUPPORTED_BILLING: BillingSummary = {
  supported: false,
  currency: null,
  usageCost: null,
  budget: null,
  budgetPercent: null,
};

async function loadBilling(
  teamId: string,
  token: string,
  teamQuery: string,
): Promise<BillingSummary> {
  try {
    const response = await fetchJson<BillingResponse>(
      `${API_BASE}/v1/teams/${encodeURIComponent(teamId)}/billing/usage${teamQuery}`,
      { token, provider: PROVIDER },
    );
    const usageCost = response.total ?? response.amount ?? null;
    const budget = response.budget ?? response.budgetAmount ?? null;
    const budgetPercent =
      usageCost !== null && budget !== null && budget > 0
        ? (usageCost / budget) * 100
        : null;
    return {
      supported: true,
      currency: response.currency ?? null,
      usageCost,
      budget,
      budgetPercent,
    };
  } catch {
    return UNSUPPORTED_BILLING;
  }
}

async function loadVercelConfig(
  app: FleetApp,
  opts: { expectedEnv?: EnvExpectation[] } | undefined,
): Promise<Observation<VercelConfigMetrics>> {
  const token = vercelToken();
  const teamId = process.env.VERCEL_TEAM_ID?.trim() ?? "";
  const meta = {
    source: `${PROVIDER}:${app.vercel.projectName}`,
    sourceUrl: `https://vercel.com/${app.vercel.projectName}/settings/domains`,
  };

  if (!token || !teamId) {
    const missing = [
      !token ? "VERCEL_TOKEN" : null,
      !teamId ? "VERCEL_TEAM_ID" : null,
    ].filter((value): value is string => Boolean(value));
    return unconfigured<VercelConfigMetrics>(
      `Add ${missing.join(" and ")} to enable domain and environment metrics.`,
      meta,
    );
  }

  const teamQuery = `?teamId=${encodeURIComponent(teamId)}`;
  const availability: Record<ConfigSection, SectionAvailability> = {
    domains: { status: "ok" },
    environment: { status: "ok" },
    billing: { status: "ok" },
  };

  const [domainsResult, envResult, billing] = await Promise.allSettled([
    loadDomains(app.vercel.projectId, token, teamQuery),
    loadEnvironment(app.vercel.projectId, token, teamQuery, opts?.expectedEnv),
    loadBilling(teamId, token, teamQuery),
  ]);

  let domains: DomainHealth[] | null = null;
  if (domainsResult.status === "fulfilled") {
    domains = domainsResult.value;
  } else {
    availability.domains = sectionFailure(domainsResult.reason);
  }

  let environment: EnvironmentHealth | null = null;
  if (envResult.status === "fulfilled") {
    environment = envResult.value;
  } else {
    availability.environment = sectionFailure(envResult.reason);
  }

  const billingSummary: BillingSummary =
    billing.status === "fulfilled" ? billing.value : UNSUPPORTED_BILLING;
  if (!billingSummary.supported) {
    availability.billing = {
      status: "unsupported",
      message: "Billing usage is unavailable for this account.",
    };
  }

  const metrics: VercelConfigMetrics = {
    projectId: app.vercel.projectId,
    projectName: app.vercel.projectName,
    teamId,
    domains,
    environment,
    billing: billingSummary,
    availability,
  };

  const coreSections = [availability.domains, availability.environment];
  const okCore = coreSections.filter((section) => section.status === "ok");

  if (okCore.length === 0) {
    return unsupported<VercelConfigMetrics>(
      "The configured Vercel token cannot read domain or environment configuration for this project.",
      meta,
    );
  }

  if (okCore.length < coreSections.length) {
    return partial<VercelConfigMetrics>(
      metrics,
      {
        code: "forbidden",
        message:
          "Some Vercel configuration sections are unavailable with the configured token.",
      },
      meta,
    );
  }

  return ok<VercelConfigMetrics>(metrics, meta);
}

export function collectVercelConfig(
  app: FleetApp,
  opts?: { expectedEnv?: EnvExpectation[] },
): Promise<Observation<VercelConfigMetrics>> {
  return collect<VercelConfigMetrics>({
    appId: app.id,
    category: "domains",
    trigger: "manual",
    collector: () => loadVercelConfig(app, opts),
  });
}
