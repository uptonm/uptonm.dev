import Link from "next/link";
import type { AttentionItem } from "./sample";
import { SeverityBadge } from "./SeverityBadge";

function relativeShort(value: string): string {
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) return "";
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC",
  }).format(new Date(parsed));
}

export function AttentionList({ items }: { items: readonly AttentionItem[] }) {
  if (items.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border bg-muted/30 p-4 text-sm leading-relaxed text-muted-foreground">
        Nothing needs attention. Every app is inside its thresholds.
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li
          key={item.id}
          className="rounded-xl border border-border bg-card p-4 text-card-foreground shadow-sm shadow-foreground/[0.025]"
        >
          <div className="flex flex-wrap items-center gap-2">
            <SeverityBadge severity={item.severity} />
            <Link
              href={`/admin/apps/${item.appId}`}
              className="text-xs font-medium text-muted-foreground hover:text-foreground [overflow-wrap:anywhere]"
            >
              {item.appLabel}
            </Link>
            <time
              className="ml-auto text-[11px] text-muted-foreground"
              dateTime={item.observedAt}
            >
              {relativeShort(item.observedAt)}
            </time>
          </div>
          <h3 className="mt-2 font-display text-base font-semibold tracking-tight [overflow-wrap:anywhere]">
            {item.title}
          </h3>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground [overflow-wrap:anywhere]">
            {item.detail}
          </p>
        </li>
      ))}
    </ul>
  );
}
