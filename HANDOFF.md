# uptonm.dev — Redesign & Modernization Handoff

**Branch:** `redesign/warm-editorial`
**Date:** July 2, 2026
**Status:** Phase 1 (dependency upgrade) code-complete, **not yet verified** via install/build. Phases 2–3 not started.

This document is the single source of truth for the in-flight redesign of `uptonm.dev`. It covers the chosen design direction, exactly what changed in the dependency upgrade, how to build it, why it must be built locally, and the remaining work.

---

## 1. TL;DR / Where things stand

The portfolio is getting two things at once:

1. **A dependency modernization** — every package bumped to its latest major (headlined by **Next.js 15 → 16**), to get the toolchain current and the dev server building again.
2. **A new design system** — "**Warm Editorial**," a single system with a **light** theme (warm paper + clay accent) and a **dark** theme (warm noir + brass accent), sharing typography (Fraunces + Inter), layout, and components.

**Done:** Phase 1 edits (all `package.json` files + Next 16 migration) are committed to code on the branch.
**Blocked on you:** running `pnpm install && pnpm dev` on your Mac to confirm the build is green (see §5 for why it can't be run in the Cowork sandbox).
**Next:** Phase 2 applies the design system to the actual app; Phase 3 refreshes the copy.

---

## 2. Design direction: "Warm Editorial"

Chosen after exploring 8 directions (all preserved in `docs/design/prototypes/`). Ranking feedback favored the editorial/refined directions; the final pick combines the **light mode of prototype 01** with the **dark mode of prototype 05** into one system — see **`docs/design/prototypes/09-warm-editorial-system.html`** (the reference implementation, with a working theme toggle).

### Typography
- **Display:** Fraunces (serif), light/normal weights, optical sizing on.
- **Body / UI:** Inter.

### Design tokens
These map 1:1 onto CSS variables and are ready to drop into `packages/ui/src/styles/default.css` (see Phase 2).

| Token | Light (clay) | Dark (brass) | Role |
|---|---|---|---|
| `--bg` | `#faf6f0` | `#141110` | Page background |
| `--bg-alt` | `#f4ece1` | `#1c1815` | Alternating sections |
| `--card` | `#fffdf9` | `#1c1815` | Raised surfaces |
| `--ink` | `#2b2621` | `#ece5da` | Primary text |
| `--muted` | `#6f665c` | `#9a8f80` | Secondary text |
| `--line` | `#e8dccb` | `#332c26` | Borders / hairlines |
| `--accent` | `#c05f3f` | `#cba24a` | Accent |
| `--accent-hover` | `#a94f31` | `#e0c079` | Accent (hover) |
| `--accent-soft` | `#f0d9cd` | `#2a2318` | Accent tint (chips, icons) |
| `--on-accent` | `#faf6f0` | `#141110` | Text on accent |

Dark-only ambience: subtle film-grain overlay + a `grayscale(0.2)` filter on the portrait. Both themes share a warm radial glow behind the hero.

---

## 3. Phase 1 — Dependency upgrade (code-complete)

**Policy applied:** absolute latest major of every package. Versions were pulled live from the npm registry on 2026-07-02.

### Files changed (5)
```
package.json
apps/portfolio/package.json
apps/portfolio/src/app/layout.tsx
packages/ui/package.json
packages/eslint-config/package.json
```

### Key version bumps

| Package | From | To | Notes |
|---|---|---|---|
| next | ^15.2.4 | **^16.2.6** | Major. See §4. |
| react / react-dom | ^19.0.0 | ^19.2.0 | Minor. |
| typescript | 5.7.3 | **^6.0.3** | Major. |
| eslint | ^9 | **^10.4.1** | Major (all `@uptonm/eslint-config` deps bumped to match). |
| @vercel/analytics | ^1.5.0 | **^2.0.1** | Major. Import path updated. |
| @vercel/speed-insights | ^1.2.0 | **^2.0.0** | Major. Already imported from `/next`. |
| uuid | ^11.1.0 | ^14.0.0 | Major. **Slated for removal in Phase 2.** |
| lucide-react | ^0.476.0 | ^1.16.0 | Major. Currently unused; adopted in Phase 2. |
| tailwindcss / @tailwindcss/postcss | ^4 | ^4.3.x | Minor — no v4 refactor needed. |
| turbo | ^2.5.2 | ^2.9.16 | Minor. |
| eslint-plugin-react-hooks | ^5.1.0 | ^7.1.1 | Major. May affect `pnpm lint` (see §4). |
| globals | ^15.15.0 | ^17.6.0 | Major. |
| @types/node | ^20–^22 | ^26.1.0 | You run Node 22; types are a harmless superset. Pin to `^22` if you prefer exact alignment. |
| packageManager | pnpm@9.15.5 | pnpm@11.5.0 | Major. |

> **Note on Tailwind:** the original assumption was that Tailwind would be the refactor. It isn't — the repo is already on v4 and only needed a patch/minor bump. The real migration is Next.js 16.

---

## 4. Next.js 16 migration notes

- **`next lint` is removed in Next 16.** The portfolio `lint` script was changed from `next lint --max-warnings 0` to **`eslint . --max-warnings 0`** (flat config is auto-discovered from `eslint.config.mjs`).
- **ESLint no longer runs during `next build`/`next dev` in Next 16.** This means the ESLint 10 / react-hooks 7 majors **cannot block the dev server or build** — they only affect the standalone `pnpm lint`.
- **`@vercel/analytics` v2 import** in `apps/portfolio/src/app/layout.tsx` changed from `@vercel/analytics/react` → `@vercel/analytics/next` (Next-optimized; both subpaths still exist in v2).
- **`next.config.ts`** is empty — nothing to migrate. **Turbopack is the default bundler** in Next 16; `next dev --turbopack` is retained (redundant but accepted).

### Watch-list (paste back if seen)
- **Peer warnings on install** — expected. `typescript-eslint@8` officially supports TypeScript < 6, so a peer warning about TS 6 is normal; install still completes.
- **`pnpm lint`** — most likely follow-up. `eslint-plugin-react-hooks@7` changed its flat-config export shape; `packages/eslint-config/next.js` accesses `pluginReactHooks.configs.recommended.rules`, which may need updating to the v7 API.
- **`next dev` rejecting `--turbopack`** — if so, drop the flag from `apps/portfolio/package.json`.
- Any **`Module not found`** or type error on `pnpm build` — capture verbatim.

---

## 5. How to build it — and why it must run on your Mac

**Run on your Mac, from the repo root:**
```bash
git checkout redesign/warm-editorial          # if not already on it
corepack enable                                # picks up pnpm@11.5.0 from packageManager
rm -rf node_modules apps/*/node_modules packages/*/node_modules pnpm-lock.yaml
pnpm install
pnpm dev                                       # → http://localhost:3000
```
To revert to a known-good state: `git checkout master && pnpm install`.

**Why not in the Cowork sandbox?** The assistant can run shell commands in the mounted repo (git, grep, edits), but *not* the JS build toolchain, for two demonstrated reasons:
1. **Shell network egress is blocked** — the sandbox proxy returns HTTP 403 for package traffic, so `npm`/`pnpm`/`corepack` cannot download anything. (The assistant's web-fetch tool is separately allowlisted, which is how latest versions were retrieved.)
2. **Wrong-platform binaries** — the sandbox is Linux/aarch64; the cached native binaries are macOS (`@next/swc-darwin-arm64`, `@tailwindcss/oxide-darwin-arm64`, `sharp-darwin`) and won't execute there.

Installing in the sandbox would also overwrite your Mac's `node_modules` binaries in the mounted folder, so it's intentionally avoided.

---

## 6. Phase 2 — Apply the design system (TODO)

Do this after the Phase 1 build is confirmed green, so dependency issues stay isolated from redesign issues.

- [ ] **Tokens:** replace the color block in `packages/ui/src/styles/default.css` with the Warm Editorial light/dark tokens from §2 (`:root` + `.dark`). Keep the `@theme inline` mappings so Tailwind utilities (`bg-card`, `text-muted`, `border-line`, `text-accent`, …) resolve to the variables.
- [ ] **Fonts:** the app already loads Poppins/Noto Sans via `next/font`. Swap to **Fraunces** (display) + **Inter** (body); update `--font-heading`/`--font-body` in `apps/portfolio/src/styles/globals.css`.
- [ ] **Components (`packages/ui`):** refactor `Card` (and add the new primitives) to use semantic tokens instead of hardcoded `gray-*` and add rounded corners + proper elevation.
- [ ] **Page (`apps/portfolio/src/app/page.tsx` + components):** rebuild to the reference layout — real nav, hero with portrait, "currently" strip, About + stats, Work timeline, **Projects section (new)**, Skills, Education, Contact, footer. Use `docs/design/prototypes/09-warm-editorial-system.html` as the spec.
- [ ] **Theme toggle:** wire the sun/moon toggle into the existing `ThemeProvider`. Fix its FOUC (set the theme class before paint via an inline `<script>` in `layout.tsx`) and reconcile the localStorage key.
- [ ] **Icons:** remove the FontAwesome Pro CDN `<link>` in `layout.tsx` (licensing + perf risk) and use **`lucide-react`** (already a dependency).
- [ ] **Projects data:** three placeholder projects were inferred from the resume (Fiber Pathfinding Engine, Telecom OSS/BSS Platform, uptonm.dev). Replace with real repos/links.

---

## 7. Phase 3 — Prose refresh (TODO, collaborative)

The site copy is ~1 year out of date and needs your input for present-day facts (current role/title, employment dates and "Present" ranges, bio, any new work). To be done together after Phase 2. Do not fabricate — confirm each fact.

---

## 8. Pre-existing bugs to fix during the redesign

Found during the audit of the current site; address as part of Phase 2:

- **`key={v4()}` generated during render** (`page.tsx`, `WorkExperience.tsx`) — breaks React reconciliation; use stable keys and remove `uuid`.
- **Two nested `<main>` elements** — invalid HTML; keep a single `<main>`.
- **Skills rendered as dead `<a href="#">` links** — remove or point somewhere real.
- **Theme toggle `onClick` on an `<i>`** — not keyboard-accessible; use a real `<button>`.
- **FontAwesome Pro via CDN** — will fail without a license; replace with `lucide-react`.
- **Hardcoded `gray-*` everywhere** ignoring the existing token system — replace with semantic tokens.
- **Low contrast** — headings, body, and metadata are all near-identical grays.
- **`ThemeProvider` FOUC** — theme is applied in `useEffect` (after paint).

---

## 9. Repo map

```
apps/portfolio/            Next.js app (App Router)
  src/app/                 layout.tsx, page.tsx, styles/globals.css
  src/components/          About, Header, Skills, WorkExperience, Education
packages/ui/               @uptonm/ui shared design system
  src/styles/default.css   ← design tokens live here (Phase 2 target)
  src/components/           base/card, base/button, utils/theme-*
packages/eslint-config/    shared flat ESLint config
packages/typescript-config/ shared tsconfig presets
docs/design/prototypes/    all 8 explorations + 09 = the chosen system
HANDOFF.md                 this file
```

### Prototype index (`docs/design/prototypes/`)
| File | Direction |
|---|---|
| 01-warm-editorial.html | Warm editorial, light (chosen light mode) |
| 02-modern-minimal.html | Swiss / grid |
| 03-bold-technical.html | Dark terminal |
| 04-vibrant-playful.html | Gradient / playful |
| 05-editorial-noir.html | Warm editorial, dark (chosen dark mode) |
| 06-refined-brutalism.html | Refined brutalism |
| 07-literary-magazine.html | Literary / print |
| 08-soft-minimal.html | Soft product-grade minimal |
| **09-warm-editorial-system.html** | **Final: light + dark unified, with theme toggle** |

---

## 10. Immediate next action

1. Run the commands in §5 on your Mac.
2. Confirm `pnpm dev` serves the site at `http://localhost:3000`.
3. Report any errors from the §4 watch-list.
4. On green, start Phase 2 (§6).
