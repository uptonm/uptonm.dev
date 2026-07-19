import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  real,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

/**
 * Durable store for fleet observations and everything derived from them.
 *
 * The admin console reads last-known rows from here; it never blocks on GitHub
 * or Vercel during a page render. Raw samples are pruned aggressively while
 * rollups, incidents, and audit history are retained long-term (see the
 * retention helpers in ./retention).
 */

/** One scheduled or manual collection pass across a provider category. */
export const collectionRuns = pgTable(
  "collection_runs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    category: text("category").notNull(),
    trigger: text("trigger").notNull(),
    status: text("status").notNull(),
    appId: text("app_id"),
    startedAt: timestamp("started_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    finishedAt: timestamp("finished_at", { withTimezone: true }),
    durationMs: integer("duration_ms"),
    error: text("error"),
  },
  (table) => [
    index("collection_runs_category_started_idx").on(
      table.category,
      table.startedAt,
    ),
  ],
);

/** Latest raw observation per (app, category), plus append-only history. */
export const observations = pgTable(
  "observations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    runId: uuid("run_id").references(() => collectionRuns.id, {
      onDelete: "set null",
    }),
    appId: text("app_id").notNull(),
    category: text("category").notNull(),
    status: text("status").notNull(),
    source: text("source").notNull(),
    sourceUrl: text("source_url"),
    data: jsonb("data"),
    errorCode: text("error_code"),
    errorMessage: text("error_message"),
    observedAt: timestamp("observed_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    staleAt: timestamp("stale_at", { withTimezone: true }),
  },
  (table) => [
    index("observations_app_category_observed_idx").on(
      table.appId,
      table.category,
      table.observedAt,
    ),
  ],
);

/** Time-bucketed aggregates (hourly/daily) computed from raw observations. */
export const metricRollups = pgTable(
  "metric_rollups",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    appId: text("app_id").notNull(),
    metric: text("metric").notNull(),
    granularity: text("granularity").notNull(),
    bucketStart: timestamp("bucket_start", { withTimezone: true }).notNull(),
    value: real("value"),
    sampleCount: integer("sample_count").notNull().default(0),
    meta: jsonb("meta"),
  },
  (table) => [
    uniqueIndex("metric_rollups_unique_bucket_idx").on(
      table.appId,
      table.metric,
      table.granularity,
      table.bucketStart,
    ),
  ],
);

/** Deployment history mirrored from Vercel for drift and rollback targets. */
export const deployments = pgTable(
  "deployments",
  {
    id: text("id").primaryKey(),
    appId: text("app_id").notNull(),
    environment: text("environment").notNull(),
    state: text("state").notNull(),
    branch: text("branch"),
    commitSha: text("commit_sha"),
    commitMessage: text("commit_message"),
    isProductionServing: boolean("is_production_serving")
      .notNull()
      .default(false),
    createdAt: timestamp("created_at", { withTimezone: true }),
    readyAt: timestamp("ready_at", { withTimezone: true }),
    buildDurationMs: integer("build_duration_ms"),
    inspectorUrl: text("inspector_url"),
    errorCode: text("error_code"),
    recordedAt: timestamp("recorded_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("deployments_app_created_idx").on(table.appId, table.createdAt),
  ],
);

/** External HTTP/DNS/TLS probe results feeding uptime and incident logic. */
export const healthChecks = pgTable(
  "health_checks",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    appId: text("app_id").notNull(),
    kind: text("kind").notNull(),
    target: text("target").notNull(),
    ok: boolean("ok").notNull(),
    statusCode: integer("status_code"),
    latencyMs: integer("latency_ms"),
    detail: jsonb("detail"),
    checkedAt: timestamp("checked_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("health_checks_app_checked_idx").on(table.appId, table.checkedAt),
  ],
);

/** Deterministic "needs attention" items derived from observations. */
export const attentionItems = pgTable(
  "attention_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    fingerprint: text("fingerprint").notNull(),
    appId: text("app_id").notNull(),
    rule: text("rule").notNull(),
    severity: text("severity").notNull(),
    title: text("title").notNull(),
    detail: text("detail"),
    sourceUrl: text("source_url"),
    firstSeenAt: timestamp("first_seen_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),
  },
  (table) => [
    uniqueIndex("attention_items_fingerprint_idx").on(table.fingerprint),
    index("attention_items_app_severity_idx").on(table.appId, table.severity),
  ],
);

/** Operator acknowledgement / snooze state for an attention fingerprint. */
export const attentionState = pgTable("attention_state", {
  fingerprint: text("fingerprint").primaryKey(),
  acknowledgedBy: text("acknowledged_by"),
  acknowledgedAt: timestamp("acknowledged_at", { withTimezone: true }),
  snoozedUntil: timestamp("snoozed_until", { withTimezone: true }),
  note: text("note"),
});

/** Uptime / delivery incidents with an open→resolved lifecycle. */
export const incidents = pgTable(
  "incidents",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    appId: text("app_id").notNull(),
    kind: text("kind").notNull(),
    severity: text("severity").notNull(),
    summary: text("summary").notNull(),
    startedAt: timestamp("started_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),
    detail: jsonb("detail"),
  },
  (table) => [index("incidents_app_started_idx").on(table.appId, table.startedAt)],
);

/** Scheduled-job heartbeats and outcomes; missed runs are inferred. */
export const cronRuns = pgTable(
  "cron_runs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    appId: text("app_id").notNull(),
    job: text("job").notNull(),
    status: text("status").notNull(),
    startedAt: timestamp("started_at", { withTimezone: true }),
    finishedAt: timestamp("finished_at", { withTimezone: true }),
    durationMs: integer("duration_ms"),
    detail: jsonb("detail"),
    recordedAt: timestamp("recorded_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("cron_runs_app_job_idx").on(table.appId, table.job)],
);

/** Append-only record of every gate change, refresh, and provider action. */
export const auditEvents = pgTable(
  "audit_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    actor: text("actor").notNull(),
    action: text("action").notNull(),
    appId: text("app_id"),
    result: text("result").notNull(),
    before: jsonb("before"),
    after: jsonb("after"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("audit_events_created_idx").on(table.createdAt)],
);

/** Idempotency + status tracking for mutating provider actions. */
export const actionRequests = pgTable(
  "action_requests",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    idempotencyKey: text("idempotency_key").notNull(),
    actor: text("actor").notNull(),
    action: text("action").notNull(),
    appId: text("app_id"),
    status: text("status").notNull(),
    input: jsonb("input"),
    result: jsonb("result"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
  },
  (table) => [
    uniqueIndex("action_requests_idempotency_idx").on(table.idempotencyKey),
  ],
);
