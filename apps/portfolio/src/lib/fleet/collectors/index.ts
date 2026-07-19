import "server-only";

import { hasData, type Observation } from "@/lib/fleet/observation";
import { getManifest } from "@/lib/fleet/manifests";
import type { FleetApp } from "@/lib/fleet/registry";
import {
  collectGithubDelivery,
  type GithubDeliveryMetrics,
} from "./github-delivery";
import {
  collectGithubSecurity,
  type GithubSecurityMetrics,
} from "./github-security";
import {
  collectVercelConfig,
  type VercelConfigMetrics,
} from "./vercel-config";
import {
  collectVercelDeployments,
  type VercelDeploymentHealth,
} from "./vercel-deployments";
import {
  collectVercelMetrics,
  type VercelExperienceMetrics,
} from "./vercel-metrics";
import { probeApp, type OperationsProbeResult } from "./operations-probes";

/**
 * One app's full observation set, one field per provider lane.
 *
 * Each lane is independent: a failure or missing capability in one never
 * blanks the others. Drift is stitched here — the Vercel production SHA feeds
 * the GitHub delivery lane so ahead/behind is computed against what is
 * actually serving traffic.
 */
export type AppObservations = {
  appId: FleetApp["id"];
  delivery: Observation<GithubDeliveryMetrics>;
  security: Observation<GithubSecurityMetrics>;
  deployments: Observation<VercelDeploymentHealth>;
  experience: Observation<VercelExperienceMetrics>;
  config: Observation<VercelConfigMetrics>;
  operations: Observation<OperationsProbeResult>;
};

export async function collectApp(app: FleetApp): Promise<AppObservations> {
  const manifest = getManifest(app.id);

  // Deployments first: its production SHA anchors GitHub drift.
  const deployments = await collectVercelDeployments(app);
  const productionSha = hasData(deployments)
    ? deployments.data.currentProductionSha
    : null;

  const [delivery, security, experience, config, operations] =
    await Promise.all([
      collectGithubDelivery(app, { productionSha }),
      collectGithubSecurity(app),
      collectVercelMetrics(app),
      collectVercelConfig(app, { expectedEnv: manifest.env }),
      probeApp(app, { healthPath: manifest.healthCheckPath }),
    ]);

  return {
    appId: app.id,
    delivery,
    security,
    deployments,
    experience,
    config,
    operations,
  };
}
