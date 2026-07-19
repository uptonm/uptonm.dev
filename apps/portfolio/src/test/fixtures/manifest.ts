import type { FleetManifest } from "@/lib/fleet/manifest";

/** A valid manifest that `parseManifest` accepts (`ok: true`). */
export const fleetManifestFixture: FleetManifest = {
  version: 1,
  appId: "console",
  canonicalUrl: "https://console.example.dev",
  domains: ["console.example.dev", "www.console.example.dev"],
  redirects: [{ from: "/old", to: "/new" }],
  healthCheckPath: "/api/health",
  env: [
    { name: "DATABASE_URL", targets: ["production", "preview"], type: "secret" },
    { name: "FEATURE_FLAG", targets: ["development"], type: "plain" },
  ],
  crons: [{ job: "digest", schedule: "0 9 * * *", graceSeconds: 300 }],
  framework: "nextjs",
  runtime: "nodejs20.x",
  budgets: { lcpMs: 2500, inpMs: 200, cls: 0.1, bundleKb: 180 },
  capabilities: ["deployments", "domains", "environment", "scheduledJobs"],
};

/**
 * An invalid manifest missing required fields (`appId`, `canonicalUrl`,
 * `domains`, `capabilities`) that `parseManifest` rejects (`ok: false`).
 * Typed loosely because it deliberately violates the `FleetManifest` shape.
 */
export const invalidManifestFixture: unknown = {
  version: 2,
  env: [{ name: "", targets: "production" }],
};
