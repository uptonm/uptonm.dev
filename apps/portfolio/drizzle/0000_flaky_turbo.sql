CREATE TABLE "action_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"idempotency_key" text NOT NULL,
	"actor" text NOT NULL,
	"action" text NOT NULL,
	"app_id" text,
	"status" text NOT NULL,
	"input" jsonb,
	"result" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "attention_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"fingerprint" text NOT NULL,
	"app_id" text NOT NULL,
	"rule" text NOT NULL,
	"severity" text NOT NULL,
	"title" text NOT NULL,
	"detail" text,
	"source_url" text,
	"first_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"resolved_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "attention_state" (
	"fingerprint" text PRIMARY KEY NOT NULL,
	"acknowledged_by" text,
	"acknowledged_at" timestamp with time zone,
	"snoozed_until" timestamp with time zone,
	"note" text
);
--> statement-breakpoint
CREATE TABLE "audit_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor" text NOT NULL,
	"action" text NOT NULL,
	"app_id" text,
	"result" text NOT NULL,
	"before" jsonb,
	"after" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "collection_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"category" text NOT NULL,
	"trigger" text NOT NULL,
	"status" text NOT NULL,
	"app_id" text,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"finished_at" timestamp with time zone,
	"duration_ms" integer,
	"error" text
);
--> statement-breakpoint
CREATE TABLE "cron_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"app_id" text NOT NULL,
	"job" text NOT NULL,
	"status" text NOT NULL,
	"started_at" timestamp with time zone,
	"finished_at" timestamp with time zone,
	"duration_ms" integer,
	"detail" jsonb,
	"recorded_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "deployments" (
	"id" text PRIMARY KEY NOT NULL,
	"app_id" text NOT NULL,
	"environment" text NOT NULL,
	"state" text NOT NULL,
	"branch" text,
	"commit_sha" text,
	"commit_message" text,
	"is_production_serving" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone,
	"ready_at" timestamp with time zone,
	"build_duration_ms" integer,
	"inspector_url" text,
	"error_code" text,
	"recorded_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "health_checks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"app_id" text NOT NULL,
	"kind" text NOT NULL,
	"target" text NOT NULL,
	"ok" boolean NOT NULL,
	"status_code" integer,
	"latency_ms" integer,
	"detail" jsonb,
	"checked_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "incidents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"app_id" text NOT NULL,
	"kind" text NOT NULL,
	"severity" text NOT NULL,
	"summary" text NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"resolved_at" timestamp with time zone,
	"detail" jsonb
);
--> statement-breakpoint
CREATE TABLE "metric_rollups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"app_id" text NOT NULL,
	"metric" text NOT NULL,
	"granularity" text NOT NULL,
	"bucket_start" timestamp with time zone NOT NULL,
	"value" real,
	"sample_count" integer DEFAULT 0 NOT NULL,
	"meta" jsonb
);
--> statement-breakpoint
CREATE TABLE "observations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"run_id" uuid,
	"app_id" text NOT NULL,
	"category" text NOT NULL,
	"status" text NOT NULL,
	"source" text NOT NULL,
	"source_url" text,
	"data" jsonb,
	"error_code" text,
	"error_message" text,
	"observed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"stale_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "observations" ADD CONSTRAINT "observations_run_id_collection_runs_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."collection_runs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "action_requests_idempotency_idx" ON "action_requests" USING btree ("idempotency_key");--> statement-breakpoint
CREATE UNIQUE INDEX "attention_items_fingerprint_idx" ON "attention_items" USING btree ("fingerprint");--> statement-breakpoint
CREATE INDEX "attention_items_app_severity_idx" ON "attention_items" USING btree ("app_id","severity");--> statement-breakpoint
CREATE INDEX "audit_events_created_idx" ON "audit_events" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "collection_runs_category_started_idx" ON "collection_runs" USING btree ("category","started_at");--> statement-breakpoint
CREATE INDEX "cron_runs_app_job_idx" ON "cron_runs" USING btree ("app_id","job");--> statement-breakpoint
CREATE INDEX "deployments_app_created_idx" ON "deployments" USING btree ("app_id","created_at");--> statement-breakpoint
CREATE INDEX "health_checks_app_checked_idx" ON "health_checks" USING btree ("app_id","checked_at");--> statement-breakpoint
CREATE INDEX "incidents_app_started_idx" ON "incidents" USING btree ("app_id","started_at");--> statement-breakpoint
CREATE UNIQUE INDEX "metric_rollups_unique_bucket_idx" ON "metric_rollups" USING btree ("app_id","metric","granularity","bucket_start");--> statement-breakpoint
CREATE INDEX "observations_app_category_observed_idx" ON "observations" USING btree ("app_id","category","observed_at");