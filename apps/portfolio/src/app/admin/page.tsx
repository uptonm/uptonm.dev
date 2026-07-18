import { AdminUserButton } from "@/components/AdminUserButton";
import { currentUser } from "@clerk/nextjs/server";
import Link from "next/link";

export default async function AdminPage() {
  const user = await currentUser();
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
          This is your control surface. The public site stays open; only this
          area requires a signed-in session.
        </p>

        <ul className="mt-12 space-y-4 border-t border-border pt-10 text-sm text-muted-foreground">
          <li>
            <span className="text-foreground">Session</span> — signed in via
            Clerk
            {user?.primaryEmailAddress?.emailAddress
              ? ` as ${user.primaryEmailAddress.emailAddress}`
              : ""}
            .
          </li>
          <li>
            <span className="text-foreground">Access</span> — gated by{" "}
            <code className="font-mono text-xs">requireAdmin()</code>
            {process.env.ADMIN_ALLOWED_EMAILS
              ? " with an email allowlist."
              : " (any signed-in user until ADMIN_ALLOWED_EMAILS is set)."}
          </li>
          <li>
            <span className="text-foreground">Next</span> — drop tools,
            drafts, and ops surfaces under{" "}
            <code className="font-mono text-xs">/admin/*</code>.
          </li>
        </ul>
      </main>
    </div>
  );
}
