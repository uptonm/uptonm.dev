import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requirePermission: vi.fn(async () => ({ role: "admin", userId: "user_admin" })),
  requiresReauth: vi.fn((permission: string) => permission === "rollback"),
  recordAudit: vi.fn(async () => undefined),
  fetchJson: vi.fn(async () => ({ id: "dpl_new" })),
  setAttentionState: vi.fn(async () => undefined),
  revalidateTag: vi.fn(() => undefined),
  beginActionRequest: vi.fn(async () => beginResult),
  completeActionRequest: vi.fn(async () => undefined),
}));

const {
  requirePermission,
  recordAudit,
  fetchJson,
  setAttentionState,
  revalidateTag,
  completeActionRequest,
} = mocks;

let beginResult: { created: boolean; request: { id: string; result: unknown } };

vi.mock("../auth", () => ({
  requirePermission: mocks.requirePermission,
  requiresReauth: mocks.requiresReauth,
}));
vi.mock("../audit", () => ({ recordAudit: mocks.recordAudit }));
vi.mock("../collector/http", () => ({
  fetchJson: mocks.fetchJson,
  ProviderRequestError: class {},
}));
vi.mock("../db/client", () => ({ isDatabaseConfigured: () => true }));
vi.mock("../db/repositories", () => ({ setAttentionState: mocks.setAttentionState }));
vi.mock("./request", () => ({
  beginActionRequest: mocks.beginActionRequest,
  completeActionRequest: mocks.completeActionRequest,
}));
vi.mock("next/cache", () => ({ revalidateTag: mocks.revalidateTag }));

import {
  acknowledgeAttention,
  redeployProduction,
  refreshApp,
  rollbackProduction,
} from "./executor";

const OPTS = { idempotencyKey: "key-1" };

describe("fleet action executor", () => {
  beforeEach(() => {
    beginResult = { created: true, request: { id: "req-1", result: null } };
    fetchJson.mockResolvedValue({ id: "dpl_new" });
    requirePermission.mockResolvedValue({ role: "admin", userId: "user_admin" });
    delete process.env.FLEET_ACTIONS_ENABLED;
    process.env.VERCEL_TOKEN = "tok";
    process.env.VERCEL_TEAM_ID = "team";
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("blocks redeploy when FLEET_ACTIONS_ENABLED is unset", async () => {
    const result = await redeployProduction("portfolio", { deploymentId: "d1" }, OPTS);
    expect(result).toEqual({ ok: false, error: "fleet actions are disabled" });
    expect(fetchJson).not.toHaveBeenCalled();
    expect(completeActionRequest).toHaveBeenCalledWith("req-1", {
      status: "failed",
      result: { ok: false, error: "fleet actions are disabled" },
    });
  });

  it("performs redeploy when enabled, recording audit and completing", async () => {
    process.env.FLEET_ACTIONS_ENABLED = "true";
    const result = await redeployProduction("portfolio", { deploymentId: "d1" }, OPTS);
    expect(result).toEqual({ ok: true, data: { deploymentId: "dpl_new" } });
    expect(fetchJson).toHaveBeenCalledTimes(1);
    expect(recordAudit).toHaveBeenCalledWith(
      expect.objectContaining({ action: "redeploy", result: "success" }),
    );
    expect(completeActionRequest).toHaveBeenCalledWith("req-1", {
      status: "succeeded",
      result: { ok: true, data: { deploymentId: "dpl_new" } },
    });
    expect(revalidateTag).toHaveBeenCalledWith("fleet-console:portfolio", "max");
  });

  it("rejects rollback without a fresh re-auth", async () => {
    process.env.FLEET_ACTIONS_ENABLED = "true";
    await expect(
      rollbackProduction("portfolio", { targetDeploymentId: "d0" }, {
        idempotencyKey: "key-r",
        confirmationText: "portfolio",
      }),
    ).rejects.toThrow(/re-authentication/);
    expect(fetchJson).not.toHaveBeenCalled();
  });

  it("performs rollback with reauth and matching confirmation", async () => {
    process.env.FLEET_ACTIONS_ENABLED = "true";
    fetchJson.mockResolvedValue({ id: "" });
    const result = await rollbackProduction(
      "portfolio",
      { targetDeploymentId: "d0" },
      { idempotencyKey: "key-r", reauthenticated: true, confirmationText: "portfolio" },
    );
    expect(result).toEqual({ ok: true, data: { targetDeploymentId: "d0" } });
    expect(fetchJson).toHaveBeenCalledTimes(1);
  });

  it("fails rollback when confirmation text does not match", async () => {
    process.env.FLEET_ACTIONS_ENABLED = "true";
    const result = await rollbackProduction(
      "portfolio",
      { targetDeploymentId: "d0" },
      { idempotencyKey: "key-r", reauthenticated: true, confirmationText: "wrong" },
    );
    expect(result.ok).toBe(false);
    expect(fetchJson).not.toHaveBeenCalled();
  });

  it("refreshApp works without FLEET_ACTIONS_ENABLED", async () => {
    const result = await refreshApp("portfolio", OPTS);
    expect(result).toEqual(
      expect.objectContaining({ ok: true }),
    );
    expect(revalidateTag).toHaveBeenCalledWith("fleet-console", "max");
    expect(revalidateTag).toHaveBeenCalledWith("fleet-console:portfolio", "max");
    expect(fetchJson).not.toHaveBeenCalled();
  });

  it("replays a prior result for a repeated idempotency key without re-fetching", async () => {
    process.env.FLEET_ACTIONS_ENABLED = "true";
    beginResult = {
      created: false,
      request: { id: "req-1", result: { ok: true, data: { deploymentId: "cached" } } },
    };
    const result = await redeployProduction("portfolio", { deploymentId: "d1" }, OPTS);
    expect(result).toEqual({ ok: true, data: { deploymentId: "cached" } });
    expect(fetchJson).not.toHaveBeenCalled();
    expect(completeActionRequest).not.toHaveBeenCalled();
  });

  it("acknowledgeAttention writes attention state without the actions flag", async () => {
    const result = await acknowledgeAttention("fp-1", { snoozeMinutes: 30 }, OPTS);
    expect(result.ok).toBe(true);
    expect(setAttentionState).toHaveBeenCalledWith(
      "fp-1",
      expect.objectContaining({ acknowledgedBy: "user_admin" }),
    );
    expect(fetchJson).not.toHaveBeenCalled();
  });
});
