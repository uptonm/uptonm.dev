import { cn } from "@uptonm/ui/lib/utils";
import { ArrowDownRight, ArrowRight, ArrowUpRight } from "lucide-react";
import type { ReactNode } from "react";

export type MetricTrend = "up" | "down" | "flat";

const trendStyles: Record<
  MetricTrend,
  { className: string; icon: ReactNode }
> = {
  up: {
    className: "text-emerald-700 dark:text-emerald-300",
    icon: <ArrowUpRight className="size-3" aria-hidden />,
  },
  down: {
    className: "text-red-700 dark:text-red-300",
    icon: <ArrowDownRight className="size-3" aria-hidden />,
  },
  flat: {
    className: "text-muted-foreground",
    icon: <ArrowRight className="size-3" aria-hidden />,
  },
};

export function MetricTile({
  label,
  value,
  subtext,
  trend,
  trendLabel,
}: {
  label: string;
  value: ReactNode;
  subtext?: ReactNode;
  trend?: MetricTrend;
  trendLabel?: string;
}) {
  const trendStyle = trend ? trendStyles[trend] : null;
  return (
    <div className="min-w-0 rounded-lg border border-border bg-background/50 px-3 py-3">
      <p className="text-[11px] uppercase tracking-[0.14em] leading-tight text-muted-foreground [overflow-wrap:anywhere]">
        {label}
      </p>
      <p className="mt-1.5 font-mono text-xl font-semibold tabular-nums [overflow-wrap:anywhere]">
        {value}
      </p>
      {trendStyle && trendLabel ? (
        <p
          className={cn(
            "mt-1 inline-flex items-center gap-1 text-xs [overflow-wrap:anywhere]",
            trendStyle.className,
          )}
        >
          {trendStyle.icon}
          <span className="min-w-0">{trendLabel}</span>
        </p>
      ) : null}
      {subtext ? (
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground [overflow-wrap:anywhere]">
          {subtext}
        </p>
      ) : null}
    </div>
  );
}
