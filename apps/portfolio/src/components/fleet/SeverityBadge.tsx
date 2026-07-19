import { cn } from "@uptonm/ui/lib/utils";
import { AlertTriangle, Info, ShieldAlert } from "lucide-react";
import type { ReactNode } from "react";

export type Severity = "critical" | "warning" | "info";

const severityStyles: Record<
  Severity,
  { className: string; icon: ReactNode; label: string }
> = {
  critical: {
    className:
      "border-red-600/20 bg-red-500/10 text-red-800 dark:text-red-300",
    icon: <ShieldAlert className="size-3" aria-hidden />,
    label: "Critical",
  },
  warning: {
    className:
      "border-amber-600/20 bg-amber-500/10 text-amber-800 dark:text-amber-300",
    icon: <AlertTriangle className="size-3" aria-hidden />,
    label: "Warning",
  },
  info: {
    className:
      "border-sky-600/20 bg-sky-500/10 text-sky-800 dark:text-sky-300",
    icon: <Info className="size-3" aria-hidden />,
    label: "Info",
  },
};

export function SeverityBadge({
  severity,
  children,
}: {
  severity: Severity;
  children?: ReactNode;
}) {
  const style = severityStyles[severity];
  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center gap-1 rounded-full border px-2 py-1 text-xs font-medium leading-none",
        style.className,
      )}
    >
      {style.icon}
      <span className="min-w-0 [overflow-wrap:anywhere]">
        {children ?? style.label}
      </span>
    </span>
  );
}
