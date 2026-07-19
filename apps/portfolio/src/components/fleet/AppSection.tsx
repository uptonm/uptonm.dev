"use client";

import { cn } from "@uptonm/ui/lib/utils";
import { ChevronDown } from "lucide-react";
import type { ReactNode } from "react";
import { useId, useState } from "react";

/**
 * Titled section wrapper. On mobile it collapses behind a full-width toggle so
 * long detail pages do not force endless scrolling; from `sm` up it is always
 * expanded and the toggle is hidden.
 */
export function AppSection({
  title,
  description,
  action,
  defaultOpen = true,
  children,
}: {
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const bodyId = useId();

  return (
    <section className="rounded-xl border border-border bg-card p-4 text-card-foreground shadow-sm shadow-foreground/[0.025] sm:rounded-2xl sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-display text-lg font-semibold tracking-tight [overflow-wrap:anywhere]">
            {title}
          </h2>
          {description ? (
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground [overflow-wrap:anywhere]">
              {description}
            </p>
          ) : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
        <button
          type="button"
          className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-border text-muted-foreground outline-none transition-colors hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-ring sm:hidden"
          aria-expanded={open}
          aria-controls={bodyId}
          onClick={() => setOpen((current) => !current)}
        >
          <span className="sr-only">
            {open ? `Collapse ${title}` : `Expand ${title}`}
          </span>
          <ChevronDown
            className={cn(
              "size-4 transition-transform",
              open ? "rotate-180" : null,
            )}
            aria-hidden
          />
        </button>
      </div>
      <div
        id={bodyId}
        className={cn("mt-4 min-w-0", open ? "block" : "hidden", "sm:block")}
      >
        {children}
      </div>
    </section>
  );
}
