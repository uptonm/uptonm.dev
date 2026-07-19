import { type AppObservations } from "@/lib/fleet/collectors";
import { hasData } from "@/lib/fleet/observation";
import type { FleetAppId } from "@/lib/fleet/registry";
import { FLEET_THRESHOLDS } from "@/lib/fleet/thresholds";

export type AttentionSeverity = "critical" | "warning" | "info";

export type AttentionSignal = {
  fingerprint: string;
  appId: FleetAppId;
  rule: string;
  severity: AttentionSeverity;
  title: string;
  detail: string;
  sourceUrl?: string;
};

/**
 * Deterministic 32-bit FNV-1a hash rendered as hex. Fingerprints must be
 * stable across runs, so the derivation deliberately avoids any clock- or
 * random-derived entropy — identical input always yields the same string.
 */
function fingerprintOf(appId: FleetAppId, rule: string, discriminator: string): string {
  const input = `${appId}:${rule}:${discriminator}`;
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

function makeSignal(
  appId: FleetAppId,
  rule: string,
  discriminator: string,
  severity: AttentionSeverity,
  title: string,
  detail: string,
  sourceUrl?: string,
): AttentionSignal {
  return {
    fingerprint: fingerprintOf(appId, rule, discriminator),
    appId,
    rule,
    severity,
    title,
    detail,
    ...(sourceUrl ? { sourceUrl } : {}),
  };
}

/**
 * Derive the full set of attention signals for one app across every provider
 * lane. Pure: no network, no database, no clock or random access. Lanes whose
 * observation carries no data are skipped so absent capabilities never
 * manufacture signals.
 */
export function deriveAttention(obs: AppObservations): AttentionSignal[] {
  const { appId } = obs;
  const signals: AttentionSignal[] = [];

  if (hasData(obs.deployments)) {
    const deploy = obs.deployments.data;
    if (deploy.latestFailure) {
      const critical =
        deploy.successRate7d !== null && deploy.successRate7d < 0.5;
      signals.push(
        makeSignal(
          appId,
          "deploy-failure",
          deploy.latestFailure.id ?? deploy.latestFailure.commitSha ?? "latest",
          critical ? "critical" : "warning",
          "Production deployment failing",
          deploy.latestFailure.errorCode
            ? `Latest production deploy failed: ${deploy.latestFailure.errorCode}.`
            : "The latest production deployment ended in an error state.",
          obs.deployments.sourceUrl,
        ),
      );
    }
  }

  if (hasData(obs.delivery)) {
    const delivery = obs.delivery.data;
    const { behindBy, unshippedCommitCount } = delivery.drift;
    if (typeof behindBy === "number" && behindBy > 0) {
      signals.push(
        makeSignal(
          appId,
          "production-behind",
          String(behindBy),
          "warning",
          "Production is behind the default branch",
          `Production trails the default branch by ${behindBy} commit(s).`,
          delivery.repository.url,
        ),
      );
    }
    if (typeof unshippedCommitCount === "number" && unshippedCommitCount > 0) {
      signals.push(
        makeSignal(
          appId,
          "unshipped-commits",
          String(unshippedCommitCount),
          "info",
          "Unshipped commits on the default branch",
          `${unshippedCommitCount} commit(s) merged but not yet in production.`,
          delivery.repository.url,
        ),
      );
    }
    if (delivery.pullRequests.stalePrCount > 0) {
      const oldest = delivery.pullRequests.oldestPrAgeDays;
      signals.push(
        makeSignal(
          appId,
          "stale-prs",
          String(delivery.pullRequests.stalePrCount),
          "info",
          "Stale pull requests need review",
          `${delivery.pullRequests.stalePrCount} PR(s) open longer than ${FLEET_THRESHOLDS.stalePrDays} days${
            oldest !== null ? ` (oldest ${oldest}d).` : "."
          }`,
          delivery.repository.url,
        ),
      );
    }
    if (delivery.branches.staleCount > 0) {
      signals.push(
        makeSignal(
          appId,
          "stale-branches",
          String(delivery.branches.staleCount),
          "info",
          "Stale branches to clean up",
          `${delivery.branches.staleCount} branch(es) untouched for over ${FLEET_THRESHOLDS.staleBranchDays} days.`,
          delivery.repository.url,
        ),
      );
    }
  }

  if (hasData(obs.security)) {
    const dependabot = obs.security.data.dependabot;
    if (dependabot) {
      const { critical, high } = dependabot.bySeverity;
      if (critical > 0) {
        signals.push(
          makeSignal(
            appId,
            "security-vuln",
            `critical:${critical}`,
            "critical",
            "Critical dependency vulnerabilities",
            `${critical} open critical Dependabot alert(s).`,
            obs.security.sourceUrl,
          ),
        );
      } else if (high > 0) {
        signals.push(
          makeSignal(
            appId,
            "security-vuln",
            `high:${high}`,
            "warning",
            "High-severity dependency vulnerabilities",
            `${high} open high-severity Dependabot alert(s).`,
            obs.security.sourceUrl,
          ),
        );
      }
    }
  }

  if (hasData(obs.config)) {
    const config = obs.config.data;
    for (const domain of config.domains ?? []) {
      if (domain.tls.status === "critical") {
        signals.push(
          makeSignal(
            appId,
            "tls-expiry",
            domain.name,
            "critical",
            "TLS certificate expiring imminently",
            `TLS for ${domain.name} expires in ${domain.tls.daysRemaining ?? "<unknown>"} day(s).`,
            obs.config.sourceUrl,
          ),
        );
      } else if (domain.tls.status === "warning") {
        signals.push(
          makeSignal(
            appId,
            "tls-expiry",
            domain.name,
            "warning",
            "TLS certificate expiring soon",
            `TLS for ${domain.name} expires in ${domain.tls.daysRemaining ?? "<unknown>"} day(s).`,
            obs.config.sourceUrl,
          ),
        );
      }
    }
    const missing = config.environment?.drift?.missing ?? [];
    if (missing.length > 0) {
      signals.push(
        makeSignal(
          appId,
          "env-missing",
          missing.map((entry) => entry.name).join(","),
          "warning",
          "Environment variables missing",
          `Missing expected env var(s): ${missing.map((entry) => entry.name).join(", ")}.`,
          obs.config.sourceUrl,
        ),
      );
    }
  }

  if (hasData(obs.operations)) {
    const { httpProbe } = obs.operations.data;
    if (!httpProbe.ok) {
      signals.push(
        makeSignal(
          appId,
          "uptime",
          httpProbe.url,
          "critical",
          "External uptime probe failing",
          httpProbe.error
            ? `Probe of ${httpProbe.url} failed: ${httpProbe.error}.`
            : `Probe of ${httpProbe.url} returned HTTP ${httpProbe.statusCode ?? "no response"}.`,
          obs.operations.sourceUrl,
        ),
      );
    }
  }

  return signals;
}
