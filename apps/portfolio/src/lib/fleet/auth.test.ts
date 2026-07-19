import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { can } from "./permissions";

vi.mock("@clerk/nextjs/server", () => ({
  auth: Object.assign(vi.fn(async () => ({ userId: mockUserId })), {
    protect: vi.fn(async () => undefined),
  }),
  currentUser: vi.fn(async () => ({ id: mockUserId })),
}));

let mockUserId = "user_default";

const ADMIN_ID = "user_admin";
const OPERATOR_ID = "user_operator";

describe("resolveRole / requirePermission", () => {
  const priorAdmin = process.env.FLEET_ADMIN_USER_IDS;
  const priorOperator = process.env.FLEET_OPERATOR_USER_IDS;

  beforeEach(() => {
    process.env.FLEET_ADMIN_USER_IDS = ADMIN_ID;
    process.env.FLEET_OPERATOR_USER_IDS = OPERATOR_ID;
    mockUserId = ADMIN_ID;
  });

  afterEach(() => {
    process.env.FLEET_ADMIN_USER_IDS = priorAdmin;
    process.env.FLEET_OPERATOR_USER_IDS = priorOperator;
    vi.clearAllMocks();
  });

  it("maps a configured admin user id to admin", async () => {
    const { resolveRole } = await import("./auth");
    mockUserId = ADMIN_ID;
    expect(await resolveRole()).toBe("admin");
  });

  it("maps an unlisted user with env set to viewer", async () => {
    const { resolveRole } = await import("./auth");
    mockUserId = "user_stranger";
    expect(await resolveRole()).toBe("viewer");
  });

  it("maps a configured operator user id to operator", async () => {
    const { resolveRole } = await import("./auth");
    mockUserId = OPERATOR_ID;
    expect(await resolveRole()).toBe("operator");
  });

  it("treats any signed-in user as admin when no role env vars are set", async () => {
    const { resolveRole } = await import("./auth");
    delete process.env.FLEET_ADMIN_USER_IDS;
    delete process.env.FLEET_OPERATOR_USER_IDS;
    mockUserId = "user_stranger";
    expect(await resolveRole()).toBe("admin");
  });

  it("denies rollback to a viewer via can()", () => {
    expect(can("viewer", "rollback")).toBe(false);
    expect(can("admin", "rollback")).toBe(true);
  });

  it("throws forbidden when a viewer requests rollback", async () => {
    const { requirePermission } = await import("./auth");
    mockUserId = "user_stranger";
    await expect(requirePermission("rollback")).rejects.toThrow("forbidden");
  });

  it("returns role and userId when permission is allowed", async () => {
    const { requirePermission } = await import("./auth");
    mockUserId = ADMIN_ID;
    const result = await requirePermission("rollback");
    expect(result).toEqual({ role: "admin", userId: ADMIN_ID });
  });

  it("flags rollback as requiring reauth", async () => {
    const { requiresReauth } = await import("./auth");
    expect(requiresReauth("rollback")).toBe(true);
    expect(requiresReauth("read")).toBe(false);
  });
});
