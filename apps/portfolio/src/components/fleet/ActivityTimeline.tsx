import { cn } from "@uptonm/ui/lib/utils";
import {
  FileClock,
  Rocket,
  Settings2,
  TriangleAlert,
} from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import type { ActivityEntry, ActivityKind } from "./sample";

const kindStyles: Record<
  ActivityKind,
  { icon: ReactNode; ring: string }
> = {
  deploy: {
    icon: <Rocket className="size-3.5" aria-hidden />,
    ring: "text-sky-700 dark:text-sky-300",
  },
  incident: {
    icon: <TriangleAlert className="size-3.5" aria-hidden />,
    ring: "text-red-700 dark:text-red-300",
  },
  config: {
    icon: <Settings2 className="size-3.5" aria-hidden />,
    ring: "text-amber-700 dark:text-amber-300",
  },
  audit: {
    icon: <FileClock className="size-3.5" aria-hidden />,
    ring: "text-muted-foreground",
  },
};

function timestamp(value: string): string {
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) return "";
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC",
    timeZoneName: "short",
  }).format(new Date(parsed));
}

export function ActivityTimeline({
  entries,
  showApp = true,
}: {
  entries: readonly ActivityEntry[];
  showApp?: boolean;
}) {
  if (entries.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border bg-muted/30 p-4 text-sm leading-relaxed text-muted-foreground">
        No recorded activity yet.
      </p>
    );
  }

  return (
    <ol className="space-y-3">
      {entries.map((entry) => {
        const style = kindStyles[entry.kind];
        return (
          <li
            key={entry.id}
            className="flex gap-3 rounded-xl border border-border bg-card p-4 text-card-foreground shadow-sm shadow-foreground/[0.025]"
          >
            <span
              className={cn(
                "mt-0.5 inline-flex size-7 shrink-0 items-center justify-center rounded-full border border-border bg-background",
                style.ring,
              )}
            >
              {style.icon}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <h3 className="font-medium [overflow-wrap:anywhere]">
                  {entry.title}
                </h3>
                {showApp ? (
                  <Link
                    href={`/admin/apps/${entry.appId}`}
                    className="text-xs text-muted-foreground hover:text-foreground [overflow-wrap:anywhere]"
                  >
                    {entry.appLabel}
                  </Link>
                ) : null}
                <time
                  className="ml-auto text-[11px] text-muted-foreground"
                  dateTime={entry.at}
                >
                  {timestamp(entry.at)}
                </time>
              </div>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground [overflow-wrap:anywhere]">
                {entry.detail}
              </p>
              <p className="mt-1 text-[11px] text-muted-foreground [overflow-wrap:anywhere]">
                {entry.actor}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
