"use client";

import { Button } from "@uptonm/ui/components/base/button";
import { cn } from "@uptonm/ui/lib/utils";
import { RefreshCw } from "lucide-react";
import { useFormStatus } from "react-dom";

export function FleetMetricsRefresh() {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      variant="soft"
      size="sm"
      disabled={pending}
      aria-label="Refresh GitHub and Vercel metrics"
      className="h-10 px-3 sm:h-8"
    >
      <RefreshCw
        className={cn("size-3.5", pending ? "animate-spin" : null)}
        aria-hidden
      />
      {pending ? "Refreshing…" : "Refresh"}
    </Button>
  );
}
