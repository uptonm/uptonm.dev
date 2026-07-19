import { describe, expect, it } from "vitest";

import { parseManifest } from "@/lib/fleet/manifest";
import type { ObservationStatus } from "@/lib/fleet/observation";
import {
  makeGithubMetrics,
  makeObservation,
  makeVercelMetrics,
} from "./factories";
import {
  fleetManifestFixture,
  invalidManifestFixture,
} from "./fixtures/manifest";

const VALID_STATUSES: readonly ObservationStatus[] = [
  "ok",
  "partial",
  "stale",
  "unsupported",
  "unconfigured",
  "error",
];

describe("test factories", () => {
  it("makeObservation produces a valid status", () => {
    const observation = makeObservation<number>({ data: 5 });
    expect(VALID_STATUSES).toContain(observation.status);
    expect(observation.data).toBe(5);
  });

  it("makeObservation applies overrides over defaults", () => {
    const observation = makeObservation({ status: "error", source: "github" });
    expect(observation.status).toBe("error");
    expect(observation.source).toBe("github");
  });

  it("makeGithubMetrics returns internally consistent CI counts", () => {
    const metrics = makeGithubMetrics();
    expect(metrics.ci.passed + metrics.ci.failed).toBe(metrics.ci.total);
    expect(metrics.nameWithOwner).toContain("/");
  });

  it("makeVercelMetrics returns a live production deployment", () => {
    const metrics = makeVercelMetrics();
    expect(metrics.live?.state).toBe("READY");
    expect(metrics.live?.environment).toBe("production");
  });

  it("parseManifest accepts the valid manifest fixture", () => {
    const result = parseManifest(fleetManifestFixture);
    expect(result.ok).toBe(true);
  });

  it("parseManifest rejects the invalid manifest fixture", () => {
    const result = parseManifest(invalidManifestFixture);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.length).toBeGreaterThan(0);
    }
  });
});
