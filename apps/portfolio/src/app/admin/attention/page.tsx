import { AttentionList } from "@/components/fleet/AttentionList";
import { ConsoleNav } from "@/components/fleet/ConsoleNav";
import { getFleetAttention } from "@/lib/fleet/console-data";
import { FLEET_APPS } from "@/lib/fleet/registry";
import Link from "next/link";

export default async function AttentionPage() {
  const items = await getFleetAttention();
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
            <span className="text-sm text-muted-foreground">/ attention</span>
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
          Needs attention
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Signals that crossed a threshold, most severe first. Clearing them
          happens in each app&apos;s detail view.
        </p>
        <div className="mt-8">
          <AttentionList items={items} />
        </div>
      </main>
    </div>
  );
}
