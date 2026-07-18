"use client";

import { updateGateAction } from "@/app/admin/actions";
import type { GatedApp, GatedAppId, Gates } from "@/lib/gates";
import { Switch } from "@uptonm/ui/components/base/switch";
import { cn } from "@uptonm/ui/lib/utils";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

function hostLabel(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
}

function GateRow({
  app,
  locked,
  onToggle,
  pending,
}: {
  app: GatedApp;
  locked: boolean;
  onToggle: (appId: GatedAppId, next: boolean) => void;
  pending: boolean;
}) {
  return (
    <li className="flex items-center gap-3 py-3">
      <Image
        src={app.iconSrc}
        alt=""
        width={28}
        height={28}
        className="size-7 shrink-0 rounded-md"
        aria-hidden
      />
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-foreground">{app.label}</p>
        <p className="truncate text-xs text-muted-foreground">
          {hostLabel(app.url)}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <span
          className={cn(
            "hidden text-xs sm:inline",
            locked ? "text-foreground" : "text-muted-foreground",
          )}
        >
          {locked ? "Private" : "Public"}
        </span>
        <Switch
          checked={locked}
          disabled={pending}
          onCheckedChange={(next) => onToggle(app.id, next)}
          aria-label={`Require login for ${app.label}`}
        />
      </div>
    </li>
  );
}

export function FleetGates({
  apps,
  initialGates,
}: {
  apps: readonly GatedApp[];
  initialGates: Gates;
}) {
  const router = useRouter();
  const [gates, setGates] = useState(initialGates);
  const [pendingId, setPendingId] = useState<GatedAppId | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function onToggle(appId: GatedAppId, locked: boolean) {
    const previous = gates;
    setError(null);
    setGates((current) => ({ ...current, [appId]: locked }));
    setPendingId(appId);

    startTransition(async () => {
      try {
        const next = await updateGateAction(appId, locked);
        setGates(next);
        router.refresh();
      } catch {
        setGates(previous);
        setError("Could not update gate. Try again.");
      } finally {
        setPendingId(null);
      }
    });
  }

  return (
    <div>
      <ul className="divide-y divide-border border-t border-b border-border">
        {apps.map((app) => (
          <GateRow
            key={app.id}
            app={app}
            locked={gates[app.id]}
            onToggle={onToggle}
            pending={isPending && pendingId === app.id}
          />
        ))}
      </ul>
      {error ? (
        <p className="mt-3 text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
