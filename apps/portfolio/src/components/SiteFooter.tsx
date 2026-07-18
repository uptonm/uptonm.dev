import { AdminUserButton } from "@/components/AdminUserButton";
import { copy } from "@/lib/copy";
import { Show } from "@clerk/nextjs";
import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-3 px-6 py-8 text-sm text-muted-foreground sm:flex-row">
        <span className="font-display text-foreground">{copy.brand.name}</span>
        <span className="flex items-center gap-2">
          <Show when="signed-out">
            {/* Discreet, unadvertised entry to the sign-in → dashboard flow. */}
            <Link
              href="/sign-in"
              aria-label="Sign in"
              className="transition-colors hover:text-foreground"
            >
              ©
            </Link>
          </Show>
          <Show when="signed-in">
            <AdminUserButton />
          </Show>
          {new Date().getFullYear()} · Built in {copy.home.location}
        </span>
      </div>
    </footer>
  );
}
