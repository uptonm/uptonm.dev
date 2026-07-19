import { AppSection } from "@/components/fleet/AppSection";
import { ActivityTimeline } from "@/components/fleet/ActivityTimeline";
import { ConsoleNav } from "@/components/fleet/ConsoleNav";
import { MetricTile } from "@/components/fleet/MetricTile";
import { ObservationBoundary } from "@/components/fleet/ObservationState";
import { buildAppDetailSample } from "@/components/fleet/sample";
import { FLEET_APPS, getFleetApp } from "@/lib/fleet/registry";
import type { FleetAppId } from "@/lib/fleet/registry";
import { ArrowUpRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function AppDetailPage({
  params,
}: {
  params: Promise<{ appId: string }>;
}) {
  const { appId } = await params;
  const app = getFleetApp(appId as FleetAppId);
  if (!app) notFound();

  const sample = buildAppDetailSample(app.id);
  const navApps = FLEET_APPS.map(({ id, label }) => ({ id, label }));

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
            <span className="text-sm text-muted-foreground">/ {app.label}</span>
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
        <div className="flex min-w-0 items-start gap-3">
          <Image
            src={app.iconSrc}
            alt=""
            width={48}
            height={48}
            className="size-12 shrink-0 rounded-xl"
            aria-hidden
          />
          <div className="min-w-0">
            <h1 className="font-display text-2xl font-semibold tracking-tight [overflow-wrap:anywhere] sm:text-3xl">
              {app.label}
              {app.isControlPlane ? (
                <span className="ml-2 align-middle text-xs font-normal text-muted-foreground">
                  Control plane
                </span>
              ) : null}
            </h1>
            <a
              href={app.url}
              target="_blank"
              rel="noreferrer"
              className="mt-1 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground [overflow-wrap:anywhere]"
            >
              {app.url}
              <ArrowUpRight className="size-3.5 shrink-0" aria-hidden />
            </a>
          </div>
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-2">
          <AppSection
            title="Delivery"
            description="CI, pull requests, and production deploys."
          >
            <ObservationBoundary observation={sample.delivery}>
              {(data) => (
                <div className="grid grid-cols-2 gap-3">
                  <MetricTile label="CI" value={data.ciState} />
                  <MetricTile
                    label="Open PRs"
                    value={data.openPullRequests}
                    subtext={`${data.stalePullRequests} stale`}
                  />
                  <MetricTile label="Deploy" value={data.deploymentState} />
                  <MetricTile
                    label="Drift"
                    value={data.liveMatchesHead ? "In sync" : "Behind"}
                    subtext={`branch ${data.productionBranch}`}
                  />
                </div>
              )}
            </ObservationBoundary>
          </AppSection>

          <AppSection
            title="Experience"
            description="Uptime, Core Web Vitals, and error rate."
          >
            <ObservationBoundary observation={sample.experience}>
              {(data) => (
                <div className="grid grid-cols-2 gap-3">
                  <MetricTile label="Uptime" value={`${data.uptimePct}%`} />
                  <MetricTile label="LCP" value={`${data.lcpMs}ms`} />
                  <MetricTile label="INP" value={`${data.inpMs}ms`} />
                  <MetricTile
                    label="Error rate"
                    value={`${data.errorRatePct}%`}
                    subtext={`CLS ${data.cls}`}
                  />
                </div>
              )}
            </ObservationBoundary>
          </AppSection>

          <AppSection
            title="Configuration"
            description="Domains, TLS, and environment drift."
          >
            <ObservationBoundary observation={sample.configuration}>
              {(data) => (
                <div className="grid grid-cols-2 gap-3">
                  <MetricTile label="Domains" value={data.domainCount} />
                  <MetricTile
                    label="TLS"
                    value={`${data.tlsDaysRemaining}d`}
                    subtext="until renewal"
                  />
                  <MetricTile
                    label="Env vars"
                    value={data.envVarsExpected}
                    subtext={`${data.envVarsMissing} missing`}
                  />
                  <MetricTile label="Drift" value={data.driftCount} />
                </div>
              )}
            </ObservationBoundary>
          </AppSection>

          <AppSection
            title="Operations"
            description="Scheduled jobs, incidents, and cost."
          >
            <ObservationBoundary observation={sample.operations}>
              {(data) => (
                <div className="grid grid-cols-2 gap-3">
                  <MetricTile
                    label="Crons"
                    value={`${data.cronsHealthy}/${data.cronsTotal}`}
                  />
                  <MetricTile label="Incidents" value={data.openIncidents} />
                  <MetricTile
                    label="Cost"
                    value={`$${data.monthlyCostUsd}`}
                    subtext={`of $${data.budgetUsd} budget`}
                  />
                </div>
              )}
            </ObservationBoundary>
          </AppSection>
        </div>

        <div className="mt-4">
          <AppSection title="Activity" description="Recent events for this app.">
            <ActivityTimeline entries={sample.activity} showApp={false} />
          </AppSection>
        </div>
      </main>
    </div>
  );
}
