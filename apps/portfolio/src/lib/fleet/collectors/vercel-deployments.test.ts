import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  vercelDeploymentsResponseFixture,
  vercelProjectResponseFixture,
} from "@/test/fixtures/vercel";
import { mockFetchSequence } from "@/test/mocks/fetch";
import { FLEET_APPS } from "../registry";
import { collectVercelDeployments } from "./vercel-deployments";

vi.mock("../db/client", () => ({
  isDatabaseConfigured: () => false,
  db: () => {
    throw new Error("db() must not be called when unconfigured");
  },
  schema: {},
}));

const app = FLEET_APPS[0] as (typeof FLEET_APPS)[number];

/** Newest fixture deployment (BUILDING) createdAt, so all fall in-window. */
const FIXTURE_NOW = 1_752_010_000_000 + 1_000;

describe("collectVercelDeployments", () => {
  const original = { ...process.env };

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(FIXTURE_NOW);
    process.env.VERCEL_TOKEN = "test-token";
    process.env.VERCEL_TEAM_ID = "team_test";
  });

  afterEach(() => {
    vi.useRealTimers();
    process.env = { ...original };
  });

  it("computes success rate and active builds from the fixture list", async () => {
    const restore = mockFetchSequence([
      vercelDeploymentsResponseFixture,
      vercelProjectResponseFixture,
    ]);

    const observation = await collectVercelDeployments(app);
    restore();

    expect(observation.status).toBe("ok");
    expect(observation.data?.sampleSize).toBe(3);
    // One READY, one ERROR settled → 1/2; BUILDING is unsettled.
    expect(observation.data?.successRate7d).toBe(0.5);
    expect(observation.data?.activeBuilds).toBe(1);
  });

  it("selects a READY rollback candidate distinct from current production", async () => {
    const priorReady = {
      uid: "dpl_priorReady0000000000000000000000",
      readyState: "READY",
      target: "production",
      createdAt: 1_751_995_000_000,
      buildingAt: 1_751_995_000_000 + 5_000,
      ready: 1_751_995_000_000 + 80_000,
      meta: {
        githubCommitRef: "main",
        githubCommitSha: "d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f607",
      },
    };
    const deploymentsWithPrior = {
      deployments: [
        ...vercelDeploymentsResponseFixture.deployments,
        priorReady,
      ],
    };
    const restore = mockFetchSequence([
      deploymentsWithPrior,
      vercelProjectResponseFixture,
    ]);

    const observation = await collectVercelDeployments(app);
    restore();

    const currentSha = observation.data?.currentProductionSha;
    const rollback = observation.data?.rollbackCandidate;
    expect(currentSha).toBe(
      vercelProjectResponseFixture.targets.production.meta.githubCommitSha,
    );
    expect(rollback).not.toBeNull();
    expect(rollback?.id).toBe(priorReady.uid);
    expect(rollback?.id).not.toBe(
      vercelProjectResponseFixture.targets.production.id,
    );
    expect(observation.data?.latestFailure?.errorCode).toBe("BUILD_FAILED");
  });

  it("returns unconfigured when the token is missing", async () => {
    delete process.env.VERCEL_TOKEN;
    delete process.env.vercel_pat;

    const observation = await collectVercelDeployments(app);

    expect(observation.status).toBe("unconfigured");
    expect(observation.data).toBeNull();
    expect(observation.error?.code).toBe("not_configured");
  });
});
