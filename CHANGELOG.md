# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **CI** (`.github/workflows/deploy.yml`): `pull_request` on `development`; **`changelog-comment`** job posts or updates a sticky PR comment from `CHANGELOG.md` `## [Unreleased]` (`peter-evans/find-comment@v3`, `create-or-update-comment@v4`); **`deploy-v19`**, **`deploy-v16`**, and **`notify`** run only on **`push`** to `development`.

- **apps/react-v19 `/roadmap`**: SVG spine-and-branch roadmap (`RoadmapPage`, `RoadmapCanvas`, `RoadmapNode`, `RoadmapDetailPanel`, `roadmap-layout.ts`, `roadmap.types.ts`), `react-router-dom`, `react-router-typed.ts` (React 19 JSX typings), lazy route in `App.tsx`, and `public/assets/react-roadmap.json`. Cursor prompt notes: `cursor-prompt-roadmap-page.md`, `cursor-prompt-roadmap-fixes.md`.

### Fixed

- MFE production interoperability (`apps/react-v16` + `apps/react-v19`): set `shared: {}` explicitly in both `@module-federation/vite` configs to disable plugin auto-sharing (`normalizeShared(undefined)`), preventing host `react-dom@19` from overriding remote `react-dom@16` and fixing `TypeError: r is not a function` on `react19.nxhhuy.tech/feature-compare`.
- Prompt guide correction: rewrote `prompts/mfe-fix-reactdom-production.md` to document the verified root cause and the correct fix (`shared: {}` in both apps, not removing `shared`).

- `apps/react-v19` production build config: removed hard failure when `VITE_V16_REMOTE_URL` is unset and added mode-aware fallback remote entry URL (`https://react16.nxhhuy.tech/remoteEntry.js` for production, `http://localhost:5174/remoteEntry.js` for local dev), unblocking CI/Vercel builds.
- Monorepo build pipeline: `apps/react-v16/vite.config.ts` no longer enables `build.watch` for normal builds, preventing `turbo build` from hanging; watch config now applies only when running with `--watch`.
- TypeScript/build compatibility fixes across federation host/remote:
  - `apps/react-v19/src/components/AppNav.tsx`: use typed `NavLink` export from `react-router-typed`.
  - `apps/react-v19/src/react-router-typed.ts`: add typed `NavLink` export.
  - `apps/react-v19/src/pages/feature-compare/lifecycle/V16LifecyclePanel.tsx`: cast `globalThis` via `unknown` before indexing runtime key.
  - `apps/react-v16/src/features/lifecycle/LifecycleFeaturePage.tsx`: mark unused `componentDidUpdate` props arg as `_prevProps`.
- `apps/react-v19` feature compare tabs: removed planned-tab interaction guard so `state`, `context`, and `suspense` tabs are selectable and render their placeholder panels instead of being effectively disabled.
- `apps/react-v19` + `apps/shell` dev UX with federated `react-v16`: added a dev-only Vite plugin to watch `apps/react-v16/dist` and trigger host `full-reload` on remote rebuilds, avoiding manual browser refresh while using `vite build --watch` + `vite preview`.
- `apps/react-v19` `/roadmap`: node title **true horizontal center** (`px-12` symmetric; removed asymmetric `pr-[7.5rem]`); badge **`absolute`** `top-2 right-2`; taller nodes (`BRANCH_H` 78, `SPINE_H` 64).
- `apps/react-v19` `/roadmap`: `RoadmapNode` uses **`foreignObject`** + HTML (`flex` center + `absolute` badge) so labels stay centered and badges do not affect text layout; `roadmap-layout.ts` node width/height/radius tuned for the overlay.
- `apps/react-v19` `/roadmap`: when the detail panel is open, the header uses **right padding** (`360px` + gutter) so **Reset view** and the legend stay clear of the overlay.
- `apps/react-v19` `/roadmap`: status legend, detail panel, node badges, and actions use **sentence case** labels (e.g. Done, In-progress, New); removed `uppercase` on detail panel section labels.
- `apps/react-v19` `/roadmap`: initial view and reset/1:1 frame the graph from the **first spine node at the top** of the canvas (top padding) instead of vertically centering the whole tree.
- `apps/react-v19` `/roadmap`: badge pills inset inside nodes with title shifted down; spine arrows use a dynamic vertical stem from measured gap plus fixed chevron; header bar restored (title, subtitle, status legend, reset view) above the SVG area.

### Changed

- MFE remote entry configuration is now environment-driven for both hosts:
  - `apps/react-v19/vite.config.ts` uses `env.VITE_V16_REMOTE_URL` directly (removed hardcoded/mode-switch fallback vars).
  - `apps/shell/vite.config.ts` now loads `VITE_V16_REMOTE_URL` via `loadEnv(mode, ...)` and uses it for federation remote entry.
  - `apps/shell/src/main.ts` error log now references `import.meta.env.VITE_V16_REMOTE_URL`.
  - Added `apps/shell/.env` and `apps/shell/.env.production` with local/prod remote entry URLs.
- Lint cleanup for stricter TS rules: replaced empty object props types (`{}`) with `Record<string, never>` in:
  - `apps/react-v16/src/exposed/LifecycleFeature.ts`
  - `apps/react-v16/src/features/lifecycle/LifecycleFeaturePage.tsx`
  - `apps/react-v19/src/types/federation.d.ts`
- `apps/react-v16` scripts: added `serve:mfe` to run build watch and preview in one command using `concurrently`, simplifying the local federation workflow.
- `apps/react-v19` `TabBar`: improved tab affordance with pointer cursor, stronger hover/active styling, and clearer focus-visible ring for keyboard users.
- **Federation plugin migration (Vite 8 compatibility):**
  - Removed `@originjs/vite-plugin-federation` from `apps/react-v16`, `apps/react-v19`, and `apps/shell`.
  - Added `@module-federation/vite` in all three apps and updated Vite config imports/calls to `federation` from that package.
  - Reason: `@originjs/vite-plugin-federation@1.4.1` generated broken `remoteEntry` runtime behavior on Vite 8 (host-side `forEach` failure during remote init).
  - Updated federation container/module naming to underscore form (`react_v16`, `react_v19`) and aligned host remote imports/types (`react_v16/LifecycleFeature`).
  - Updated remote entry URLs from `/assets/remoteEntry.js` to `/remoteEntry.js` to match current plugin output.

- `apps/react-v19` `/roadmap`: **`RoadmapNode`** rectangle **stroke** uses **status color** (same as the status dot); floating zoom controls stack uses **`duration-150`** on **`RoadmapPage.tsx`**.

- `apps/react-v19` `/roadmap`: replaced the flat grid with an SVG spine-and-branch roadmap (layout from `react-roadmap.json`, pan/zoom, zoom controls, detail panel). Removed `RoadmapGraph.tsx` and `useRoadmapPanZoom.ts`; added `roadmap-layout.ts`, `RoadmapCanvas.tsx`, and `RoadmapNode.tsx`.

### Added

- Monorepo root setup with Turborepo and pnpm workspaces.
- `.cursor/rules` and agent context files.
- 4 Cursor skills installed.

### Added

- Scaffolded `apps/react-v19` (Vite 8, React 19, TypeScript, port 5173, createRoot).
- Scaffolded `apps/react-v16` (Vite 8, React 16, TypeScript, port 5174, ReactDOM.render).
- Added `postcss.config.js` to both apps to resolve Vite 8 PostCSS config search issue.
- Both dev servers verified running in parallel via Turborepo.

### Added

- Added `apps/shell` - a plain Vite + TypeScript iframe shell at port 3000 that displays `apps/react-v16` (port 5174) and `apps/react-v19` (port 5173) side by side; confirmed both React versions rendering correctly (React 16.14.0 and React 19.2.5).

### Added

- Tailwind CSS 4 installed via `@tailwindcss/vite` plugin at root; applied to all three apps (`react-v16`, `react-v19`, `shell`); verified rendering with utility classes in all three iframes.
- Add GitHub Actions deploy workflow with Telegram notifications.
- Fix YAML heredoc syntax error in deploy workflow.
- Use npm to install Vercel CLI globally in deploy workflow jobs.
- Finalize custom domains 
eact19.nxhhuy.tech and 
eact16.nxhhuy.tech for production hosting.