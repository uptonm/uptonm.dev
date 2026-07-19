import { describe, expect, it } from "vitest";
import type { AppObservations } from "@/lib/fleet/collectors";
import { ok, unsupported } from "@/lib/fleet/observation";
import { deriveAttention } from "./attention";
import { deriveAppHealth } from "./health";

const meta = { source: "test", sourceUrl: "https://example.com" };

/** Build an AppObservations, defaulting every lane to unsupported (no data). */
function makeObs(overrides: Partial<AppObservations>): AppObservations {
  const none = <T>() => unsupported<T>("n/a", meta);
  return {
    appId: "budget",
    delivery: none(),
    security: none(),
    deployments: none(),
    experience: none(),
    config: none(),
    operations: none(),
    ...overrides,
  } as AppObservations;
}

describe("deriveAttention", () => {
  it("returns no signals when every lane is unsupported", () => {
    expect(deriveAttention(makeObs({}))).toEqual([]);
  });

  it("emits severity-appropriate signals across lanes", () => {
    const obs = makeObs({
      deployments: ok(
        {
          latestFailure: { id: "dpl_1", createdAt: null, errorCode: "BUILD", commitSha: "abc" },
          successRate7d: 0.4,
        } as never,
        meta,
      ),
      delivery: ok(
        {
          repository: { url: "https://github.com/uptonm/budget" },
          drift: { behindBy: 2, unshippedCommitCount: 3 },
          pullRequests: { stalePrCount: 1, oldestPrAgeDays: 20 },
          branches: { staleCount: 2 },
        } as never,
        meta,
      ),
      security: ok({ dependabot: { bySeverity: { critical: 1, high: 0 } } } as never, meta),
      config: ok(
        {
          domains: [{ name: "budget.uptonm.dev", tls: { status: "critical", daysRemaining: 3 } }],
          environment: { drift: { missing: [{ name: "DATABASE_URL", targets: ["production"] }] } },
        } as never,
        meta,
      ),
      operations: ok(
        { httpProbe: { ok: false, url: "https://budget.uptonm.dev", statusCode: 503, error: null } } as never,
        meta,
      ),
    });

    const signals = deriveAttention(obs);
    const byRule = new Map(signals.map((s) => [s.rule, s]));

    expect(byRule.get("deploy-failure")?.severity).toBe("critical");
    expect(byRule.get("production-behind")?.severity).toBe("warning");
    expect(byRule.get("unshipped-commits")?.severity).toBe("info");
    expect(byRule.get("stale-prs")?.severity).toBe("info");
    expect(byRule.get("security-vuln")?.severity).toBe("critical");
    expect(byRule.get("tls-expiry")?.severity).toBe("critical");
    expect(byRule.get("env-missing")?.severity).toBe("warning");
    expect(byRule.get("uptime")?.severity).toBe("critical");

    // deriveAppHealth rolls the worst severity up to a "down" status.
    const health = deriveAppHealth(obs);
    expect(health.attentionCount).toBe(signals.length);
    expect(health.worstSeverity).toBe("critical");
  });

  it("produces stable fingerprints for identical input", () => {
    const obs = makeObs({
      operations: ok(
        { httpProbe: { ok: false, url: "https://x.dev", statusCode: 500, error: null } } as never,
        meta,
      ),
    });
    const first = deriveAttention(obs)[0]?.fingerprint;
    const second = deriveAttention(obs)[0]?.fingerprint;
    expect(first).toBeDefined();
    expect(first).toBe(second);
  });
});
