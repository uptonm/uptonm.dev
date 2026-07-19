import { CircleSlash } from "lucide-react";
import Link from "next/link";

export default function AppNotFound() {
  return (
    <div className="mx-auto flex min-h-screen max-w-7xl flex-col items-start justify-center px-4 py-16 sm:px-6">
      <CircleSlash className="size-8 text-muted-foreground" aria-hidden />
      <h1 className="mt-4 font-display text-2xl font-semibold tracking-tight">
        Unknown app
      </h1>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
        No fleet app matches that identifier. It may have been renamed or is not
        part of the observed fleet.
      </p>
      <Link
        href="/admin"
        className="mt-6 inline-flex min-h-11 items-center rounded-lg border border-border px-4 text-sm font-medium hover:bg-muted/40"
      >
        Back to overview
      </Link>
    </div>
  );
}
