import type { AppHealthStatus } from "@/lib/fleet/derive/health";
import Image from "next/image";
import Link from "next/link";

const STATUS_STYLES: Record<
  AppHealthStatus,
  { label: string; dot: string; text: string }
> = {
  healthy: { label: "Healthy", dot: "bg-emerald-500", text: "text-emerald-600 dark:text-emerald-400" },
  degraded: { label: "Degraded", dot: "bg-amber-500", text: "text-amber-600 dark:text-amber-400" },
  down: { label: "Down", dot: "bg-red-500", text: "text-red-600 dark:text-red-400" },
  unknown: { label: "Unknown", dot: "bg-muted-foreground", text: "text-muted-foreground" },
};

export type AppHealthCardProps = {
  id: string;
  label: string;
  url: string;
  iconSrc: string;
  isControlPlane: boolean;
  status: AppHealthStatus;
  attentionCount: number;
};

export function AppHealthCard({
  id,
  label,
  url,
  iconSrc,
  isControlPlane,
  status,
  attentionCount,
}: AppHealthCardProps) {
  const style = STATUS_STYLES[status];
  return (
    <Link
      href={`/admin/apps/${id}`}
      className="flex min-h-[44px] items-center gap-3 rounded-xl border border-border p-4 transition-colors hover:bg-muted/50"
    >
      <Image
        src={iconSrc}
        alt=""
        width={40}
        height={40}
        className="size-10 shrink-0 rounded-lg"
        aria-hidden
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate font-medium [overflow-wrap:anywhere]">
            {label}
          </span>
          {isControlPlane ? (
            <span className="shrink-0 text-[11px] text-muted-foreground">
              control plane
            </span>
          ) : null}
        </div>
        <span className="text-xs text-muted-foreground [overflow-wrap:anywhere]">
          {new URL(url).host}
        </span>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        <span className={`flex items-center gap-1.5 text-xs font-medium ${style.text}`}>
          <span className={`size-2 rounded-full ${style.dot}`} aria-hidden />
          {style.label}
        </span>
        {attentionCount > 0 ? (
          <span className="text-[11px] text-muted-foreground">
            {attentionCount} signal{attentionCount === 1 ? "" : "s"}
          </span>
        ) : null}
      </div>
    </Link>
  );
}
