import "server-only";

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

let cached: ReturnType<typeof create> | null = null;

function databaseUrl(): string {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) {
    throw new Error("DATABASE_URL is not configured");
  }
  return url;
}

function create() {
  return drizzle(neon(databaseUrl()), { schema });
}

/**
 * Lazily-constructed Drizzle client bound to the fleet Neon database.
 *
 * Construction is deferred so importing this module never requires
 * `DATABASE_URL` at build time — only code paths that actually query do.
 */
export function db() {
  cached ??= create();
  return cached;
}

export function isDatabaseConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL?.trim());
}

export { schema };
