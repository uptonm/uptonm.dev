import "server-only";

import { GATED_APPS, type GatedApp, type GatedAppId } from "@/lib/gates";
import type { FleetCapability } from "./manifest";

/**
 * Canonical, server-only registry of every app the console observes.
 *
 * Extends the public gate registry with the control-plane app (portfolio
 * itself) and the observation capabilities each app supports, so collectors
 * can skip lanes an app does not participate in rather than reporting them as
 * failures.
 */
export type FleetAppId = GatedAppId | "portfolio";

export type FleetApp = Omit<GatedApp, "id"> & {
  id: FleetAppId;
  /** Control plane hosts the console; it is observed but never gated. */
  isControlPlane: boolean;
  capabilities: readonly FleetCapability[];
};

const DEFAULT_CAPABILITIES: readonly FleetCapability[] = [
  "delivery",
  "deployments",
  "runtime",
  "domains",
  "environment",
  "security",
  "maintenance",
];

const PORTFOLIO: FleetApp = {
  id: "portfolio",
  label: "Portfolio",
  url: "https://uptonm.dev",
  iconSrc: "/gates/portfolio.png",
  github: { owner: "uptonm", repo: "uptonm.dev" },
  vercel: {
    projectId: "prj_39ukbKw9ynwxvpUyPfIisarROKAS",
    projectName: "portfolio",
  },
  isControlPlane: true,
  capabilities: DEFAULT_CAPABILITIES,
};

export const FLEET_APPS: readonly FleetApp[] = [
  PORTFOLIO,
  ...GATED_APPS.map(
    (app): FleetApp => ({
      ...app,
      isControlPlane: false,
      capabilities: DEFAULT_CAPABILITIES,
    }),
  ),
];

export function getFleetApp(id: FleetAppId): FleetApp | undefined {
  return FLEET_APPS.find((app) => app.id === id);
}

export function supportsCapability(
  app: FleetApp,
  capability: FleetCapability,
): boolean {
  return app.capabilities.includes(capability);
}
