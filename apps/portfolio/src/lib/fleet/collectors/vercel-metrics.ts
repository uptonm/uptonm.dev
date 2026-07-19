import "server-only";

import { collect } from "../collector/collect";
import {
  fetchJson,
  ProviderRequestError,
} from "../collector/http";
import {
  type Observation,
  ok,
  partial,
  unconfigured,
  unsupported,
} from "../observation";
import type { FleetApp } from "../registry";

const PROVIDER = "Vercel Metrics";
const API_BASE = "https://api.vercel.com";
const RUNTIME_WINDOW_MS = 24 * 60 * 60 * 1000;

/**
 * A single sub-metric section. `availability` lets callers tell a disabled or
 * inaccessible product ("unsupported"/"forbidden") apart from a real zero: when
 * the section is not "ok", `data` is `null` rather than a fabricated zero.
 */
export type SectionAvailability = "ok" | "unsupported" | "forbidden" | "error";

export type MetricSection<T> = {
  availability: SectionAvailability;
  data: T | null;
  message?: string;
};

export type RouteCount = {
  route: string;
  count: number;
};

export type ReferrerCount = {
  referrer: string;
  count: number;
};

export type RuntimeMetrics = {
  /** Total requests observed over the trailing 24h window. */
  requestVolume24h: number;
  /** Fraction of requests answering 5xx, 0-1. */
  serverErrorRate: number;
  functionInvocationFailures: number;
  p50DurationMs: number | null;
  p95DurationMs: number | null;
};

export type TrafficMetrics = {
  pageViews: number;
  visitors: number;
  topRoutes: RouteCount[];
  topReferrers: ReferrerCount[];
  bandwidthBytes: number | null;
  previousPeriod: {
    pageViews: number;
    visitors: number;
    pageViewsDeltaPct: number | null;
    visitorsDeltaPct: number | null;
  } | null;
};

export type WebVitalBreakdown = {
  key: string;
  lcpMs: number | null;
  inpMs: number | null;
  cls: number | null;
  ttfbMs: number | null;
  sampleCount: number;
};

export type PerformanceMetrics = {
  /** p75 Core Web Vitals. */
  lcpMs: number | null;
  inpMs: number | null;
  cls: number | null;
  ttfbMs: number | null;
  sampleCount: number;
  byRoute: WebVitalBreakdown[];
  byDevice: WebVitalBreakdown[];
};

export type VercelExperienceMetrics = {
  projectId: string;
  projectName: string;
  window: {
    from: string;
    to: string;
  };
  runtime: MetricSection<RuntimeMetrics>;
  traffic: MetricSection<TrafficMetrics>;
  performance: MetricSection<PerformanceMetrics>;
};

function vercelToken(): string {
  return (
    process.env.VERCEL_TOKEN?.trim() || process.env.vercel_pat?.trim() || ""
  );
}

function vercelTeamId(): string {
  return process.env.VERCEL_TEAM_ID?.trim() || "";
}

/**
 * Map a failed sub-request to a section availability. Web Analytics and Speed
 * Insights are per-project opt-in and newer, so a 404/501 means "not enabled
 * for this project" (unsupported) and a 401/403 means "token cannot read it"
 * (forbidden). Everything else is a transient error — the section degrades but
 * the overall collection still returns whatever other sections succeeded.
 */
function sectionFailure(error: unknown): {
  availability: SectionAvailability;
  message: string;
} {
  if (
    error instanceof DOMException &&
    (error.name === "AbortError" || error.name === "TimeoutError")
  ) {
    return { availability: "error", message: `${PROVIDER} took too long.` };
  }
  const status = error instanceof ProviderRequestError ? error.status : null;
  if (status === 404 || status === 501) {
    return {
      availability: "unsupported",
      message: `${PROVIDER}: this metric is not enabled for the project.`,
    };
  }
  if (status === 401 || status === 403) {
    return {
      availability: "forbidden",
      message: `${PROVIDER}: the configured token cannot read this metric.`,
    };
  }
  return {
    availability: "error",
    message: `${PROVIDER}: metric temporarily unavailable.`,
  };
}

function toSection<Raw, T>(
  result: PromiseSettledResult<Raw>,
  normalize: (value: Raw) => T,
): MetricSection<T> {
  if (result.status === "fulfilled") {
    return { availability: "ok", data: normalize(result.value) };
  }
  const { availability, message } = sectionFailure(result.reason);
  return { availability, data: null, message };
}

function numberOr<T>(value: unknown, fallback: T): number | T {
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : fallback;
}

// --- Runtime ---------------------------------------------------------------
// Vercel Observability/runtime metrics. Partially documented and shaped like
// `{ requests, errors5xx, functionErrors, duration: { p50, p95 } }`.
type RawRuntime = {
  requests?: number | null;
  errors5xx?: number | null;
  functionErrors?: number | null;
  functionInvocationFailures?: number | null;
  duration?: { p50?: number | null; p95?: number | null } | null;
};

function normalizeRuntime(raw: RawRuntime): RuntimeMetrics {
  const requests = numberOr(raw.requests, 0);
  const errors = numberOr(raw.errors5xx, 0);
  return {
    requestVolume24h: requests,
    serverErrorRate: requests > 0 ? errors / requests : 0,
    functionInvocationFailures: numberOr(
      raw.functionInvocationFailures ?? raw.functionErrors,
      0,
    ),
    p50DurationMs: numberOr(raw.duration?.p50, null),
    p95DurationMs: numberOr(raw.duration?.p95, null),
  };
}

// --- Traffic ---------------------------------------------------------------
// Vercel Web Analytics query endpoint. Enabled for only a subset of projects.
type RawTrafficBucket = { key?: string | null; total?: number | null };
type RawTraffic = {
  pageViews?: number | null;
  devices?: number | null;
  visitors?: number | null;
  bandwidth?: number | null;
  routes?: RawTrafficBucket[] | null;
  referrers?: RawTrafficBucket[] | null;
  previous?: {
    pageViews?: number | null;
    visitors?: number | null;
  } | null;
};

function deltaPct(current: number, previous: number): number | null {
  if (previous <= 0) return null;
  return ((current - previous) / previous) * 100;
}

function normalizeTraffic(raw: RawTraffic): TrafficMetrics {
  const pageViews = numberOr(raw.pageViews, 0);
  const visitors = numberOr(raw.visitors ?? raw.devices, 0);
  const previous = raw.previous
    ? {
        pageViews: numberOr(raw.previous.pageViews, 0),
        visitors: numberOr(raw.previous.visitors, 0),
      }
    : null;
  return {
    pageViews,
    visitors,
    topRoutes: (raw.routes ?? []).map((bucket) => ({
      route: bucket?.key ?? "(unknown)",
      count: numberOr(bucket?.total, 0),
    })),
    topReferrers: (raw.referrers ?? []).map((bucket) => ({
      referrer: bucket?.key ?? "(direct)",
      count: numberOr(bucket?.total, 0),
    })),
    bandwidthBytes: numberOr(raw.bandwidth, null),
    previousPeriod: previous
      ? {
          ...previous,
          pageViewsDeltaPct: deltaPct(pageViews, previous.pageViews),
          visitorsDeltaPct: deltaPct(visitors, previous.visitors),
        }
      : null,
  };
}

// --- Performance -----------------------------------------------------------
// Vercel Speed Insights vitals endpoint. Enabled for the fewest projects.
type RawVital = {
  key?: string | null;
  lcp?: number | null;
  inp?: number | null;
  cls?: number | null;
  ttfb?: number | null;
  samples?: number | null;
};
type RawPerformance = {
  p75?: RawVital | null;
  samples?: number | null;
  routes?: RawVital[] | null;
  devices?: RawVital[] | null;
};

function normalizeVital(raw: RawVital): WebVitalBreakdown {
  return {
    key: raw.key ?? "(all)",
    lcpMs: numberOr(raw.lcp, null),
    inpMs: numberOr(raw.inp, null),
    cls: numberOr(raw.cls, null),
    ttfbMs: numberOr(raw.ttfb, null),
    sampleCount: numberOr(raw.samples, 0),
  };
}

function normalizePerformance(raw: RawPerformance): PerformanceMetrics {
  const p75 = raw.p75 ?? {};
  return {
    lcpMs: numberOr(p75.lcp, null),
    inpMs: numberOr(p75.inp, null),
    cls: numberOr(p75.cls, null),
    ttfbMs: numberOr(p75.ttfb, null),
    sampleCount: numberOr(raw.samples ?? p75.samples, 0),
    byRoute: (raw.routes ?? []).map(normalizeVital),
    byDevice: (raw.devices ?? []).map(normalizeVital),
  };
}

function queryFor(
  app: FleetApp,
  teamId: string,
  from: string,
  to: string,
): string {
  return new URLSearchParams({
    projectId: app.vercel.projectId,
    teamId,
    from,
    to,
  }).toString();
}

async function loadVercelMetrics(
  app: FleetApp,
): Promise<Observation<VercelExperienceMetrics>> {
  const token = vercelToken();
  const teamId = vercelTeamId();
  const sourceUrl = `https://vercel.com/${app.vercel.projectName}/analytics`;
  const meta = {
    source: `${PROVIDER}:${app.vercel.projectId}`,
    sourceUrl,
  };

  if (!token || !teamId) {
    const missing = [
      !token ? "VERCEL_TOKEN" : null,
      !teamId ? "VERCEL_TEAM_ID" : null,
    ].filter((value): value is string => Boolean(value));
    return unconfigured<VercelExperienceMetrics>(
      `Add ${missing.join(" and ")} to enable experience metrics.`,
      meta,
    );
  }

  const now = Date.now();
  const to = new Date(now).toISOString();
  const from = new Date(now - RUNTIME_WINDOW_MS).toISOString();
  const query = queryFor(app, teamId, from, to);

  const request = <T>(path: string): Promise<T> =>
    fetchJson<T>(`${API_BASE}${path}?${query}`, { token, provider: PROVIDER });

  const [runtimeResult, trafficResult, performanceResult] =
    await Promise.allSettled([
      // Runtime request/error/duration metrics.
      request<RawRuntime>("/v1/analytics/usage"),
      // Web Analytics traffic query — opt-in per project.
      request<RawTraffic>("/v1/web-analytics/stats"),
      // Speed Insights Core Web Vitals — opt-in per project.
      request<RawPerformance>("/v1/speed-insights/vitals"),
    ]);

  const runtime = toSection(runtimeResult, normalizeRuntime);
  const traffic = toSection(trafficResult, normalizeTraffic);
  const performance = toSection(performanceResult, normalizePerformance);

  const metrics: VercelExperienceMetrics = {
    projectId: app.vercel.projectId,
    projectName: app.vercel.projectName,
    window: { from, to },
    runtime,
    traffic,
    performance,
  };

  const sections = [runtime, traffic, performance];
  const okCount = sections.filter(
    (section) => section.availability === "ok",
  ).length;

  if (okCount === 0) {
    return unsupported<VercelExperienceMetrics>(
      "No Vercel experience metrics are available for this project.",
      meta,
    );
  }
  if (okCount < sections.length) {
    return partial<VercelExperienceMetrics>(
      metrics,
      {
        code: "unsupported",
        message:
          "Some Vercel experience metrics are not enabled for this project.",
      },
      meta,
    );
  }
  return ok<VercelExperienceMetrics>(metrics, meta);
}

export function collectVercelMetrics(
  app: FleetApp,
): Promise<Observation<VercelExperienceMetrics>> {
  return collect<VercelExperienceMetrics>({
    appId: app.id,
    category: "traffic",
    trigger: "manual",
    collector: () => loadVercelMetrics(app),
  });
}
