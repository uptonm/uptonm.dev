import { AppHealthCard } from "@/components/fleet/AppHealthCard";
import { AttentionList } from "@/components/fleet/AttentionList";
import { ConsoleNav } from "@/components/fleet/ConsoleNav";
import { getFleetOverview } from "@/lib/fleet/console-data";
import { FLEET_APPS } from "@/lib/fleet/registry";
import Link from "next/link";

export default async function OverviewPage() {
  const { attention, apps } = await getFleetOverview();
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
            <span className="text-sm text-muted-foreground">/ console</span>
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
          Fleet console
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          What needs attention first, then every app&apos;s health at a glance.
        </p>

        {/* Attention leads on every screen size, per the mobile spec. */}
        <section className="mt-8">
          <h2 className="font-display text-lg font-semibold tracking-tight">
            Needs attention
          </h2>
          <div className="mt-4">
            <AttentionList items={attention} />
          </div>
        </section>

        <section className="mt-10">
          <h2 className="font-display text-lg font-semibold tracking-tight">
            Fleet
          </h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {apps.map((app) => (
              <AppHealthCard
                key={app.id}
                id={app.id}
                label={app.label}
                url={app.url}
                iconSrc={app.iconSrc}
                isControlPlane={app.isControlPlane}
                status={app.health.status}
                attentionCount={app.health.attentionCount}
              />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
