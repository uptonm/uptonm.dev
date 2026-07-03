import type { NextConfig } from "next";
import path from "node:path";

// Pin the workspace root so Next doesn't infer it from a stray lockfile in a
// parent directory (e.g. a bun.lock above the repo). Silences the
// "detected multiple lock files" warning and fixes workspace module resolution.
const workspaceRoot = path.join(import.meta.dirname, "..", "..");

const nextConfig: NextConfig = {
  outputFileTracingRoot: workspaceRoot,
  // @uptonm/ui ships raw .tsx via its exports map; transpile it here.
  transpilePackages: ["@uptonm/ui"],
  turbopack: {
    root: workspaceRoot,
  },
};

export default nextConfig;
