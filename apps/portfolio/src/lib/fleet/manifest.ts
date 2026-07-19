/**
 * Shape of a satellite repo's `.fleet/manifest.json`.
 *
 * The manifest declares what each app *should* look like so collectors can
 * report drift (missing env var, unexpected domain, silent cron). It never
 * contains secret values — only names, scopes, and expectations.
 */
export type FleetCapability =
  | "delivery"
  | "deployments"
  | "runtime"
  | "traffic"
  | "performance"
  | "security"
  | "domains"
  | "environment"
  | "costs"
  | "maintenance"
  | "scheduledJobs";

export type EnvExpectation = {
  name: string;
  targets: Array<"production" | "preview" | "development">;
  type?: "plain" | "secret" | "system";
};

export type CronExpectation = {
  job: string;
  schedule: string;
  graceSeconds?: number;
};

export type FleetManifest = {
  version: 1;
  appId: string;
  canonicalUrl: string;
  domains: string[];
  redirects?: Array<{ from: string; to: string }>;
  healthCheckPath?: string;
  env?: EnvExpectation[];
  crons?: CronExpectation[];
  framework?: string;
  runtime?: string;
  budgets?: {
    lcpMs?: number;
    inpMs?: number;
    cls?: number;
    bundleKb?: number;
  };
  capabilities: FleetCapability[];
};

export type ManifestParseResult =
  | { ok: true; manifest: FleetManifest }
  | { ok: false; errors: string[] };

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((v) => typeof v === "string");
}

/**
 * Validate untrusted JSON into a `FleetManifest`.
 *
 * Kept dependency-free (no zod) to match the repo's lean footprint; it checks
 * only the invariants collectors rely on and tolerates optional fields.
 */
export function parseManifest(input: unknown): ManifestParseResult {
  const errors: string[] = [];
  const value = (input ?? {}) as Record<string, unknown>;

  if (value.version !== 1) errors.push("version must be 1");
  if (typeof value.appId !== "string" || !value.appId) {
    errors.push("appId is required");
  }
  if (typeof value.canonicalUrl !== "string" || !value.canonicalUrl) {
    errors.push("canonicalUrl is required");
  }
  if (!isStringArray(value.domains)) {
    errors.push("domains must be an array of strings");
  }
  if (!Array.isArray(value.capabilities)) {
    errors.push("capabilities must be an array");
  }

  if (Array.isArray(value.env)) {
    for (const [index, entry] of value.env.entries()) {
      const env = entry as Record<string, unknown>;
      if (typeof env.name !== "string" || !env.name) {
        errors.push(`env[${index}].name is required`);
      }
      if (!isStringArray(env.targets)) {
        errors.push(`env[${index}].targets must be an array of strings`);
      }
    }
  }

  if (errors.length) return { ok: false, errors };
  return { ok: true, manifest: value as unknown as FleetManifest };
}
