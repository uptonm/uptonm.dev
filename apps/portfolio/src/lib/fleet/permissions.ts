/**
 * Role model for the operations console.
 *
 * The live dashboard currently treats any signed-in Clerk user as admin (see
 * lib/admin.ts). This introduces the three roles the plan requires so that
 * read access, safe mutations, and destructive actions can diverge before
 * Wave 4 wires real actions. Role resolution from Clerk is deferred; until
 * then a single configured admin maps to `admin` and everyone else to
 * `viewer`.
 */
export type FleetRole = "viewer" | "operator" | "admin";

export type FleetPermission =
  | "read"
  | "refresh"
  | "acknowledge"
  | "redeploy"
  | "cancel_deployment"
  | "rollback"
  | "set_gate";

const ROLE_PERMISSIONS: Record<FleetRole, ReadonlySet<FleetPermission>> = {
  viewer: new Set<FleetPermission>(["read"]),
  operator: new Set<FleetPermission>([
    "read",
    "refresh",
    "acknowledge",
    "redeploy",
    "cancel_deployment",
    "set_gate",
  ]),
  admin: new Set<FleetPermission>([
    "read",
    "refresh",
    "acknowledge",
    "redeploy",
    "cancel_deployment",
    "rollback",
    "set_gate",
  ]),
};

export function can(role: FleetRole, permission: FleetPermission): boolean {
  return ROLE_PERMISSIONS[role].has(permission);
}

/** Actions requiring a fresh re-authentication (destructive/irreversible). */
export const REAUTH_REQUIRED: ReadonlySet<FleetPermission> = new Set([
  "rollback",
]);
