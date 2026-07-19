"use server";

import { requireAdmin } from "@/lib/admin";
import { GATED_APPS, setGate, type GatedAppId, type Gates } from "@/lib/gates";
import { FLEET_METRICS_CACHE_TAG } from "@/lib/fleet-metrics";
import { revalidatePath, updateTag } from "next/cache";

export async function updateGateAction(
  appId: GatedAppId,
  locked: boolean,
): Promise<Gates> {
  await requireAdmin();

  if (!GATED_APPS.some((app) => app.id === appId)) {
    throw new Error(`Unknown gated app: ${appId}`);
  }

  const gates = await setGate(appId, locked);
  revalidatePath("/admin");
  return gates;
}

export async function refreshFleetMetricsAction(): Promise<void> {
  await requireAdmin();
  updateTag(FLEET_METRICS_CACHE_TAG);
  revalidatePath("/admin");
}
