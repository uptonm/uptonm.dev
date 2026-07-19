import { refreshFleetMetricsAction } from "@/app/admin/actions";
import { AdminUserButton } from "@/components/AdminUserButton";
import { FleetGates } from "@/components/FleetGates";
import { FleetMetricsRefresh } from "@/components/FleetMetricsRefresh";
import { requireAdmin } from "@/lib/admin";
import { getFleetMetrics } from "@/lib/fleet-metrics";
import { GATED_APPS, getGates } from "@/lib/gates";
import { currentUser } from "@clerk/nextjs/server";
import Link from "next/link";

export default async function AdminPage() {
  // Authenticate before initiating provider API work. Layouts and pages may
  // render in parallel, so the layout guard alone is not the fetch boundary.
  await requireAdmin();
  const [user, gates, metrics] = await Promise.all([
    currentUser(),
    getGates(),
    getFleetMetrics(),
  ]);
  const name =
    user?.firstName ??
    user?.username ??
    user?.emailAddresses[0]?.emailAddress ??
    "there";

  return (
    <div className="min-h-screen">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 sm:py-4">
          <div className="flex min-w-0 items-center gap-2 sm:gap-4">
            <Link
              href="/"
              className="shrink-0 font-display text-lg font-semibold tracking-tight"
            >
              uptonm.dev
            </Link>
            <span className="hidden text-sm text-muted-foreground min-[360px]:inline">
              / dashboard
            </span>
          </div>
          <AdminUserButton />
        </div>
      </header>

      <main
        id="main-content"
        className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 md:py-16"
      >
        <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground sm:text-sm sm:tracking-[0.18em]">
          Private · Fleet operations
        </p>
        <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight [overflow-wrap:anywhere] sm:text-4xl md:text-5xl">
          Welcome back, {name}.
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted-foreground sm:mt-4 sm:text-lg">
          Privacy, repository health, CI, and production deployments for every
          site in one place.
        </p>

        <section className="mt-8 sm:mt-10">
          <div className="mb-4 flex flex-col justify-between gap-3 sm:mb-6 sm:flex-row sm:items-end sm:gap-4">
            <div>
              <h2 className="font-display text-xl font-semibold tracking-tight">
                Fleet overview
              </h2>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground sm:text-sm">
                Metrics refresh every {metrics.revalidateSeconds / 60} minutes.
                Gate changes apply within about a minute.
              </p>
            </div>
            <div className="flex w-full flex-wrap items-center justify-between gap-3 sm:w-auto sm:justify-start">
              <p className="text-xs text-muted-foreground">
                Synced{" "}
                <time dateTime={metrics.fetchedAt}>
                  {new Intl.DateTimeFormat("en", {
                    hour: "numeric",
                    minute: "2-digit",
                    timeZone: "UTC",
                    timeZoneName: "short",
                  }).format(new Date(metrics.fetchedAt))}
                </time>
              </p>
              <form action={refreshFleetMetricsAction} className="shrink-0">
                <FleetMetricsRefresh />
              </form>
            </div>
          </div>
          <div className="mt-6">
            <FleetGates
              apps={GATED_APPS.map(({ id, label, url, iconSrc }) => ({
                id,
                label,
                url,
                iconSrc,
              }))}
              initialGates={gates}
              metrics={metrics}
            />
          </div>
        </section>
      </main>
    </div>
  );
}
