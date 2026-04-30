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

- Monorepo root scaffolded (Turborepo 2.9.6, pnpm 10.33.2); 4 Cursor skills installed (vercel-react-best-practices, vercel-composition-patterns, vercel-react-view-transitions, vercel-cli-with-tokens); self-reporting files created (.cursor/rules, .agents/summary.md, .agents/SESSION-LOG.md, CHANGELOG.md); both Vite apps scaffolded - apps/react-v19 (React 19, port 5173, createRoot) and apps/react-v16 (React 16, port 5174, ReactDOM.render); postcss.config.js added to both apps to fix PostCSS config search in Vite 8; apps/shell created and verified at localhost:3000; Tailwind CSS 4 enabled across all three apps; GitHub Actions deploy workflow created for Vercel + Telegram notifications on push to `development`; notify job YAML syntax fixed by replacing heredoc with `printf`; deploy jobs updated to install Vercel CLI via `npm install -g vercel`; custom domains finalized for `react19.nxhhuy.tech` and `react16.nxhhuy.tech`

## Pending

- Configure GitHub secrets for Vercel + Telegram and validate workflow; disable Vercel auto-deploy in both projects; branch protection rules
