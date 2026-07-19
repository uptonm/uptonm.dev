import "server-only";

import type { ObservationError } from "../observation";

const DEFAULT_TIMEOUT_MS = 8000;

/** Non-ok HTTP response from a provider, carrying the resolved status. */
export class ProviderRequestError extends Error {
  readonly status: number | null;

  constructor(
    readonly provider: string,
    message: string,
    status: number | null = null,
  ) {
    super(message);
    this.name = "ProviderRequestError";
    this.status = status;
  }
}

/**
 * Map a thrown error to an {@link ObservationError}, mirroring the semantics of
 * the live fleet-metrics client: aborts/timeouts collapse to `timeout`, and the
 * HTTP status drives the rest. A bare 403 is `forbidden`, but the caller has
 * already promoted a rate-limited 403 to 429 (see {@link fetchJson}).
 */
export function classifyError(
  provider: string,
  error: unknown,
): ObservationError {
  if (
    error instanceof DOMException &&
    (error.name === "AbortError" || error.name === "TimeoutError")
  ) {
    return {
      code: "timeout",
      message: `${provider} took too long to respond.`,
    };
  }

  const status = error instanceof ProviderRequestError ? error.status : null;

  if (status === 401) {
    return {
      code: "unauthorized",
      message: `${provider} rejected the configured token.`,
    };
  }
  if (status === 403) {
    return {
      code: "forbidden",
      message: `${provider} denied access to this project.`,
    };
  }
  if (status === 404) {
    return {
      code: "not_found",
      message: `${provider} could not find this project.`,
    };
  }
  if (status === 429) {
    return {
      code: "rate_limited",
      message: `${provider} rate-limited the dashboard. Try again shortly.`,
    };
  }

  return {
    code: "unavailable",
    message: `${provider} metrics are temporarily unavailable.`,
  };
}

export type FetchJsonOptions = {
  token: string;
  provider: string;
  init?: RequestInit;
  timeoutMs?: number;
};

/**
 * Fetch JSON from a provider with bearer auth, standard headers, and a hard
 * timeout. Throws {@link ProviderRequestError} on any non-ok response, promoting
 * a rate-limited 403 (`x-ratelimit-remaining: 0` or a `retry-after` header) to
 * 429 so callers classify it as `rate_limited`.
 */
export async function fetchJson<T>(
  url: string,
  { token, provider, init, timeoutMs }: FetchJsonOptions,
): Promise<T> {
  const response = await fetch(url, {
    ...init,
    cache: "no-store",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "User-Agent": "uptonm.dev-fleet-dashboard",
      ...init?.headers,
    },
    signal: AbortSignal.timeout(timeoutMs ?? DEFAULT_TIMEOUT_MS),
  });

  if (!response.ok) {
    const status =
      response.status === 403 &&
      (response.headers.get("x-ratelimit-remaining") === "0" ||
        response.headers.has("retry-after"))
        ? 429
        : response.status;
    throw new ProviderRequestError(
      provider,
      `${provider} returned HTTP ${response.status}.`,
      status,
    );
  }

  return (await response.json()) as T;
}
