import "server-only";

import { auth, currentUser } from "@clerk/nextjs/server";
import {
  can,
  type FleetPermission,
  type FleetRole,
  REAUTH_REQUIRED,
} from "./permissions";

function envUserIds(name: string): Set<string> {
  const raw = process.env[name]?.trim();
  if (!raw) {
    return new Set();
  }
  return new Set(
    raw
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean),
  );
}

export async function resolveRole(): Promise<FleetRole> {
  await auth.protect();
  const user = await currentUser();
  const userId = user?.id ?? "";

  const adminIds = envUserIds("FLEET_ADMIN_USER_IDS");
  const operatorIds = envUserIds("FLEET_OPERATOR_USER_IDS");

  // TODO: tighten once roles are assigned. With no role env vars configured we
  // preserve today's permissive behavior — any signed-in user is admin.
  if (adminIds.size === 0 && operatorIds.size === 0) {
    return "admin";
  }

  if (adminIds.has(userId)) {
    return "admin";
  }
  if (operatorIds.has(userId)) {
    return "operator";
  }
  return "viewer";
}

export async function requirePermission(
  permission: FleetPermission,
): Promise<{ role: FleetRole; userId: string }> {
  const { userId } = await auth();
  await auth.protect();
  const role = await resolveRole();
  if (!can(role, permission)) {
    throw new Error("forbidden");
  }
  return { role, userId: userId ?? "" };
}

export function requiresReauth(permission: FleetPermission): boolean {
  return REAUTH_REQUIRED.has(permission);
}
