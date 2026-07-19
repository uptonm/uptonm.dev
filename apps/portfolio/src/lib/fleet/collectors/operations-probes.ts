import "server-only";

import { collect } from "../collector/collect";
import { ok, type Observation } from "../observation";
import type { FleetApp } from "../registry";
import { FLEET_THRESHOLDS } from "../thresholds";

const HTTP_TIMEOUT_MS = 10_000;

export type HttpProbe = {
  url: string;
  ok: boolean;
  statusCode: number | null;
  latencyMs: number;
  redirectedTo: string | null;
  error?: string;
};

export type DnsProbe =
  | { ok: true; a: string[]; aaaa: string[] }
  | { ok: false; error: string };

export type TlsProbe =
  | {
      ok: true;
      validFrom: string;
      validTo: string;
      daysUntilExpiry: number;
      warning: boolean;
      critical: boolean;
      issuer: string | null;
    }
  | { ok: false; error: string };

export type OperationsProbeResult = {
  httpProbe: HttpProbe;
  dnsProbe: DnsProbe;
  tlsProbe: TlsProbe;
};

function hostnameOf(url: string): string | null {
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}

function targetUrl(app: FleetApp, healthPath?: string): string {
  if (!healthPath) return app.url;
  try {
    return new URL(healthPath, app.url).toString();
  } catch {
    return app.url;
  }
}

async function runHttpProbe(url: string): Promise<HttpProbe> {
  const startedAt = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), HTTP_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
    });
    const latencyMs = Date.now() - startedAt;
    const redirectedTo =
      response.redirected && response.url !== url ? response.url : null;
    return {
      url,
      ok: response.ok,
      statusCode: response.status,
      latencyMs,
      redirectedTo,
    };
  } catch (error) {
    return {
      url,
      ok: false,
      statusCode: null,
      latencyMs: Date.now() - startedAt,
      redirectedTo: null,
      error: error instanceof Error ? error.message : String(error),
    };
  } finally {
    clearTimeout(timer);
  }
}

async function runDnsProbe(hostname: string | null): Promise<DnsProbe> {
  if (!hostname) return { ok: false, error: "no hostname" };
  try {
    const dns = await import("node:dns/promises");
    const [a, aaaa] = await Promise.all([
      dns.resolve4(hostname).catch(() => [] as string[]),
      dns.resolve6(hostname).catch(() => [] as string[]),
    ]);
    if (a.length === 0 && aaaa.length === 0) {
      return { ok: false, error: "no A/AAAA records" };
    }
    return { ok: true, a, aaaa };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}

async function runTlsProbe(hostname: string | null): Promise<TlsProbe> {
  if (!hostname) return { ok: false, error: "no hostname" };
  try {
    const tls = await import("node:tls");
    return await new Promise<TlsProbe>((resolve) => {
      let settled = false;
      const settle = (result: TlsProbe): void => {
        if (settled) return;
        settled = true;
        socket.destroy();
        resolve(result);
      };
      const socket = tls.connect(
        { host: hostname, port: 443, servername: hostname, timeout: HTTP_TIMEOUT_MS },
        () => {
          const cert = socket.getPeerCertificate();
          if (!cert || !cert.valid_to) {
            settle({ ok: false, error: "no peer certificate" });
            return;
          }
          const validTo = new Date(cert.valid_to);
          const validFrom = new Date(cert.valid_from);
          const daysUntilExpiry = Math.floor(
            (validTo.getTime() - Date.now()) / 86_400_000,
          );
          settle({
            ok: true,
            validFrom: validFrom.toISOString(),
            validTo: validTo.toISOString(),
            daysUntilExpiry,
            warning: daysUntilExpiry <= FLEET_THRESHOLDS.tlsWarningDays,
            critical: daysUntilExpiry <= FLEET_THRESHOLDS.tlsCriticalDays,
            issuer:
              cert.issuer && typeof cert.issuer.O === "string"
                ? cert.issuer.O
                : null,
          });
        },
      );
      socket.on("timeout", () => settle({ ok: false, error: "tls timeout" }));
      socket.on("error", (error: Error) =>
        settle({ ok: false, error: error.message }),
      );
    });
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}

export function probeApp(
  app: FleetApp,
  opts?: { healthPath?: string },
): Promise<Observation<OperationsProbeResult>> {
  const url = targetUrl(app, opts?.healthPath);
  const hostname = hostnameOf(app.url);
  return collect<OperationsProbeResult>({
    appId: app.id,
    category: "runtimeProbe",
    trigger: "manual",
    collector: async () => {
      const [httpProbe, dnsProbe, tlsProbe] = await Promise.all([
        runHttpProbe(url),
        runDnsProbe(hostname),
        runTlsProbe(hostname),
      ]);
      return ok(
        { httpProbe, dnsProbe, tlsProbe },
        { source: "operations-probes", sourceUrl: url },
      );
    },
  });
}

/**
 * Pure incident rule: an uptime incident opens once the trailing streak of
 * failed probes reaches `uptimeIncidentFailureStreak`. A success anywhere in
 * the trailing window resets the streak, so old failures before a recovery do
 * not count.
 */
export function evaluateUptimeIncident(
  recentProbes: Array<{ ok: boolean }>,
): { shouldOpen: boolean; consecutiveFailures: number } {
  let consecutiveFailures = 0;
  for (let i = recentProbes.length - 1; i >= 0; i -= 1) {
    if (recentProbes[i]?.ok !== false) break;
    consecutiveFailures += 1;
  }
  return {
    shouldOpen:
      consecutiveFailures >= FLEET_THRESHOLDS.uptimeIncidentFailureStreak,
    consecutiveFailures,
  };
}

export type ParsedHeartbeat = {
  job: string;
  status: "success" | "failure";
  durationMs?: number;
  ranAt?: string;
};

/** Validate an incoming cron heartbeat payload; never throws. */
export function parseHeartbeat(
  body: unknown,
): ParsedHeartbeat | { error: string } {
  if (body === null || typeof body !== "object") {
    return { error: "body must be an object" };
  }
  const value = body as Record<string, unknown>;

  if (typeof value.job !== "string" || !value.job) {
    return { error: "job is required" };
  }
  if (value.status !== "success" && value.status !== "failure") {
    return { error: "status must be 'success' or 'failure'" };
  }

  const parsed: ParsedHeartbeat = { job: value.job, status: value.status };
  if (typeof value.durationMs === "number" && Number.isFinite(value.durationMs)) {
    parsed.durationMs = value.durationMs;
  }
  if (typeof value.ranAt === "string" && value.ranAt) {
    parsed.ranAt = value.ranAt;
  }
  return parsed;
}
