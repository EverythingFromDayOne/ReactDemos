# ReactDemos Session Summary

- Repo name: `ReactDemos`
- GitHub URL: `https://github.com/EverythingFromDayOne/ReactDemos`
- Working branch: `development`

## Stack

- Turborepo
- pnpm workspaces
- Vite
- React 19 (port `5173`)
- React 16 (port `5174`)
- Tailwind CSS 4

## Integration Approach

- Same page, two React roots
- `ReactDOM.render` for v16
- `createRoot` for v19
- Separate bundles

## Hosting

- Vercel: `react19.nxhhuy.tech`, `react16.nxhhuy.tech`
- Vercel projects: `react-v19` -> `react19.nxhhuy.tech`, `react-v16` -> `react16.nxhhuy.tech`
- DNS: Cloudflare/Namecheap

## Ownership

- Domain registrar: Namecheap
- GitHub username: `huycong2798`

## CI/CD

- GitHub Actions + Vercel CLI + Telegram notifications on push to `development`; PRs targeting `development` run a **`changelog-comment`** job (sticky “What changed” from `CHANGELOG.md`); deploy jobs do not run on PRs.

## Current Status

- Monorepo root scaffolded (Turborepo 2.9.6, pnpm 10.33.2); 4 Cursor skills installed; both Vite apps (`react-v19`, `react-v16`), `apps/shell`, Tailwind 4, and GitHub Actions deploy to Vercel + Telegram on `development`; domains `react19.nxhhuy.tech` / `react16.nxhhuy.tech`. **`apps/react-v19` `/roadmap`**: SVG spine/branch graph, pan/zoom, detail panel, **`RoadmapNode`** border color matches **status** dot, `foreignObject` title/badge layout, tuned box sizes in `roadmap-layout.ts`.

## Latest Session Updates

- Federation local workflow polished: `apps/react-v16` now has `serve:mfe` (runs `dev:mfe` + `preview` together) for one-command remote hosting at `5174`.
- Host dev reload behavior improved: `apps/shell` and `apps/react-v19` Vite configs include a dev-only watcher plugin that monitors `apps/react-v16/dist` and triggers host full reloads when the remote rebuilds.
- Feature Compare tabs now behave as planned placeholders: `state`, `context`, and `suspense` tabs are selectable and render placeholder content instead of being blocked.
- Tab UX in `apps/react-v19` was improved with clearer active styling, hover feedback, pointer cursor, and accessible focus-visible ring.
- Build reliability restored: `react-v16` Vite config now enables watch mode only for explicit `--watch` runs, so root `pnpm run build`/`turbo build` completes instead of hanging on a persistent watcher.
- Type safety/lint strictness tightened around federation and routing types (`NavLink` typed export, `globalThis` cast safety, and `{}` -> `Record<string, never>` updates in v16/v19 federation prop types).
- Validation status: both `pnpm run build` and `pnpm run lint` pass successfully at repo root after these fixes.
- CI deploy hardening: `apps/react-v19/vite.config.ts` now uses a production-safe fallback for the v16 remote (`https://react16.nxhhuy.tech/remoteEntry.js`) when `VITE_V16_REMOTE_URL` is not provided, preventing build-time crashes in GitHub Actions/Vercel.
- Dynamic remote URL cleanup completed per prompt:
  - `react-v19` and `shell` now read `VITE_V16_REMOTE_URL` from app-local env files.
  - `shell` has `.env` and `.env.production` added to mirror `react-v19` env pattern.
  - Hardcoded `localhost:5174` TS/TSX references were removed from host runtime/config code paths.
- MFE prod crash fix completed for `feature-compare`: both `apps/react-v16/vite.config.ts` and `apps/react-v19/vite.config.ts` now set `federation({ shared: {} })` explicitly to disable `@module-federation/vite` auto-sharing and prevent `react-dom@19` from poisoning the v16 remote's runtime `render` binding.
- `prompts/mfe-fix-reactdom-production.md` was rewritten as the canonical guide with the verified plugin root cause (`normalizeShared(undefined)` auto-share behavior), failure sequence, and acceptance checks.

## Pending

- Configure GitHub secrets for Vercel + Telegram and validate workflow; disable Vercel auto-deploy in both projects; branch protection rules; keep `feat/roadmap` in sync or remove after feature work is fully on `development`.
