import { type AppObservations } from "@/lib/fleet/collectors";
import { hasData } from "@/lib/fleet/observation";
import type { FleetAppId } from "@/lib/fleet/registry";
import {
  type AttentionSeverity,
  type AttentionSignal,
  deriveAttention,
} from "./attention";

export type AppHealthStatus = "healthy" | "degraded" | "down" | "unknown";

export type AppHealth = {
  appId: FleetAppId;
  status: AppHealthStatus;
  attentionCount: number;
  worstSeverity: AttentionSeverity | null;
};

const SEVERITY_RANK: Record<AttentionSeverity, number> = {
  critical: 3,
  warning: 2,
  info: 1,
};

/** Sort signals most-severe first; ties preserve input order (stable sort). */
export function sortBySeverity(signals: AttentionSignal[]): AttentionSignal[] {
  return [...signals].sort(
    (left, right) => SEVERITY_RANK[right.severity] - SEVERITY_RANK[left.severity],
  );
}

function worstSeverityOf(
  signals: AttentionSignal[],
): AttentionSeverity | null {
  let worst: AttentionSeverity | null = null;
  for (const signal of signals) {
    if (worst === null || SEVERITY_RANK[signal.severity] > SEVERITY_RANK[worst]) {
      worst = signal.severity;
    }
  }
  return worst;
}

function hasAnyData(obs: AppObservations): boolean {
  return (
    hasData(obs.delivery) ||
    hasData(obs.security) ||
    hasData(obs.deployments) ||
    hasData(obs.experience) ||
    hasData(obs.config) ||
    hasData(obs.operations)
  );
}

/**
 * Roll a full observation set up into a single health verdict. Pure and
 * deterministic. A failing external probe reports `down`; otherwise the worst
 * attention severity decides `degraded` versus `healthy`. With no data-bearing
 * lane at all the status is `unknown`.
 */
export function deriveAppHealth(obs: AppObservations): AppHealth {
  const signals = deriveAttention(obs);
  const worstSeverity = worstSeverityOf(signals);

  let status: AppHealthStatus;
  if (!hasAnyData(obs)) {
    status = "unknown";
  } else if (hasData(obs.operations) && !obs.operations.data.httpProbe.ok) {
    status = "down";
  } else if (worstSeverity === "critical" || worstSeverity === "warning") {
    status = "degraded";
  } else {
    status = "healthy";
  }

  return {
    appId: obs.appId,
    status,
    attentionCount: signals.length,
    worstSeverity,
  };
}
