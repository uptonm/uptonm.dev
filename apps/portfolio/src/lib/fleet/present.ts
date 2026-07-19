import "server-only";

import type { AppObservations } from "@/lib/fleet/collectors/index";
import {
  hasData,
  type Observation,
  ok,
  partial,
  stale,
  unconfigured,
  unsupported,
} from "@/lib/fleet/observation";
import type {
  AppDetailSample,
  ConfigurationSample,
  DeliverySample,
  ExperienceSample,
  OperationsSample,
} from "@/components/fleet/sample";

/**
 * Maps the rich per-lane collector output onto the condensed section
 * view-models the console shells already render. This is the only seam where
 * live telemetry meets the F4 UI, so the components stay untouched.
 *
 * Observation status is preserved lane-by-lane: a section whose underlying
 * lane is unsupported/unconfigured/error renders that state rather than a
 * fabricated value.
 */

type Meta = {
  source: string;
  observedAt?: string;
  staleAt?: string;
};

function metaOf<T>(observation: Observation<T>): Meta {
  return {
    source: observation.source,
    observedAt: observation.observedAt ?? undefined,
    staleAt: observation.staleAt ?? undefined,
  };
}

/** Re-wrap a mapped value in the same non-ok status as its source lane. */
function carry<S, T>(
  source: Observation<S>,
  map: (data: S) => T,
): Observation<T> {
  const meta = metaOf(source);
  switch (source.status) {
    case "ok":
      return source.data === null
        ? unsupported("No data returned.", meta)
        : ok(map(source.data), meta);
    case "partial":
      return source.data === null
        ? unsupported("No data returned.", meta)
        : partial(
            map(source.data),
            source.error ?? { code: "unavailable", message: "Partial data." },
            meta,
          );
    case "stale":
      return source.data === null
        ? unsupported("No data returned.", meta)
        : stale(map(source.data), meta);
    case "unconfigured":
      return unconfigured(source.error?.message ?? "Not configured.", meta);
    case "unsupported":
      return unsupported(source.error?.message ?? "Not available.", meta);
    default:
      return {
        ...unsupported<T>(
          source.error?.message ?? "Temporarily unavailable.",
          meta,
        ),
        status: "error",
        error: source.error ?? {
          code: "unavailable",
          message: "Temporarily unavailable.",
        },
      };
  }
}

function presentDelivery(obs: AppObservations): Observation<DeliverySample> {
  const deployState = hasData(obs.deployments) ? obs.deployments.data : null;
  return carry(obs.delivery, (d): DeliverySample => {
    const headSha = d.drift.headSha;
    const prodSha = d.drift.productionSha ?? deployState?.currentProductionSha;
    return {
      ciState: "none",
      openPullRequests: d.pullRequests.open.length,
      stalePullRequests: d.pullRequests.stalePrCount,
      deploymentState: "UNKNOWN",
      productionBranch: d.repository.defaultBranch ?? "main",
      liveMatchesHead: Boolean(headSha && prodSha && headSha === prodSha),
      lastDeployAt: deployState?.latestFailure?.createdAt ?? d.activity.pushedAt ?? "",
    };
  });
}

function presentExperience(obs: AppObservations): Observation<ExperienceSample> {
  const probe = hasData(obs.operations) ? obs.operations.data : null;
  const uptimePct = probe?.httpProbe.ok ? 100 : probe ? 0 : 0;
  return carry(obs.experience, (e): ExperienceSample => {
    const perf = e.performance.data;
    const runtime = e.runtime.data;
    return {
      uptimePct,
      lcpMs: perf?.lcpMs ?? 0,
      inpMs: perf?.inpMs ?? 0,
      cls: perf?.cls ?? 0,
      errorRatePct: runtime ? runtime.serverErrorRate * 100 : 0,
    };
  });
}

function presentConfiguration(
  obs: AppObservations,
): Observation<ConfigurationSample> {
  return carry(obs.config, (c): ConfigurationSample => {
    const tlsDays = (c.domains ?? [])
      .map((domain) => domain.tls?.daysRemaining)
      .filter((days): days is number => typeof days === "number")
      .sort((a, b) => a - b)[0];
    const drift = c.environment?.drift ?? null;
    return {
      domainCount: c.domains?.length ?? 0,
      tlsDaysRemaining: tlsDays ?? 0,
      envVarsExpected: c.environment?.variables.length ?? 0,
      envVarsMissing: drift?.missing.length ?? 0,
      driftCount:
        (drift?.missing.length ?? 0) +
        (drift?.unexpected.length ?? 0) +
        (drift?.wrongTarget.length ?? 0),
    };
  });
}

function presentOperations(
  obs: AppObservations,
): Observation<OperationsSample> {
  return carry(obs.config, (c): OperationsSample => ({
    cronsHealthy: 0,
    cronsTotal: 0,
    openIncidents: 0,
    monthlyCostUsd: c.billing.usageCost ?? 0,
    budgetUsd: c.billing.budget ?? 0,
  }));
}

export function presentAppDetail(obs: AppObservations): AppDetailSample {
  return {
    delivery: presentDelivery(obs),
    experience: presentExperience(obs),
    configuration: presentConfiguration(obs),
    operations: presentOperations(obs),
    activity: [],
  };
}
