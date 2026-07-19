"use client";

import { updateGateAction } from "@/app/admin/actions";
import type {
  FleetMetricsSnapshot,
  GithubCiState,
  ProviderResult,
  VercelDeploymentMetrics,
  VercelDeploymentState,
  VercelProjectMetrics,
} from "@/lib/fleet-metrics";
import type { GatedApp, GatedAppId, Gates } from "@/lib/gates";
import { Switch } from "@uptonm/ui/components/base/switch";
import { cn } from "@uptonm/ui/lib/utils";
import {
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  ChevronDown,
  CircleDot,
  CircleMinus,
  Clock3,
  GitBranch,
  GitCommitHorizontal,
  GitFork,
  GitGraph,
  GitPullRequest,
  Globe2,
  LoaderCircle,
  LockKeyhole,
  Rocket,
  Star,
  Triangle,
  XCircle,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useState, useTransition } from "react";

type Tone = "success" | "warning" | "danger" | "info" | "neutral";
type FleetApp = Pick<GatedApp, "id" | "label" | "url" | "iconSrc">;

const toneClasses: Record<Tone, string> = {
  success:
    "border-emerald-600/20 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300",
  warning:
    "border-amber-600/20 bg-amber-500/10 text-amber-800 dark:text-amber-300",
  danger: "border-red-600/20 bg-red-500/10 text-red-800 dark:text-red-300",
  info: "border-sky-600/20 bg-sky-500/10 text-sky-800 dark:text-sky-300",
  neutral: "border-border bg-card text-muted-foreground",
};

function hostLabel(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
}

function shortSha(sha: string | null): string {
  return sha?.slice(0, 7) ?? "unknown";
}

function relativeTime(value: string | null, reference: string): string {
  if (!value) return "unknown";
  const timestamp = Date.parse(value);
  const now = Date.parse(reference);
  if (!Number.isFinite(timestamp) || !Number.isFinite(now)) return "unknown";

  const seconds = Math.max(0, Math.round((now - timestamp) / 1_000));
  if (seconds < 45) return "just now";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 48) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 60) return `${days}d ago`;
  const months = Math.round(days / 30);
  if (months < 24) return `${months}mo ago`;
  return `${Math.round(months / 12)}y ago`;
}

function durationLabel(milliseconds: number | null): string | null {
  if (milliseconds === null) return null;
  const totalSeconds = Math.max(0, Math.round(milliseconds / 1_000));
  if (totalSeconds < 60) return `${totalSeconds}s`;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes < 60) return seconds ? `${minutes}m ${seconds}s` : `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
}

function StatusPill({
  tone,
  children,
  icon,
}: {
  tone: Tone;
  children: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex max-w-full shrink-0 items-center gap-1 whitespace-nowrap rounded-full border px-2 py-1 text-xs font-medium leading-none",
        toneClasses[tone],
      )}
    >
      {icon}
      {children}
    </span>
  );
}

function ciPresentation(state: GithubCiState): {
  label: string;
  tone: Tone;
  icon: ReactNode;
} {
  switch (state) {
    case "success":
      return {
        label: "Passing",
        tone: "success",
        icon: <CheckCircle2 className="size-3" aria-hidden />,
      };
    case "failure":
      return {
        label: "Failing",
        tone: "danger",
        icon: <XCircle className="size-3" aria-hidden />,
      };
    case "pending":
      return {
        label: "Running",
        tone: "info",
        icon: <LoaderCircle className="size-3" aria-hidden />,
      };
    case "expected":
      return {
        label: "Expected",
        tone: "warning",
        icon: <Clock3 className="size-3" aria-hidden />,
      };
    case "none":
      return {
        label: "No checks",
        tone: "neutral",
        icon: <CircleMinus className="size-3" aria-hidden />,
      };
  }
}

function deploymentPresentation(state: VercelDeploymentState): {
  label: string;
  tone: Tone;
  icon: ReactNode;
} {
  switch (state) {
    case "READY":
      return {
        label: "Ready",
        tone: "success",
        icon: <CheckCircle2 className="size-3" aria-hidden />,
      };
    case "QUEUED":
    case "INITIALIZING":
    case "BUILDING":
      return {
        label:
          state === "BUILDING"
            ? "Building"
            : state === "QUEUED"
              ? "Queued"
              : "Starting",
        tone: "info",
        icon: <LoaderCircle className="size-3" aria-hidden />,
      };
    case "ERROR":
    case "BLOCKED":
      return {
        label: state === "ERROR" ? "Failed" : "Blocked",
        tone: "danger",
        icon: <XCircle className="size-3" aria-hidden />,
      };
    case "CANCELED":
      return {
        label: "Canceled",
        tone: "warning",
        icon: <CircleMinus className="size-3" aria-hidden />,
      };
    case "DELETED":
    case "UNKNOWN":
      return {
        label: state === "DELETED" ? "Deleted" : "Unknown",
        tone: "neutral",
        icon: <CircleMinus className="size-3" aria-hidden />,
      };
  }
}

function ProviderUnavailable({
  provider,
  message,
  icon,
}: {
  provider: string;
  message: string;
  icon: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-muted/30 p-3 sm:p-4">
      <div className="flex items-center gap-2 text-sm font-medium">
        {icon}
        {provider}
      </div>
      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
        {message}
      </p>
    </div>
  );
}

function MetricLink({
  href,
  label,
  value,
  icon,
  context,
}: {
  href: string;
  label: string;
  value: number;
  icon: ReactNode;
  context: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="group min-w-0 rounded-lg border border-border bg-background/50 px-2.5 py-2.5 transition-colors hover:border-foreground/30 hover:bg-background sm:px-3"
      aria-label={`${value} ${label} for ${context}`}
    >
      <div className="flex min-h-6 min-w-0 items-start gap-1 text-[10px] leading-tight text-muted-foreground sm:min-h-0 sm:gap-1.5 sm:text-[11px]">
        <span className="hidden shrink-0 min-[360px]:inline-flex">{icon}</span>
        <span className="min-w-0 [overflow-wrap:anywhere]">{label}</span>
      </div>
      <p className="mt-1 font-mono text-lg font-semibold tabular-nums">
        {value}
      </p>
    </a>
  );
}

function GithubPanel({
  result,
  referenceTime,
}: {
  result: FleetMetricsSnapshot["apps"][GatedAppId]["github"];
  referenceTime: string;
}) {
  if (result.status === "error") {
    return (
      <ProviderUnavailable
        provider="GitHub"
        message={result.message}
        icon={<GitGraph className="size-4" aria-hidden />}
      />
    );
  }

  const repository = result.data;
  const ci = ciPresentation(repository.ci.state);
  const checksSummary =
    repository.ci.total === 0
      ? "No checks on the latest commit"
      : [
          repository.ci.passed ? `${repository.ci.passed} passed` : null,
          repository.ci.failed ? `${repository.ci.failed} failed` : null,
          repository.ci.pending ? `${repository.ci.pending} running` : null,
          repository.ci.skipped ? `${repository.ci.skipped} skipped` : null,
        ]
          .filter(Boolean)
          .join(" · ");
  const branch = repository.defaultBranch ?? "default branch";
  const actionsUrl = `${repository.url}/actions?query=${encodeURIComponent(`branch:${branch}`)}`;

  return (
    <div>
      <div className="grid grid-cols-3 gap-2">
        <MetricLink
          href={`${repository.url}/pulls`}
          label="Open PRs"
          value={repository.openPullRequests}
          icon={<GitPullRequest className="size-3" aria-hidden />}
          context={repository.nameWithOwner}
        />
        <MetricLink
          href={`${repository.url}/branches`}
          label="Branches"
          value={repository.branchCount}
          icon={<GitBranch className="size-3" aria-hidden />}
          context={repository.nameWithOwner}
        />
        <MetricLink
          href={`${repository.url}/issues`}
          label="Issues"
          value={repository.openIssues}
          icon={<CircleDot className="size-3" aria-hidden />}
          context={repository.nameWithOwner}
        />
      </div>

      <div className="mt-3 rounded-xl border border-border bg-muted/25 p-3 sm:p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <a
            href={actionsUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-7 items-center gap-2 text-sm font-medium hover:text-brand"
            aria-label={`GitHub checks for ${repository.nameWithOwner}`}
          >
            <GitGraph className="size-4" aria-hidden />
            GitHub checks
          </a>
          <StatusPill tone={ci.tone} icon={ci.icon}>
            {ci.label}
          </StatusPill>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          {checksSummary || `${repository.ci.total} checks`}
          {repository.ci.truncated ? " · first 100 shown" : null}
        </p>

        {repository.ci.attentionChecks.length ? (
          <ul className="mt-2 space-y-1">
            {repository.ci.attentionChecks.map((check) => (
              <li key={`${check.name}-${check.url ?? check.state}`}>
                {check.url ? (
                  <a
                    href={check.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex min-h-7 min-w-0 items-start gap-1.5 py-1 text-xs leading-relaxed text-muted-foreground hover:text-foreground"
                  >
                    {check.state === "failure" ? (
                      <XCircle
                        className="mt-0.5 size-3 shrink-0 text-red-600 dark:text-red-300"
                        aria-hidden
                      />
                    ) : (
                      <LoaderCircle
                        className="mt-0.5 size-3 shrink-0 text-sky-600 dark:text-sky-300"
                        aria-hidden
                      />
                    )}
                    <span className="min-w-0 flex-1 [overflow-wrap:anywhere]">
                      {check.name}
                    </span>
                    <ArrowUpRight
                      className="mt-0.5 size-3 shrink-0"
                      aria-hidden
                    />
                  </a>
                ) : (
                  <span className="block text-xs leading-relaxed text-muted-foreground [overflow-wrap:anywhere]">
                    {check.name}
                  </span>
                )}
              </li>
            ))}
          </ul>
        ) : null}

        {repository.head ? (
          <a
            href={repository.head.url}
            target="_blank"
            rel="noreferrer"
            className="mt-3 block border-t border-border pt-3 hover:text-brand"
          >
            <div className="flex min-w-0 items-center gap-2 text-xs">
              <GitCommitHorizontal
                className="size-3.5 shrink-0 text-muted-foreground"
                aria-hidden
              />
              <code className="shrink-0">{shortSha(repository.head.sha)}</code>
            </div>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground [overflow-wrap:anywhere]">
              {repository.head.message}
            </p>
            <p className="mt-1 flex flex-wrap items-center gap-x-1 pl-5.5 text-[11px] text-muted-foreground">
              <span className="min-w-0 [overflow-wrap:anywhere]">{branch}</span>
              <span aria-hidden>·</span>
              <time dateTime={repository.head.committedAt}>
                {relativeTime(repository.head.committedAt, referenceTime)}
              </time>
            </p>
          </a>
        ) : null}

        <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 border-t border-border pt-3 text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Star className="size-3" aria-hidden />
            {repository.stars}
          </span>
          <span className="inline-flex items-center gap-1">
            <GitFork className="size-3" aria-hidden />
            {repository.forks}
          </span>
          {repository.latestRelease ? (
            <a
              href={repository.latestRelease.url}
              target="_blank"
              rel="noreferrer"
              className="inline-block max-w-full align-bottom [overflow-wrap:anywhere] hover:text-foreground"
            >
              Release {repository.latestRelease.tag}
            </a>
          ) : (
            <span>No releases</span>
          )}
          {repository.isPrivate ? <span>Private repo</span> : null}
          {repository.isArchived ? <span>Archived</span> : null}
        </div>
      </div>
    </div>
  );
}

function DeploymentDetails({
  deployment,
  label,
  referenceTime,
}: {
  deployment: VercelDeploymentMetrics;
  label: string;
  referenceTime: string;
}) {
  const presentation = deploymentPresentation(deployment.state);
  const link = deployment.inspectorUrl ?? deployment.deploymentUrl;
  const durationText =
    durationLabel(deployment.buildDurationMs) ??
    durationLabel(deployment.totalDurationMs);

  const content = (
    <>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="min-w-0 text-xs font-medium">{label}</span>
        <StatusPill tone={presentation.tone} icon={presentation.icon}>
          {presentation.label}
        </StatusPill>
      </div>
      <div className="mt-2 flex flex-wrap gap-x-2 gap-y-1 text-[11px] text-muted-foreground">
        {deployment.createdAt ? (
          <time dateTime={deployment.createdAt}>
            {relativeTime(deployment.createdAt, referenceTime)}
          </time>
        ) : null}
        {durationText ? <span>· {durationText} elapsed</span> : null}
        {deployment.readySubstate ? (
          <span>· {deployment.readySubstate.toLowerCase()}</span>
        ) : null}
      </div>
      {deployment.commitMessage ? (
        <p className="mt-2 whitespace-pre-wrap text-xs leading-relaxed [overflow-wrap:anywhere]">
          {deployment.commitMessage}
        </p>
      ) : null}
      {deployment.branch || deployment.commitSha ? (
        <p className="mt-1 flex min-w-0 flex-wrap items-start gap-x-1.5 gap-y-0.5 text-[11px] text-muted-foreground">
          <GitBranch className="mt-0.5 size-3 shrink-0" aria-hidden />
          <span className="min-w-0 [overflow-wrap:anywhere]">
            {deployment.branch ?? "branch"}
          </span>
          {deployment.commitSha ? (
            <>
              <span className="shrink-0">·</span>
              <code className="shrink-0">{shortSha(deployment.commitSha)}</code>
            </>
          ) : null}
        </p>
      ) : null}
      {deployment.errorMessage || deployment.errorCode ? (
        <p className="mt-2 whitespace-pre-wrap text-xs leading-relaxed text-red-700 [overflow-wrap:anywhere] dark:text-red-300">
          {deployment.errorCode ? `${deployment.errorCode}: ` : null}
          {deployment.errorMessage ?? "Deployment failed."}
        </p>
      ) : null}
    </>
  );

  return link ? (
    <a
      href={link}
      target="_blank"
      rel="noreferrer"
      className="block min-w-0 rounded-lg outline-none transition-colors hover:text-brand focus-visible:ring-2 focus-visible:ring-ring"
    >
      {content}
    </a>
  ) : (
    <div>{content}</div>
  );
}

function SyncPill({
  github,
  vercel,
}: {
  github: FleetMetricsSnapshot["apps"][GatedAppId]["github"];
  vercel: ProviderResult<VercelProjectMetrics>;
}) {
  if (github.status !== "ok" || vercel.status !== "ok") return null;
  const githubSha = github.data.head?.sha;
  const deployedSha = vercel.data.live?.commitSha;
  if (!githubSha || !deployedSha) return null;

  const matches = githubSha === deployedSha;
  return (
    <StatusPill
      tone={matches ? "success" : "warning"}
      icon={
        matches ? (
          <CheckCircle2 className="size-3" aria-hidden />
        ) : (
          <AlertTriangle className="size-3" aria-hidden />
        )
      }
    >
      {matches ? "Live matches HEAD" : "Live differs from HEAD"}
    </StatusPill>
  );
}

function VercelPanel({
  result,
  github,
  referenceTime,
}: {
  result: FleetMetricsSnapshot["apps"][GatedAppId]["vercel"];
  github: FleetMetricsSnapshot["apps"][GatedAppId]["github"];
  referenceTime: string;
}) {
  if (result.status === "error") {
    return (
      <ProviderUnavailable
        provider="Vercel"
        message={result.message}
        icon={<Triangle className="size-4 fill-current" aria-hidden />}
      />
    );
  }

  const project = result.data;
  const live = project.live;
  const latest = project.latest;
  const latestIsLive =
    Boolean(live?.id) && Boolean(latest?.id) && live?.id === latest?.id;

  return (
    <div className="rounded-xl border border-border bg-muted/25 p-3 sm:p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="inline-flex items-center gap-2 text-sm font-medium">
          <Triangle className="size-3.5 fill-current" aria-hidden />
          Vercel
        </div>
        <SyncPill github={github} vercel={result} />
      </div>

      {live ? (
        <div className="mt-3">
          <DeploymentDetails
            deployment={live}
            label="Live production"
            referenceTime={referenceTime}
          />
        </div>
      ) : (
        <p className="mt-3 text-xs text-muted-foreground">
          No production deployment found.
        </p>
      )}

      {latest && !latestIsLive ? (
        <div className="mt-3 border-t border-border pt-3">
          <DeploymentDetails
            deployment={latest}
            label={`Latest attempt · ${latest.environment}`}
            referenceTime={referenceTime}
          />
        </div>
      ) : null}

      {project.recent &&
      (project.recent.failed ||
        project.recent.canceled ||
        project.recent.active) ? (
        <div className="mt-3 flex flex-wrap gap-2 border-t border-border pt-3">
          {project.recent.active ? (
            <StatusPill
              tone="info"
              icon={<LoaderCircle className="size-3" aria-hidden />}
            >
              {project.recent.active} active
            </StatusPill>
          ) : null}
          {project.recent.failed ? (
            <StatusPill
              tone="danger"
              icon={<XCircle className="size-3" aria-hidden />}
            >
              {project.recent.failed} failed in last {project.recent.sampleSize}
            </StatusPill>
          ) : null}
          {project.recent.canceled ? (
            <StatusPill
              tone="warning"
              icon={<CircleMinus className="size-3" aria-hidden />}
            >
              {project.recent.canceled} canceled in last{" "}
              {project.recent.sampleSize}
            </StatusPill>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function MobileFleetSnapshot({
  metrics,
}: {
  metrics: FleetMetricsSnapshot["apps"][GatedAppId];
}) {
  const github =
    metrics.github.status === "ok"
      ? ciPresentation(metrics.github.data.ci.state)
      : null;
  const deployment =
    metrics.vercel.status === "ok" && metrics.vercel.data.live
      ? deploymentPresentation(metrics.vercel.data.live.state)
      : null;

  return (
    <div
      className="mt-3 flex flex-wrap gap-2 sm:hidden"
      aria-label="Current health summary"
    >
      {github ? (
        <StatusPill tone={github.tone} icon={github.icon}>
          CI {github.label}
        </StatusPill>
      ) : (
        <StatusPill
          tone="danger"
          icon={<XCircle className="size-3" aria-hidden />}
        >
          GitHub unavailable
        </StatusPill>
      )}
      {deployment ? (
        <StatusPill tone={deployment.tone} icon={deployment.icon}>
          Deploy {deployment.label}
        </StatusPill>
      ) : (
        <StatusPill
          tone={metrics.vercel.status === "error" ? "danger" : "neutral"}
          icon={<Triangle className="size-3 fill-current" aria-hidden />}
        >
          {metrics.vercel.status === "error"
            ? "Vercel unavailable"
            : "No live deploy"}
        </StatusPill>
      )}
      {metrics.github.status === "ok" ? (
        <StatusPill
          tone="neutral"
          icon={<GitPullRequest className="size-3" aria-hidden />}
        >
          {metrics.github.data.openPullRequests} open PR
          {metrics.github.data.openPullRequests === 1 ? "" : "s"}
        </StatusPill>
      ) : null}
    </div>
  );
}

function FleetCard({
  app,
  locked,
  onToggle,
  pending,
  metrics,
  referenceTime,
}: {
  app: FleetApp;
  locked: boolean;
  onToggle: (appId: GatedAppId, next: boolean) => void;
  pending: boolean;
  metrics: FleetMetricsSnapshot["apps"][GatedAppId];
  referenceTime: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const headingId = `fleet-${app.id}-title`;
  const metricsId = `fleet-${app.id}-metrics`;

  return (
    <article
      className="min-w-0 rounded-xl border border-border bg-card p-4 text-card-foreground shadow-sm shadow-foreground/[0.025] sm:rounded-2xl sm:p-5"
      aria-labelledby={headingId}
    >
      <header className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-3 gap-y-3 sm:flex sm:items-start">
        <Image
          src={app.iconSrc}
          alt=""
          width={40}
          height={40}
          className="size-10 shrink-0 rounded-lg"
          aria-hidden
        />
        <div className="min-w-0 flex-1">
          <h3 id={headingId}>
            <a
              href={app.url}
              target="_blank"
              rel="noreferrer"
              className="group inline-flex max-w-full items-start gap-1.5 font-display text-lg font-semibold tracking-tight hover:text-brand"
            >
              <span className="min-w-0 [overflow-wrap:anywhere]">
                {app.label}
              </span>
              <ArrowUpRight
                className="mt-1 size-3.5 shrink-0 opacity-50 transition-opacity group-hover:opacity-100"
                aria-hidden
              />
            </a>
          </h3>
          <p className="text-xs leading-relaxed text-muted-foreground [overflow-wrap:anywhere]">
            {hostLabel(app.url)}
          </p>
        </div>
        <div className="col-span-2 flex min-h-11 items-center justify-between rounded-lg border border-border bg-muted/20 px-3 py-2 sm:ml-auto sm:min-h-0 sm:shrink-0 sm:flex-col-reverse sm:items-end sm:gap-2 sm:border-0 sm:bg-transparent sm:p-0">
          <span
            className={cn(
              "inline-flex items-center gap-1.5 text-xs",
              locked ? "text-foreground" : "text-muted-foreground",
            )}
          >
            {locked ? (
              <LockKeyhole className="size-3.5" aria-hidden />
            ) : (
              <Globe2 className="size-3.5" aria-hidden />
            )}
            <span className="sm:hidden">Site access ·</span>
            <span className="font-medium">
              {pending ? "Saving…" : locked ? "Private" : "Public"}
            </span>
          </span>
          <Switch
            id={`gate-${app.id}`}
            checked={locked}
            disabled={pending}
            onCheckedChange={(next) => onToggle(app.id, next)}
            aria-label={`Require login for ${app.label}`}
            className="relative h-6 w-11 after:absolute after:-inset-x-1 after:-inset-y-2.5 after:content-[''] [&_[data-slot=switch-thumb][data-state=checked]]:translate-x-5 [&_[data-slot=switch-thumb]]:size-5"
          />
        </div>
      </header>

      <MobileFleetSnapshot metrics={metrics} />
      <button
        type="button"
        className="mt-3 flex min-h-11 w-full items-center justify-between rounded-lg border border-border bg-background/50 px-3 text-xs font-medium outline-none transition-colors hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-ring sm:hidden"
        aria-expanded={expanded}
        aria-controls={metricsId}
        onClick={() => setExpanded((current) => !current)}
      >
        {expanded ? "Hide metrics" : "View metrics"}
        <ChevronDown
          className={cn(
            "size-4 text-muted-foreground transition-transform",
            expanded ? "rotate-180" : null,
          )}
          aria-hidden
        />
      </button>

      <div
        id={metricsId}
        className={cn(
          "mt-3 min-w-0",
          expanded ? "block" : "hidden",
          "sm:mt-5 sm:block",
        )}
      >
        <GithubPanel result={metrics.github} referenceTime={referenceTime} />
        <div className="mt-3">
          <VercelPanel
            result={metrics.vercel}
            github={metrics.github}
            referenceTime={referenceTime}
          />
        </div>
      </div>
    </article>
  );
}

function FleetSummary({ metrics }: { metrics: FleetMetricsSnapshot }) {
  const values = Object.values(metrics.apps);
  const github = values
    .map((value) => value.github)
    .filter((value) => value.status === "ok");
  const vercel = values
    .map((value) => value.vercel)
    .filter((value) => value.status === "ok");
  const productionReady = vercel.filter(
    (value) => value.data.live?.state === "READY",
  ).length;
  const ciPassing = github.filter(
    (value) => value.data.ci.state === "success",
  ).length;
  const openPullRequests = github.reduce(
    (total, value) => total + value.data.openPullRequests,
    0,
  );
  const activeDeployments = vercel.reduce(
    (total, value) => total + (value.data.recent?.active ?? 0),
    0,
  );
  const githubComplete = github.length === values.length;
  const vercelComplete = vercel.length === values.length;
  const githubEnabled = metrics.configured.github;
  const vercelEnabled =
    metrics.configured.vercelToken && metrics.configured.vercelTeam;

  const cells = [
    {
      label: "Production ready",
      value: vercelEnabled ? `${productionReady}/${values.length}` : "—",
      icon: <Rocket className="size-4" aria-hidden />,
    },
    {
      label: "CI passing",
      value: githubEnabled ? `${ciPassing}/${values.length}` : "—",
      icon: <CheckCircle2 className="size-4" aria-hidden />,
    },
    {
      label: "Open PRs",
      value: githubComplete ? String(openPullRequests) : "—",
      icon: <GitPullRequest className="size-4" aria-hidden />,
    },
    {
      label: "Active builds",
      value: vercelComplete ? String(activeDeployments) : "—",
      icon: <LoaderCircle className="size-4" aria-hidden />,
    },
  ];

  return (
    <dl className="grid grid-cols-2 overflow-hidden rounded-2xl border border-border bg-card sm:grid-cols-4">
      {cells.map((cell, index) => (
        <div
          key={cell.label}
          className={cn(
            "min-w-0 px-3 py-3.5 sm:px-4 sm:py-4",
            index % 2 === 1 ? "border-l border-border" : null,
            index >= 2 ? "border-t border-border sm:border-t-0" : null,
            index > 0 ? "sm:border-l sm:border-border" : null,
          )}
        >
          <dt className="flex min-h-7 min-w-0 items-start gap-1.5 text-[11px] leading-tight text-muted-foreground sm:min-h-0 sm:items-center sm:gap-2 sm:text-xs">
            <span className="hidden shrink-0 sm:inline-flex">{cell.icon}</span>
            <span className="min-w-0">{cell.label}</span>
          </dt>
          <dd className="mt-1.5 font-mono text-xl font-semibold tabular-nums sm:mt-2 sm:text-2xl">
            {cell.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

export function FleetGates({
  apps,
  initialGates,
  metrics,
}: {
  apps: readonly FleetApp[];
  initialGates: Gates;
  metrics: FleetMetricsSnapshot;
}) {
  const router = useRouter();
  const [gates, setGates] = useState(initialGates);
  const [pendingId, setPendingId] = useState<GatedAppId | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const missingProviders = [
    !metrics.configured.github ? "GITHUB_TOKEN" : null,
    !metrics.configured.vercelToken ? "VERCEL_TOKEN" : null,
    !metrics.configured.vercelTeam ? "VERCEL_TEAM_ID" : null,
  ].filter((value): value is string => Boolean(value));

  function onToggle(appId: GatedAppId, locked: boolean) {
    const previousLocked = gates[appId];
    setError(null);
    setGates((current) => ({ ...current, [appId]: locked }));
    setPendingId(appId);

    startTransition(async () => {
      try {
        const next = await updateGateAction(appId, locked);
        setGates(next);
        router.refresh();
      } catch {
        setGates((current) => ({
          ...current,
          [appId]: previousLocked,
        }));
        setError(`Could not update ${appId}. Try again.`);
      } finally {
        setPendingId(null);
      }
    });
  }

  return (
    <div>
      {missingProviders.length ? (
        <div
          className="mb-6 flex items-start gap-3 rounded-xl border border-amber-600/20 bg-amber-500/10 p-4 text-amber-900 dark:text-amber-200"
          role="status"
        >
          <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
          <div>
            <p className="text-sm font-medium">Telemetry setup needed</p>
            <p className="mt-1 text-xs leading-relaxed opacity-80">
              Add{" "}
              {missingProviders.map((provider, index) => (
                <span key={provider}>
                  {index ? " and " : null}
                  <code>{provider}</code>
                </span>
              ))}{" "}
              as server-side environment variables. Privacy switches still work
              normally.
            </p>
          </div>
        </div>
      ) : null}

      <FleetSummary metrics={metrics} />

      {error ? (
        <p
          className="mt-4 rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      <div className="mt-5 grid gap-3 sm:mt-6 sm:gap-4 lg:grid-cols-2">
        {apps.map((app) => (
          <FleetCard
            key={app.id}
            app={app}
            locked={gates[app.id]}
            onToggle={onToggle}
            pending={isPending && pendingId === app.id}
            metrics={metrics.apps[app.id]}
            referenceTime={metrics.fetchedAt}
          />
        ))}
      </div>
    </div>
  );
}
