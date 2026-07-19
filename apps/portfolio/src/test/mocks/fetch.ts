import { vi } from "vitest";

export type MockFetchOptions = {
  status?: number;
  headers?: Record<string, string>;
};

export type MockFetchResponse = {
  body: unknown;
  options?: MockFetchOptions;
};

function buildResponse(body: unknown, options: MockFetchOptions = {}): Response {
  const status = options.status ?? 200;
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
}

/** Install a `global.fetch` stub that resolves once; returns a restore fn. */
export function mockFetchOnce(
  response: unknown,
  options: MockFetchOptions = {},
): () => void {
  const original = global.fetch;
  global.fetch = vi
    .fn()
    .mockResolvedValueOnce(buildResponse(response, options)) as typeof fetch;
  return () => {
    global.fetch = original;
  };
}

/**
 * Install a `global.fetch` stub that resolves the given responses in order;
 * returns a restore fn.
 */
export function mockFetchSequence(
  responses: Array<unknown | MockFetchResponse>,
): () => void {
  const original = global.fetch;
  const mock = vi.fn();
  for (const entry of responses) {
    const { body, options } =
      entry !== null && typeof entry === "object" && "body" in entry
        ? (entry as MockFetchResponse)
        : { body: entry, options: undefined };
    mock.mockResolvedValueOnce(buildResponse(body, options));
  }
  global.fetch = mock as typeof fetch;
  return () => {
    global.fetch = original;
  };
}
