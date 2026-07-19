import { describe, expect, it } from "vitest";
import {
  failed,
  hasData,
  hasFreshData,
  isStaleNow,
  ok,
  partial,
  stale,
  unconfigured,
  unsupported,
} from "./observation";

const meta = { source: "test", sourceUrl: "https://example.com" };

describe("observation contract", () => {
  it("marks ok observations as fresh with data", () => {
    const observation = ok({ count: 3 }, meta);
    expect(observation.status).toBe("ok");
    expect(hasFreshData(observation)).toBe(true);
    expect(hasData(observation)).toBe(true);
  });

  it("keeps partial data usable while carrying an error", () => {
    const observation = partial(
      { count: 1 },
      { code: "rate_limited", message: "slow down" },
      meta,
    );
    expect(hasFreshData(observation)).toBe(true);
    expect(observation.error?.code).toBe("rate_limited");
  });

  it("treats stale data as usable but not fresh", () => {
    const observation = stale({ count: 9 }, meta);
    expect(hasFreshData(observation)).toBe(false);
    expect(hasData(observation)).toBe(true);
  });

  it("never presents missing capability or config as a healthy zero", () => {
    for (const observation of [
      unsupported<number>("not offered", meta),
      unconfigured<number>("missing token", meta),
      failed<number>({ code: "timeout", message: "slow" }, meta),
    ]) {
      expect(observation.data).toBeNull();
      expect(hasFreshData(observation)).toBe(false);
      expect(hasData(observation)).toBe(false);
    }
  });

  it("computes staleness against a clock", () => {
    const observation = {
      ...ok(1, meta),
      staleAt: new Date(1_000).toISOString(),
    };
    expect(isStaleNow(observation, 999)).toBe(false);
    expect(isStaleNow(observation, 1_001)).toBe(true);
  });
});
