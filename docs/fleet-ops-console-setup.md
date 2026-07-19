# Fleet ops console — finalization (Wave 5)

Waves 0–4 are built, tested, and committed on `feat/fleet-ops-console` — all
additive, with the live `/admin` untouched. The console routes
(`/admin/overview`, `/admin/apps/[id]`, `/admin/attention`, `/admin/activity`,
`/admin/settings`) already render live GitHub/Vercel telemetry, degrading
honestly where a credential or capability is missing.

The steps below need a human decision or a secret that Vercel deliberately
withholds from the CLI, so they were **not** automated.

## 1. Provision the database schema

The Neon database (`portfolio`) is connected to the project, but `DATABASE_URL`
is a sensitive Vercel variable and cannot be pulled locally. Apply the
generated migration once, from an environment that has the value:

```bash
cd apps/portfolio
# either: put the real connection string in .env.local as DATABASE_URL, then
DATABASE_URL="postgres://…" bun run db:migrate
```

Until this runs, every collector still works — persistence, attention history,
audit, incidents, and rollups are simply skipped (guarded by
`isDatabaseConfigured()`), so the console shows live-but-not-durable data.

## 2. Tighten authentication (currently permissive)

`lib/admin.ts` still treats any signed-in Clerk user as admin, and
`lib/fleet/auth.ts` preserves that default when no role env vars are set. Assign
roles to lock it down:

```bash
vercel env add FLEET_ADMIN_USER_IDS production      # comma-separated Clerk user ids
vercel env add FLEET_OPERATOR_USER_IDS production    # optional
```

## 3. Enable safe actions (default OFF)

Every Vercel-mutating action (redeploy, cancel, rollback) is hard-gated behind
`FLEET_ACTIONS_ENABLED` and does nothing until you opt in. **Before enabling,
confirm the rollback endpoint** in `lib/fleet/actions/executor.ts` against the
live account — Vercel's public rollback surface is inconsistent and that path is
a best-guess. Rollback additionally requires reauth + typed project-name
confirmation.

```bash
vercel env add FLEET_ACTIONS_ENABLED production      # "true" to enable
```

The action UI (confirmation sheets) is intentionally not wired yet — enable the
server layer and validate it before surfacing buttons.

## 4. Swap the overview after a parity check

`/admin` still serves the original fleet-metrics dashboard. The new console home
lives at `/admin/overview`. Once you've eyeballed parity, repoint `/admin` (or
add a link) — kept separate so the swap is a deliberate, reversible step.

## 5. Push per-repo manifests (optional)

Expected-state manifests live centrally in `lib/fleet/manifests.ts`. The plan's
target is a committed `.fleet/manifest.json` in each satellite repo (budget,
facet, home, cairn, map, convert); that requires a small PR per repo and was
left out of this branch to avoid touching six other production repos.

## Verification status

`bun run check-types`, `bun run lint`, `bun run test` (74 passing), and
`bun run build` all pass on this branch. Live provider behavior mirrors the
existing dashboard's request pattern and was not exercised against production
tokens from this environment.
