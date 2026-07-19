import { afterEach, describe, expect, it } from "vitest";

import { mockFetchOnce } from "@/test/mocks/fetch";
import type { FleetApp } from "../registry";
import {
  evaluateUptimeIncident,
  parseHeartbeat,
  probeApp,
} from "./operations-probes";

const APP: FleetApp = {
  id: "portfolio",
  label: "Portfolio",
  url: "https://uptonm.dev",
  iconSrc: "/gates/portfolio.png",
  github: { owner: "uptonm", repo: "uptonm.dev" },
  vercel: { projectId: "prj_test", projectName: "portfolio" },
  isControlPlane: true,
  capabilities: ["runtime"],
};

describe("evaluateUptimeIncident", () => {
  it("opens at exactly the threshold streak", () => {
    const result = evaluateUptimeIncident([{ ok: false }, { ok: false }]);
    expect(result.consecutiveFailures).toBe(2);
    expect(result.shouldOpen).toBe(true);
  });

  it("stays closed below the threshold streak", () => {
    const result = evaluateUptimeIncident([{ ok: true }, { ok: false }]);
    expect(result.consecutiveFailures).toBe(1);
    expect(result.shouldOpen).toBe(false);
  });

  it("does not count failures before a trailing success", () => {
    const result = evaluateUptimeIncident([
      { ok: false },
      { ok: false },
      { ok: true },
    ]);
    expect(result.consecutiveFailures).toBe(0);
    expect(result.shouldOpen).toBe(false);
  });

  it("counts only the trailing streak after an earlier recovery", () => {
    const result = evaluateUptimeIncident([
      { ok: false },
      { ok: true },
      { ok: false },
      { ok: false },
    ]);
    expect(result.consecutiveFailures).toBe(2);
    expect(result.shouldOpen).toBe(true);
  });
});

describe("parseHeartbeat", () => {
  it("accepts a valid payload with optional fields", () => {
    const parsed = parseHeartbeat({
      job: "nightly-sync",
      status: "success",
      durationMs: 1200,
      ranAt: "2026-07-19T00:00:00.000Z",
    });
    expect(parsed).toEqual({
      job: "nightly-sync",
      status: "success",
      durationMs: 1200,
      ranAt: "2026-07-19T00:00:00.000Z",
    });
  });

  it("rejects a payload missing job", () => {
    expect(parseHeartbeat({ status: "failure" })).toEqual({
      error: "job is required",
    });
  });

  it("rejects a payload missing/invalid status", () => {
    expect(parseHeartbeat({ job: "x" })).toEqual({
      error: "status must be 'success' or 'failure'",
    });
  });

  it("rejects a non-object body", () => {
    expect(parseHeartbeat("nope")).toEqual({ error: "body must be an object" });
  });
});

describe("probeApp", () => {
  afterEach(() => {
    // fetch is restored per-test by the returned restore fn.
  });

  it("reports a healthy HTTP probe on 200", async () => {
    const restore = mockFetchOnce({ ok: true }, { status: 200 });
    try {
      const observation = await probeApp(APP);
      expect(observation.data?.httpProbe.ok).toBe(true);
      expect(observation.data?.httpProbe.statusCode).toBe(200);
    } finally {
      restore();
    }
  });

  it("reports a failed HTTP probe on network error", async () => {
    const original = global.fetch;
    global.fetch = (() =>
      Promise.reject(new Error("network down"))) as typeof fetch;
    try {
      const observation = await probeApp(APP);
      expect(observation.data?.httpProbe.ok).toBe(false);
      expect(observation.data?.httpProbe.error).toContain("network down");
    } finally {
      global.fetch = original;
    }
  });
});
