import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { mockFetchSequence } from "@/test/mocks/fetch";
import type { FleetApp } from "../registry";
import {
  collectVercelMetrics,
  type VercelExperienceMetrics,
} from "./vercel-metrics";

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

let restore: (() => void) | null = null;

beforeEach(() => {
  process.env.VERCEL_TOKEN = "tok_test";
  process.env.VERCEL_TEAM_ID = "team_test";
});

afterEach(() => {
  restore?.();
  restore = null;
  delete process.env.VERCEL_TOKEN;
  delete process.env.vercel_pat;
  delete process.env.VERCEL_TEAM_ID;
});

describe("collectVercelMetrics", () => {
  it("returns unconfigured when the token is missing", async () => {
    delete process.env.VERCEL_TOKEN;

    const observation = await collectVercelMetrics(APP);

    expect(observation.status).toBe("unconfigured");
    expect(observation.data).toBeNull();
    expect(observation.error?.code).toBe("not_configured");
  });

  it("marks unavailable sections without reporting them as zero", async () => {
    restore = mockFetchSequence([
      // runtime: real data
      { body: { requests: 1000, errors5xx: 5, functionErrors: 2 } },
      // traffic: Web Analytics not enabled -> 404
      { body: { error: "not found" }, options: { status: 404 } },
      // performance: Speed Insights forbidden -> 403
      { body: { error: "forbidden" }, options: { status: 403 } },
    ]);

    const observation = await collectVercelMetrics(APP);
    const data = observation.data as VercelExperienceMetrics;

    expect(observation.status).toBe("partial");
    expect(data.traffic.availability).toBe("unsupported");
    expect(data.traffic.data).toBeNull();
    expect(data.performance.availability).toBe("forbidden");
    expect(data.performance.data).toBeNull();
    expect(data.runtime.availability).toBe("ok");
  });

  it("parses a runtime section into the typed shape", async () => {
    restore = mockFetchSequence([
      {
        body: {
          requests: 2000,
          errors5xx: 40,
          functionInvocationFailures: 7,
          duration: { p50: 120, p95: 480 },
        },
      },
      { body: {}, options: { status: 404 } },
      { body: {}, options: { status: 404 } },
    ]);

    const observation = await collectVercelMetrics(APP);
    const runtime = (observation.data as VercelExperienceMetrics).runtime.data;

    expect(runtime).not.toBeNull();
    expect(runtime?.requestVolume24h).toBe(2000);
    expect(runtime?.serverErrorRate).toBeCloseTo(0.02);
    expect(runtime?.functionInvocationFailures).toBe(7);
    expect(runtime?.p95DurationMs).toBe(480);
  });

  it("parses traffic buckets and previous-period deltas", async () => {
    restore = mockFetchSequence([
      { body: {}, options: { status: 404 } },
      {
        body: {
          pageViews: 150,
          visitors: 100,
          bandwidth: 2048,
          routes: [{ key: "/", total: 90 }],
          referrers: [{ key: "google.com", total: 40 }],
          previous: { pageViews: 100, visitors: 80 },
        },
      },
      { body: {}, options: { status: 404 } },
    ]);

    const observation = await collectVercelMetrics(APP);
    const traffic = (observation.data as VercelExperienceMetrics).traffic.data;

    expect(traffic?.topRoutes[0]).toEqual({ route: "/", count: 90 });
    expect(traffic?.topReferrers[0]).toEqual({
      referrer: "google.com",
      count: 40,
    });
    expect(traffic?.previousPeriod?.pageViewsDeltaPct).toBeCloseTo(50);
  });

  it("is unsupported overall when every section is unavailable", async () => {
    restore = mockFetchSequence([
      { body: {}, options: { status: 404 } },
      { body: {}, options: { status: 404 } },
      { body: {}, options: { status: 501 } },
    ]);

    const observation = await collectVercelMetrics(APP);

    expect(observation.status).toBe("unsupported");
    expect(observation.data).toBeNull();
  });
});
