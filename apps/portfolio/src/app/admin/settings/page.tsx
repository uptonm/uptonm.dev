import { AppSection } from "@/components/fleet/AppSection";
import { ConsoleNav } from "@/components/fleet/ConsoleNav";
import { MetricTile } from "@/components/fleet/MetricTile";
import {
  COLLECTION_INTERVALS_SECONDS,
  FLEET_THRESHOLDS,
} from "@/lib/fleet/thresholds";
import { FLEET_APPS } from "@/lib/fleet/registry";
import Link from "next/link";

const thresholdLabels: Record<keyof typeof FLEET_THRESHOLDS, string> = {
  stalePrDays: "Stale PR (days)",
  staleBranchDays: "Stale branch (days)",
  tlsWarningDays: "TLS warning (days)",
  tlsCriticalDays: "TLS critical (days)",
  telemetryStaleIntervalMultiplier: "Telemetry stale multiplier",
  errorRateMinSample: "Error-rate min sample",
  errorRateWarningPct: "Error-rate warning (%)",
  costWarningFraction: "Cost warning fraction",
  cronMissedGraceSeconds: "Cron grace (seconds)",
  uptimeIncidentFailureStreak: "Uptime failure streak",
};

export default function SettingsPage() {
  const navApps = FLEET_APPS.map(({ id, label }) => ({ id, label }));
  const thresholds = Object.entries(FLEET_THRESHOLDS) as Array<
    [keyof typeof FLEET_THRESHOLDS, number]
  >;
  const intervals = Object.entries(COLLECTION_INTERVALS_SECONDS);

  return (
    <div className="min-h-screen">
      <header className="border-b border-border">
        <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 sm:py-4">
          <div className="flex min-w-0 items-center gap-2">
            <Link
              href="/admin"
              className="shrink-0 font-display text-lg font-semibold tracking-tight"
            >
              uptonm.dev
            </Link>
            <span className="text-sm text-muted-foreground">/ settings</span>
          </div>
          <div className="mt-3">
            <ConsoleNav apps={navApps} />
          </div>
        </div>
      </header>

      <main
        id="main-content"
        className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12"
      >
        <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
          Settings
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          The thresholds and collection intervals that turn raw observations
          into attention signals. Read-only until Wave 3 wires editing.
        </p>

        <div className="mt-8 grid gap-4 lg:grid-cols-2">
          <AppSection
            title="Attention thresholds"
            description="Shared source of truth for badges and incident rules."
          >
            <div className="grid grid-cols-2 gap-3">
              {thresholds.map(([key, value]) => (
                <MetricTile
                  key={key}
                  label={thresholdLabels[key]}
                  value={value}
                />
              ))}
            </div>
          </AppSection>

          <AppSection
            title="Collection intervals"
            description="How often each telemetry category is refreshed (seconds)."
          >
            <div className="grid grid-cols-2 gap-3">
              {intervals.map(([key, seconds]) => (
                <MetricTile key={key} label={key} value={`${seconds}s`} />
              ))}
            </div>
          </AppSection>
        </div>
      </main>
    </div>
  );
}
