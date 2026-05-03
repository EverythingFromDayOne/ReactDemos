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

- GitHub Actions + Vercel CLI + Telegram notifications on push to `development`

## Current Status

- Monorepo root scaffolded (Turborepo 2.9.6, pnpm 10.33.2); 4 Cursor skills installed; both Vite apps (`react-v19`, `react-v16`), `apps/shell`, Tailwind 4, and GitHub Actions deploy to Vercel + Telegram on `development`; domains `react19.nxhhuy.tech` / `react16.nxhhuy.tech`. **`apps/react-v19` `/roadmap`** is shipped: SVG spine/branch graph from `public/assets/react-roadmap.json`, pan/zoom, header + legend, detail panel, `react-router-dom` + typed router shim.

## Pending

- Configure GitHub secrets for Vercel + Telegram and validate workflow; disable Vercel auto-deploy in both projects; branch protection rules; merge or delete `feat/roadmap` after `development` is updated if work was merged via PR.
