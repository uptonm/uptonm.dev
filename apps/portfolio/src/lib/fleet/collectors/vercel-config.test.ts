import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { mockFetchSequence } from "@/test/mocks/fetch";
import type { EnvExpectation } from "../manifest";
import type { FleetApp } from "../registry";
import { collectVercelConfig } from "./vercel-config";

const APP: FleetApp = {
  id: "portfolio",
  label: "Portfolio",
  url: "https://uptonm.dev",
  iconSrc: "/gates/portfolio.png",
  github: { owner: "uptonm", repo: "uptonm.dev" },
  vercel: { projectId: "prj_test", projectName: "portfolio" },
  isControlPlane: true,
  capabilities: ["domains", "environment"],
};

const FORBIDDEN = { body: { error: "forbidden" }, options: { status: 403 } };

describe("collectVercelConfig", () => {
  let restore: (() => void) | undefined;

  beforeEach(() => {
    vi.stubEnv("VERCEL_TOKEN", "vercel_test_token");
    vi.stubEnv("VERCEL_TEAM_ID", "team_test");
    vi.stubEnv("DATABASE_URL", "");
  });

  afterEach(() => {
    restore?.();
    restore = undefined;
    vi.unstubAllEnvs();
  });

  it("parses domains and diffs environment by name without leaking values", async () => {
    const expectedEnv: EnvExpectation[] = [
      { name: "DATABASE_URL", targets: ["production"] },
      { name: "API_KEY", targets: ["production", "preview"] },
    ];

    restore = mockFetchSequence([
      {
        domains: [
          { name: "uptonm.dev", verified: true, redirect: null },
          { name: "www.uptonm.dev", verified: false, redirect: "uptonm.dev" },
        ],
      },
      {
        envs: [
          {
            key: "API_KEY",
            target: ["production", "preview"],
            type: "encrypted",
            value: "SUPER_SECRET_VALUE",
          },
          { key: "EXTRA_TOKEN", target: ["production"], type: "plain" },
        ],
      },
      { currency: "usd", total: 40, budget: 100 },
      { misconfigured: false, configuredBy: "CNAME" },
      { misconfigured: true, configuredBy: null },
    ]);

    const observation = await collectVercelConfig(APP, { expectedEnv });

    expect(observation.status).toBe("ok");
    expect(observation.data?.domains?.[0]).toMatchObject({
      name: "uptonm.dev",
      verified: true,
      misconfigured: false,
    });
    expect(observation.data?.domains?.[1]?.misconfigured).toBe(true);

    const drift = observation.data?.environment?.drift;
    expect(drift?.missing.map((entry) => entry.name)).toContain("DATABASE_URL");
    expect(drift?.unexpected).toContain("EXTRA_TOKEN");
    expect(observation.data?.billing.budgetPercent).toBe(40);

    expect(JSON.stringify(observation)).not.toContain("SUPER_SECRET_VALUE");
  });

  it("marks billing unsupported (not error) when the usage endpoint is forbidden", async () => {
    restore = mockFetchSequence([
      { domains: [] },
      { envs: [] },
      FORBIDDEN,
    ]);

    const observation = await collectVercelConfig(APP);

    expect(observation.status).toBe("ok");
    expect(observation.data?.billing.supported).toBe(false);
    expect(observation.data?.availability.billing.status).toBe("unsupported");
  });

  it("returns unconfigured when no token is present", async () => {
    vi.stubEnv("VERCEL_TOKEN", "");
    vi.stubEnv("vercel_pat", "");

    const observation = await collectVercelConfig(APP);

    expect(observation.status).toBe("unconfigured");
    expect(observation.data).toBeNull();
  });
});
