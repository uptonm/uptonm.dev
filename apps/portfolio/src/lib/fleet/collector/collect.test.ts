import { describe, expect, it, vi } from "vitest";

import { classifyError, ProviderRequestError } from "./http";

vi.mock("../db/client", () => ({
  isDatabaseConfigured: () => false,
  db: () => {
    throw new Error("db() must not be called when unconfigured");
  },
  schema: {},
}));

describe("classifyError", () => {
  const err = (status: number | null) =>
    new ProviderRequestError("GitHub", `HTTP ${status}`, status);

  it("maps AbortError to timeout", () => {
    expect(
      classifyError("GitHub", new DOMException("aborted", "AbortError")).code,
    ).toBe("timeout");
  });

  it("maps TimeoutError to timeout", () => {
    expect(
      classifyError("GitHub", new DOMException("slow", "TimeoutError")).code,
    ).toBe("timeout");
  });

  it("maps 401 to unauthorized", () => {
    expect(classifyError("GitHub", err(401)).code).toBe("unauthorized");
  });

  it("maps 403 to forbidden", () => {
    expect(classifyError("GitHub", err(403)).code).toBe("forbidden");
  });

  it("maps 404 to not_found", () => {
    expect(classifyError("GitHub", err(404)).code).toBe("not_found");
  });

  it("maps 429 to rate_limited", () => {
    expect(classifyError("GitHub", err(429)).code).toBe("rate_limited");
  });

  it("maps unknown status to unavailable", () => {
    expect(classifyError("GitHub", err(500)).code).toBe("unavailable");
    expect(classifyError("GitHub", new Error("boom")).code).toBe("unavailable");
  });
});

describe("collect without a database", () => {
  it("returns a failed observation instead of throwing when the collector throws", async () => {
    const { collect } = await import("./collect");
    const observation = await collect({
      appId: "portfolio",
      category: "ci",
      trigger: "test",
      collector: async () => {
        throw new Error("provider exploded");
      },
    });

    expect(observation.status).toBe("error");
    expect(observation.data).toBeNull();
    expect(observation.error?.code).toBe("unavailable");
    expect(observation.error?.message).toBe("provider exploded");
  });

  it("passes a null runId to the collector and returns its observation", async () => {
    const { collect } = await import("./collect");
    const observation = await collect({
      appId: "portfolio",
      category: "ci",
      trigger: "test",
      collector: async (ctx) => {
        expect(ctx.runId).toBeNull();
        expect(ctx.appId).toBe("portfolio");
        return {
          status: "ok" as const,
          data: { runs: 3 },
          observedAt: new Date().toISOString(),
          staleAt: null,
          source: "GitHub",
        };
      },
    });

    expect(observation.status).toBe("ok");
    expect(observation.data).toEqual({ runs: 3 });
    expect(observation.staleAt).not.toBeNull();
  });
});
