# uptonm.dev portfolio

The portfolio is a Next.js app. Its private `/admin` route also acts as the
control plane for the six sites in the personal fleet.

## Fleet telemetry

The admin dashboard reads repository and deployment health directly from
GitHub and Vercel. Results are normalized per app, cached for two minutes, and
can be refreshed on demand. A provider failure never disables the Clerk
privacy switches.

Configure these server-only environment variables:

```bash
GITHUB_TOKEN=
VERCEL_TOKEN=
VERCEL_TEAM_ID=team_PksHIceAWlx1p1NMDH6vlHJg
```

- The team-level shared variable names `github_pat` and `vercel_pat` are also
  supported as secure fallbacks for `GITHUB_TOKEN` and `VERCEL_TOKEN`.
- `GITHUB_TOKEN` is required for the GitHub GraphQL API. For the current public
  repositories, a fine-grained read-only token is sufficient. If a repository
  becomes private, grant that repository read access to metadata, contents,
  pull requests, checks/statuses, actions, and issues.
- `VERCEL_TOKEN` is a read-only account or team access token.
- `VERCEL_TEAM_ID` is required because the fleet projects are team-owned. It
  scopes every Vercel API request to the intended team.

Never prefix these names with `NEXT_PUBLIC_`; they must remain server-side.
The dashboard only sends normalized metrics to the authenticated admin page.

The app registry and its GitHub/Vercel identifiers live in
`src/lib/gates.ts`. Provider fetching, timeouts, error handling, and caching
live in `src/lib/fleet-metrics.ts`.
