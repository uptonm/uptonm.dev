"use server";

import { requireAdmin } from "@/lib/admin";
import {
  GATED_APPS,
  setGate,
  type GatedAppId,
  type Gates,
} from "@/lib/gates";
import { revalidatePath } from "next/cache";

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
