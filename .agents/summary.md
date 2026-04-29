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
- DNS: Cloudflare/Namecheap

## Ownership

- Domain registrar: Namecheap
- GitHub username: `huycong2798`

## CI/CD

- GitHub Actions + Vercel CLI + Telegram notifications on push to `development`

## Current Status

- Monorepo root scaffolded
- Skills installed
- Apps not yet created

## Pending

- Scaffold `apps/react-v19` and `apps/react-v16`
