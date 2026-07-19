"use client";

import type { FleetAppId } from "@/lib/fleet/registry";
import { cn } from "@uptonm/ui/lib/utils";
import { Activity, LayoutDashboard, Settings, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

export type ConsoleNavApp = {
  id: FleetAppId;
  label: string;
};

const primaryLinks: Array<{ href: string; label: string; icon: ReactNode }> = [
  {
    href: "/admin",
    label: "Overview",
    icon: <LayoutDashboard className="size-4" aria-hidden />,
  },
  {
    href: "/admin/attention",
    label: "Attention",
    icon: <TriangleAlert className="size-4" aria-hidden />,
  },
  {
    href: "/admin/activity",
    label: "Activity",
    icon: <Activity className="size-4" aria-hidden />,
  },
  {
    href: "/admin/settings",
    label: "Settings",
    icon: <Settings className="size-4" aria-hidden />,
  },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function ConsoleNav({ apps }: { apps: readonly ConsoleNavApp[] }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Fleet console" className="min-w-0">
      <ul className="flex flex-wrap gap-2">
        {primaryLinks.map((link) => {
          const active = isActive(pathname, link.href);
          return (
            <li key={link.href}>
              <Link
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "inline-flex min-h-11 items-center gap-2 rounded-lg border px-3 text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
                  active
                    ? "border-foreground/20 bg-muted text-foreground"
                    : "border-border text-muted-foreground hover:bg-muted/40 hover:text-foreground",
                )}
              >
                {link.icon}
                {link.label}
              </Link>
            </li>
          );
        })}
      </ul>

      <div className="mt-3 border-t border-border pt-3">
        <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
          Apps
        </p>
        <ul className="mt-2 flex flex-wrap gap-2">
          {apps.map((app) => {
            const href = `/admin/apps/${app.id}`;
            const active = isActive(pathname, href);
            return (
              <li key={app.id}>
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "inline-flex min-h-11 items-center rounded-lg border px-3 text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring [overflow-wrap:anywhere]",
                    active
                      ? "border-foreground/20 bg-muted text-foreground"
                      : "border-border text-muted-foreground hover:bg-muted/40 hover:text-foreground",
                  )}
                >
                  {app.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
