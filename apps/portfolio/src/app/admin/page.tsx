import { AdminUserButton } from "@/components/AdminUserButton";
import { FleetGates } from "@/components/FleetGates";
import { GATED_APPS, getGates } from "@/lib/gates";
import { currentUser } from "@clerk/nextjs/server";
import Link from "next/link";

export default async function AdminPage() {
  const [user, gates] = await Promise.all([currentUser(), getGates()]);
  const name =
    user?.firstName ??
    user?.username ??
    user?.emailAddresses[0]?.emailAddress ??
    "there";

  return (
    <div className="min-h-screen">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="font-display text-lg font-semibold tracking-tight"
            >
              uptonm.dev
            </Link>
            <span className="text-sm text-muted-foreground">/ dashboard</span>
          </div>
          <AdminUserButton />
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-16 md:py-24">
        <p className="text-sm uppercase tracking-[0.18em] text-muted-foreground">
          Private
        </p>
        <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight md:text-5xl">
          Welcome back, {name}.
        </h1>
        <p className="mt-4 max-w-xl text-lg text-muted-foreground">
          Toggle a site private to require Clerk login. Public sites stay open.
        </p>

        <section className="mt-12">
          <h2 className="font-display text-xl font-semibold tracking-tight">
            Fleet gates
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            On = private (login required). Changes apply within about a minute.
          </p>
          <div className="mt-6">
            <FleetGates apps={GATED_APPS} initialGates={gates} />
          </div>
        </section>
      </main>
    </div>
  );
}
