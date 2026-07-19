import { describe, expect, it } from "vitest";
import type { AppObservations } from "@/lib/fleet/collectors";
import { ok, unsupported } from "@/lib/fleet/observation";
import { deriveIncidentActions } from "./incidents";

const meta = { source: "test" };

function makeObs(overrides: Partial<AppObservations>): AppObservations {
  const none = <T>() => unsupported<T>("n/a", meta);
  return {
    appId: "home",
    delivery: none(),
    security: none(),
    deployments: none(),
    experience: none(),
    config: none(),
    operations: none(),
    ...overrides,
  } as AppObservations;
}

const failing = [{ ok: false }, { ok: false }];
const recovered = [{ ok: false }, { ok: true }];

describe("deriveIncidentActions", () => {
  it("opens an uptime incident once the failure streak crosses the threshold", () => {
    const actions = deriveIncidentActions([], makeObs({}), failing);
    expect(actions.open.some((i) => i.kind === "uptime")).toBe(true);
    expect(actions.resolve).toEqual([]);
  });

  it("does not double-open an incident that is already open", () => {
    const actions = deriveIncidentActions(
      [{ id: "inc_1", kind: "uptime" }],
      makeObs({}),
      failing,
    );
    expect(actions.open).toEqual([]);
  });

  it("resolves an open uptime incident once probes recover", () => {
    const actions = deriveIncidentActions(
      [{ id: "inc_1", kind: "uptime" }],
      makeObs({}),
      recovered,
    );
    expect(actions.resolve).toContain("inc_1");
  });

  it("opens a deploy-failure incident when the latest deploy failed", () => {
    const obs = makeObs({
      deployments: ok({ latestFailure: { errorCode: "BUILD_FAILED" } } as never, meta),
    });
    const actions = deriveIncidentActions([], obs, recovered);
    expect(actions.open.some((i) => i.kind === "deploy-failure")).toBe(true);
  });
});
