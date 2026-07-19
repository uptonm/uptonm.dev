import type { FleetAppId } from "./registry";
import type { FleetManifest } from "./manifest";

/**
 * Central source of truth for what each app *should* look like.
 *
 * The plan's target is a `.fleet/manifest.json` committed into each satellite
 * repo; until those per-repo PRs land, the console reads expectations from
 * here so drift collectors (domains, environment, crons) have something to
 * compare against. Keep this in sync with each repo's real config — and never
 * put secret values here, only names, domains, and expectations.
 */
const domainFromUrl = (url: string): string => new URL(url).host;

function manifest(
  appId: FleetAppId,
  url: string,
  overrides: Partial<FleetManifest> = {},
): FleetManifest {
  return {
    version: 1,
    appId,
    canonicalUrl: url,
    domains: [domainFromUrl(url)],
    capabilities: [
      "delivery",
      "deployments",
      "runtime",
      "domains",
      "environment",
      "security",
      "maintenance",
    ],
    ...overrides,
  };
}

export const FLEET_MANIFESTS: Record<FleetAppId, FleetManifest> = {
  portfolio: manifest("portfolio", "https://uptonm.dev", {
    env: [
      { name: "DATABASE_URL", targets: ["production", "preview"] },
      { name: "CLERK_SECRET_KEY", targets: ["production", "preview"] },
      { name: "GATES_ORG_ID", targets: ["production"] },
    ],
    framework: "nextjs",
  }),
  budget: manifest("budget", "https://budget.uptonm.dev", {
    env: [{ name: "NEON_DATABASE_URL", targets: ["production", "preview"] }],
  }),
  facet: manifest("facet", "https://facet.uptonm.dev", {
    // SEO site — no database.
    capabilities: [
      "delivery",
      "deployments",
      "runtime",
      "domains",
      "environment",
      "security",
      "performance",
      "maintenance",
    ],
  }),
  home: manifest("home", "https://home.uptonm.dev"),
  cairn: manifest("cairn", "https://cairn.uptonm.dev"),
  "maplibre-gl-style-editor": manifest(
    "maplibre-gl-style-editor",
    "https://map.uptonm.dev",
  ),
  "convert-kit": manifest("convert-kit", "https://convert.uptonm.dev"),
};

export function getManifest(appId: FleetAppId): FleetManifest {
  return FLEET_MANIFESTS[appId];
}
