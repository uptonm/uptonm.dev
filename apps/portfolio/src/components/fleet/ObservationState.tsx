import type { Observation } from "@/lib/fleet/observation";
import { cn } from "@uptonm/ui/lib/utils";
import { CircleSlash, Clock3, Settings2, TriangleAlert } from "lucide-react";
import type { ReactNode } from "react";

function formatObservedAt(value: string | null): string | null {
  if (!value) return null;
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) return null;
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC",
    timeZoneName: "short",
  }).format(new Date(parsed));
}

function StaleBadge({ observedAt }: { observedAt: string | null }) {
  const label = formatObservedAt(observedAt);
  return (
    <span className="inline-flex max-w-full items-center gap-1 rounded-full border border-amber-600/20 bg-amber-500/10 px-2 py-1 text-[11px] font-medium leading-none text-amber-800 dark:text-amber-300">
      <Clock3 className="size-3 shrink-0" aria-hidden />
      <span className="min-w-0 [overflow-wrap:anywhere]">
        {label ? `Stale · last seen ${label}` : "Stale"}
      </span>
    </span>
  );
}

function StateMessage({
  icon,
  children,
  tone = "muted",
}: {
  icon: ReactNode;
  children: ReactNode;
  tone?: "muted" | "danger";
}) {
  return (
    <div
      className={cn(
        "flex items-start gap-2 rounded-lg border border-dashed border-border bg-muted/30 p-3 text-xs leading-relaxed",
        tone === "danger"
          ? "text-red-700 dark:text-red-300"
          : "text-muted-foreground",
      )}
      role={tone === "danger" ? "alert" : "status"}
    >
      <span className="mt-0.5 shrink-0">{icon}</span>
      <span className="min-w-0 whitespace-pre-wrap [overflow-wrap:anywhere]">
        {children}
      </span>
    </div>
  );
}

/**
 * Render the right affordance for each observation status. `ok`/`partial`
 * render children; `stale` renders children plus a badge; the remaining
 * statuses render a self-contained, fully-wrapping message with no
 * destructive truncation.
 */
export function ObservationState<T>({
  observation,
  children,
}: {
  observation: Observation<T>;
  children: ReactNode;
}) {
  switch (observation.status) {
    case "ok":
    case "partial":
      return <>{children}</>;
    case "stale":
      return (
        <div className="space-y-2">
          <StaleBadge observedAt={observation.observedAt} />
          {children}
        </div>
      );
    case "unsupported":
      return (
        <StateMessage icon={<CircleSlash className="size-4" aria-hidden />}>
          {observation.error?.message ?? "Not available for this app."}
        </StateMessage>
      );
    case "unconfigured":
      return (
        <StateMessage icon={<Settings2 className="size-4" aria-hidden />}>
          {observation.error?.message ?? "Needs setup."}
        </StateMessage>
      );
    case "error":
      return (
        <StateMessage
          tone="danger"
          icon={<TriangleAlert className="size-4" aria-hidden />}
        >
          {observation.error?.message ??
            "Telemetry is temporarily unavailable."}
        </StateMessage>
      );
  }
}

/**
 * Render-prop wrapper: hands usable `data` to the child only when the
 * observation carries it, and defers every other status to `ObservationState`.
 */
export function ObservationBoundary<T>({
  observation,
  children,
}: {
  observation: Observation<T>;
  children: (data: T) => ReactNode;
}) {
  const hasData =
    (observation.status === "ok" ||
      observation.status === "partial" ||
      observation.status === "stale") &&
    observation.data !== null;

  return (
    <ObservationState observation={observation}>
      {hasData ? children(observation.data as T) : null}
    </ObservationState>
  );
}
