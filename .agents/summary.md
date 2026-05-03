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

## Pending

- Configure GitHub secrets for Vercel + Telegram and validate workflow; disable Vercel auto-deploy in both projects; branch protection rules; keep `feat/roadmap` in sync or remove after feature work is fully on `development`.
