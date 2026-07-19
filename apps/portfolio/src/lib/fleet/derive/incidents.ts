import { type AppObservations } from "@/lib/fleet/collectors";
import { evaluateUptimeIncident } from "@/lib/fleet/collectors/operations-probes";
import { hasData } from "@/lib/fleet/observation";
import type { FleetAppId } from "@/lib/fleet/registry";

export type IncidentKind = "uptime" | "deploy-failure";

export type IncidentSeverity = "critical" | "warning";

export type IncidentToOpen = {
  appId: FleetAppId;
  kind: IncidentKind;
  severity: IncidentSeverity;
  summary: string;
};

export type IncidentActions = {
  open: IncidentToOpen[];
  resolve: string[];
};

/**
 * Decide the incident lifecycle transitions implied by the current
 * observations and recent probe history. Pure and deterministic: an incident
 * kind is opened only when its condition holds and no incident of that kind is
 * already open, and an existing open incident is resolved once its condition
 * clears.
 */
export function deriveIncidentActions(
  existingOpen: Array<{ id: string; kind: string }>,
  obs: AppObservations,
  recentProbes: Array<{ ok: boolean }>,
): IncidentActions {
  const open: IncidentToOpen[] = [];
  const resolve: string[] = [];

  const openByKind = new Map<string, string>();
  for (const incident of existingOpen) {
    if (!openByKind.has(incident.kind)) {
      openByKind.set(incident.kind, incident.id);
    }
  }

  const uptime = evaluateUptimeIncident(recentProbes);
  const uptimeOpenId = openByKind.get("uptime");
  if (uptime.shouldOpen) {
    if (!uptimeOpenId) {
      open.push({
        appId: obs.appId,
        kind: "uptime",
        severity: "critical",
        summary: `External probe failed ${uptime.consecutiveFailures} times in a row.`,
      });
    }
  } else if (uptimeOpenId) {
    resolve.push(uptimeOpenId);
  }

  const deployFailing =
    hasData(obs.deployments) && obs.deployments.data.latestFailure !== null;
  const deployOpenId = openByKind.get("deploy-failure");
  if (deployFailing) {
    if (!deployOpenId) {
      const failure = hasData(obs.deployments)
        ? obs.deployments.data.latestFailure
        : null;
      open.push({
        appId: obs.appId,
        kind: "deploy-failure",
        severity: "warning",
        summary: failure?.errorCode
          ? `Latest production deploy failed: ${failure.errorCode}.`
          : "Latest production deploy ended in an error state.",
      });
    }
  } else if (deployOpenId) {
    resolve.push(deployOpenId);
  }

  return { open, resolve };
}
