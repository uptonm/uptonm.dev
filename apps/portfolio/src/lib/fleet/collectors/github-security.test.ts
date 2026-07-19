import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { mockFetchSequence } from "@/test/mocks/fetch";
import type { FleetApp } from "../registry";
import { collectGithubSecurity } from "./github-security";

const APP: FleetApp = {
  id: "portfolio",
  label: "Portfolio",
  url: "https://uptonm.dev",
  iconSrc: "/gates/portfolio.png",
  github: { owner: "uptonm", repo: "uptonm.dev" },
  vercel: { projectId: "prj_test", projectName: "portfolio" },
  isControlPlane: true,
  capabilities: ["security"],
};

const FORBIDDEN = { body: { message: "Forbidden" }, options: { status: 403 } };

describe("collectGithubSecurity", () => {
  let restore: (() => void) | undefined;

  beforeEach(() => {
    vi.stubEnv("GITHUB_TOKEN", "ghp_test_token");
    vi.stubEnv("DATABASE_URL", "");
  });

  afterEach(() => {
    restore?.();
    restore = undefined;
    vi.unstubAllEnvs();
  });

  it("degrades to unsupported when every surface is forbidden, without fake zeros", async () => {
    restore = mockFetchSequence([FORBIDDEN, FORBIDDEN, FORBIDDEN, FORBIDDEN]);

    const observation = await collectGithubSecurity(APP);

    expect(observation.status).not.toBe("ok");
    expect(observation.data).toBeNull();
    expect(observation.status).toBe("unsupported");
  });

  it("parses dependabot counts and reflects mixed availability", async () => {
    restore = mockFetchSequence([
      [
        { security_advisory: { severity: "critical" } },
        { security_advisory: { severity: "high" } },
        { security_vulnerability: { severity: "moderate" } },
      ],
      FORBIDDEN,
      FORBIDDEN,
      FORBIDDEN,
    ]);

    const observation = await collectGithubSecurity(APP);

    expect(observation.status).toBe("partial");
    expect(observation.data?.dependabot?.totalOpen).toBe(3);
    expect(observation.data?.dependabot?.bySeverity).toEqual({
      critical: 1,
      high: 1,
      medium: 1,
      low: 0,
    });
    expect(observation.data?.availability.dependabot.status).toBe("ok");
    expect(observation.data?.availability.secretScanning.status).toBe(
      "forbidden",
    );
    expect(observation.data?.secretScanning).toBeNull();
    expect(observation.data?.codeScanning).toBeNull();
  });

  it("returns unconfigured when no token is present", async () => {
    vi.stubEnv("GITHUB_TOKEN", "");
    vi.stubEnv("github_pat", "");

    const observation = await collectGithubSecurity(APP);

    expect(observation.status).toBe("unconfigured");
    expect(observation.data).toBeNull();
  });

  it("uses the provided default branch in the protection request", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify([]), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    const original = global.fetch;
    global.fetch = fetchMock as typeof fetch;
    restore = () => {
      global.fetch = original;
    };

    await collectGithubSecurity(APP, { defaultBranch: "trunk" });

    const calledUrls = fetchMock.mock.calls.map((call) => String(call[0]));
    expect(
      calledUrls.some((url) => url.includes("/branches/trunk/protection")),
    ).toBe(true);
  });
});
