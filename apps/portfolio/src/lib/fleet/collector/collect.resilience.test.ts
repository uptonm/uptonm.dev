import { describe, expect, it, vi } from "vitest";

// DB is configured, but every repository call rejects — simulating a Neon
// hiccup under real preview load. collect() promises it "never throws to the
// caller", so it must degrade gracefully rather than crash the page render.
vi.mock("../db/client", () => ({
  isDatabaseConfigured: () => true,
  db: () => ({}),
  schema: {},
}));

const dbError = () => Promise.reject(new Error("neon: too many connections"));

vi.mock("../db/repositories", () => ({
  startCollectionRun: vi.fn(dbError),
  finishCollectionRun: vi.fn(dbError),
  recordObservation: vi.fn(dbError),
  latestObservation: vi.fn(dbError),
}));

const okCollector = async () => ({
  status: "ok" as const,
  data: { runs: 1 },
  observedAt: new Date().toISOString(),
  staleAt: null,
  source: "GitHub",
});

describe("collect() DB resilience", () => {
  it("does not throw when startCollectionRun fails", async () => {
    const { collect } = await import("./collect");
    const observation = await collect({
      appId: "portfolio",
      category: "ci",
      trigger: "test",
      collector: okCollector,
    });
    expect(observation.status).toBe("ok");
    expect(observation.data).toEqual({ runs: 1 });
  });

  it("does not throw when the persistence write fails after a good collect", async () => {
    const { collect } = await import("./collect");
    const observation = await collect({
      appId: "portfolio",
      category: "ci",
      trigger: "test",
      collector: okCollector,
    });
    // The collected data must survive even though recordObservation rejected.
    expect(observation.data).toEqual({ runs: 1 });
  });

  it("does not throw when the degrade path's DB read fails", async () => {
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
  });
});
