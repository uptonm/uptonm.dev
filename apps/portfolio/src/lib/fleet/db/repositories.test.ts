import { describe, expect, it } from "vitest";

import { retentionCutoff } from "./retention";

describe("retentionCutoff", () => {
  const now = new Date("2026-07-19T00:00:00.000Z");

  it("subtracts whole days from the reference clock", () => {
    expect(retentionCutoff(30, now).toISOString()).toBe(
      "2026-06-19T00:00:00.000Z",
    );
  });

  it("returns the same instant for a zero-day window", () => {
    expect(retentionCutoff(0, now).getTime()).toBe(now.getTime());
  });

  it("scales linearly with the day count", () => {
    const oneDay = now.getTime() - retentionCutoff(1, now).getTime();
    const tenDays = now.getTime() - retentionCutoff(10, now).getTime();
    expect(tenDays).toBe(oneDay * 10);
  });
});
