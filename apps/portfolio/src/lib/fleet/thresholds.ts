/**
 * Configurable thresholds that turn raw observations into attention signals.
 *
 * These are the plan's suggested defaults in one place so attention rules,
 * incident logic, and UI badges all read from a single source of truth.
 */
export const FLEET_THRESHOLDS = {
  stalePrDays: 14,
  staleBranchDays: 30,
  tlsWarningDays: 21,
  tlsCriticalDays: 7,
  /** Telemetry is stale once older than this multiple of its collection interval. */
  telemetryStaleIntervalMultiplier: 2,
  /** Minimum requests before an error-rate alert is trustworthy. */
  errorRateMinSample: 100,
  errorRateWarningPct: 1,
  /** Cost warning fires at this fraction of the configured budget. */
  costWarningFraction: 0.8,
  /** Extra time a cron may miss its slot before being flagged. */
  cronMissedGraceSeconds: 300,
  /** Consecutive failed external probes before opening an uptime incident. */
  uptimeIncidentFailureStreak: 2,
} as const;

export type FleetThresholds = typeof FLEET_THRESHOLDS;

export const COLLECTION_INTERVALS_SECONDS = {
  ci: 180,
  deployments: 180,
  drift: 180,
  runtimeProbe: 180,
  pullRequests: 900,
  branches: 900,
  traffic: 900,
  performance: 900,
  security: 3600,
  domains: 3600,
  environment: 3600,
  maintenance: 21_600,
  costs: 21_600,
} as const;

export type CollectionCategory = keyof typeof COLLECTION_INTERVALS_SECONDS;
