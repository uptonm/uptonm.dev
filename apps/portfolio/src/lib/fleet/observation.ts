/**
 * The single contract every fleet collector returns.
 *
 * A collector never throws to its caller and never reports a missing
 * capability as a healthy zero. Absent permissions, disabled products, and
 * transient failures each map to a distinct `status` so the UI can tell
 * "genuinely nothing" apart from "we could not look".
 */
export type ObservationStatus =
  | "ok"
  | "partial"
  | "stale"
  | "unsupported"
  | "unconfigured"
  | "error";

export type ObservationErrorCode =
  | "not_configured"
  | "unauthorized"
  | "forbidden"
  | "not_found"
  | "rate_limited"
  | "timeout"
  | "unsupported"
  | "unavailable";

export type ObservationError = {
  code: ObservationErrorCode;
  message: string;
};

export type Observation<T> = {
  status: ObservationStatus;
  data: T | null;
  observedAt: string | null;
  staleAt: string | null;
  source: string;
  sourceUrl?: string;
  error?: ObservationError;
};

type ObservationMeta = {
  source: string;
  sourceUrl?: string;
  observedAt?: string;
  staleAt?: string;
};

function base<T>(
  status: ObservationStatus,
  data: T | null,
  meta: ObservationMeta,
  error?: ObservationError,
): Observation<T> {
  return {
    status,
    data,
    error,
    source: meta.source,
    sourceUrl: meta.sourceUrl,
    observedAt: meta.observedAt ?? null,
    staleAt: meta.staleAt ?? null,
  };
}

export function ok<T>(data: T, meta: ObservationMeta): Observation<T> {
  return base("ok", data, meta);
}

/** Data is present but incomplete — some sub-requests failed. */
export function partial<T>(
  data: T,
  error: ObservationError,
  meta: ObservationMeta,
): Observation<T> {
  return base("partial", data, meta, error);
}

/** Last-known-good data served past its freshness window. */
export function stale<T>(data: T, meta: ObservationMeta): Observation<T> {
  return base("stale", data, meta);
}

/** The product or capability is not offered for this app. */
export function unsupported<T>(
  message: string,
  meta: ObservationMeta,
): Observation<T> {
  return base<T>("unsupported", null, meta, { code: "unsupported", message });
}

/** A required credential or setting is missing. */
export function unconfigured<T>(
  message: string,
  meta: ObservationMeta,
): Observation<T> {
  return base<T>("unconfigured", null, meta, {
    code: "not_configured",
    message,
  });
}

export function failed<T>(
  error: ObservationError,
  meta: ObservationMeta,
): Observation<T> {
  return base<T>("error", null, meta, error);
}

/** Whether callers can trust `data` to be non-null and current. */
export function hasFreshData<T>(
  observation: Observation<T>,
): observation is Observation<T> & { data: T } {
  return (
    (observation.status === "ok" || observation.status === "partial") &&
    observation.data !== null
  );
}

/** Whether `data` is usable at all, even if stale or incomplete. */
export function hasData<T>(
  observation: Observation<T>,
): observation is Observation<T> & { data: T } {
  return observation.data !== null;
}

export function isStaleNow<T>(
  observation: Observation<T>,
  now: number,
): boolean {
  if (!observation.staleAt) return false;
  const staleAt = Date.parse(observation.staleAt);
  return Number.isFinite(staleAt) && staleAt <= now;
}
