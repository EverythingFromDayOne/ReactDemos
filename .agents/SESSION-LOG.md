# Session Log

## 2026-04-29

- Repo created.
- `development` branch set as default.
- Turborepo + pnpm workspace root initialized.
- 4 Cursor skills installed:
  - `vercel-react-best-practices`
  - `vercel-composition-patterns`
  - `vercel-react-view-transitions`
  - `vercel-cli-with-tokens`
- Self-reporting files created.

### Next

- Scaffold the two Vite + React apps: `apps/react-v19` and `apps/react-v16`.

## 2026-04-30

- Added `.github/workflows/deploy.yml` to deploy `react-v19` and `react-v16` to Vercel production on pushes to `development`.
- Added Telegram notification step for deploy success/failure with commit and run details.
- Updated `CHANGELOG.md` and `.agents/summary.md` to reflect CI/CD workflow setup and deployment status.
- Fixed deploy workflow YAML parsing issue in notify job by replacing heredoc message construction with `printf`.

### Next

- Add required GitHub secrets (`VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID_V19`, `VERCEL_PROJECT_ID_V16`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`) and run a validation push to `development`.

### Blockers

- Vercel and Telegram secrets are not configured in GitHub yet.

- Finalized custom production domains `react19.nxhhuy.tech` and `react16.nxhhuy.tech`; next: complete secrets setup and run workflow validation; blockers: GitHub/Vercel integration secrets still pending.

## 2026-05-04

- Rebuilt `apps/react-v19` roadmap page to match the SVG spine/branch spec: `roadmap.types.ts` (spine JSON shape), `roadmap-layout.ts`, `RoadmapPage.tsx` (pan/zoom state, centering, floating +/1:1/− controls), `RoadmapCanvas.tsx` (lines, chevrons, wheel zoom to cursor), `RoadmapNode.tsx` (status colors, badges, selection rings), `RoadmapDetailPanel.tsx` (360px overlay). Removed `RoadmapGraph.tsx` and `useRoadmapPanZoom.ts`. Angular `roadmap-page.component` sources were not in this repo; layout constants follow the written prompt.

### Next

- Manually verify `/roadmap` in the browser (pan, zoom, panel, `Open demo →` for `use-ref`).

### Blockers

- None for this change.

## 2026-05-04 (roadmap fixes)

- Roadmap UI fixes in `apps/react-v19`: `RoadmapNode.tsx` (badge inset, title offset, draw order), `RoadmapCanvas.tsx` (spine arrows from gap geometry + stem + chevron), `RoadmapPage.tsx` (header with legend and `reset view`).
- `RoadmapPage.tsx`: initial pan and `resetView` / 1:1 align the **first spine** to the top of the SVG area (horizontal center unchanged).
- Roadmap copy: sentence-case status legend, **Reset view**, badges (New / Optional / Recommended), detail panel status pills; dropped `uppercase` on “Roadmap node” / “Children”.
- Roadmap header: `pr-[calc(360px+1.5rem)]` when detail panel open so **Reset view** / legend are not covered.

### Next

- Spot-check badge nodes and tall spine gaps in the browser.

## 2026-05-04 (feat: update css)

- **`feat: update css`**: `RoadmapNode.tsx` — node **SVG stroke** matches **status** color (same as dot); **`foreignObject`** + Tailwind for centered title and corner badge; `roadmap-layout.ts` — larger spine/branch boxes and radii; `RoadmapPage.tsx` — `duration-150` on zoom control stack.
- **`.github/workflows/deploy.yml`**: `pull_request` on `development`; **`changelog-comment`** job; **`deploy-v19`**, **`deploy-v16`**, **`notify`** gated to **`push`** only.

### Next

- Open a **pull request** from `feat/roadmap` into `development` (direct push to `development` is blocked by repo rules); after merge, confirm deploy and the **`changelog-comment`** job; spot-check `/roadmap` node borders per status.

### Blockers

- None noted for this commit.

## 2026-05-05

- Committed **`feat: build roadmap page`** on branch `feat/roadmap`: react-v19 SVG `/roadmap`, JSON data, router + typed shim, changelog/session/summary updates, prompt markdown files.

### Next

- Push / merge to `development` and verify CI or Vercel deploy; continue browser QA on `/roadmap`.

### Blockers

- None noted for this commit.

## 2026-05-07

- MFE federation setup note: `react-v16` `remoteEntry.js` is a build artifact; it is served by `vite preview`, not `vite dev`.
- Added `react-v16` scripts for two-terminal MFE workflow:
  - `dev:mfe` = `vite build --watch` (keeps `dist` fresh)
  - `preview` = `vite preview --port 5174` (serves `dist/assets/remoteEntry.js`)
- Added `preview.port: 5174` in `apps/react-v16/vite.config.ts` so all remote URLs stay consistent.
- Workflow split clarified:
  - Standalone v16 app dev: `pnpm --filter react-v16 dev`
  - MFE host consumption: run `dev:mfe` + `preview` in parallel, then start `shell` or `react-v19`.
- Replaced federation plugin in all three apps: removed `@originjs/vite-plugin-federation`, installed `@module-federation/vite`.
- Reason for plugin switch: `@originjs/vite-plugin-federation@1.4.1` produced broken `remoteEntry.js` behavior under Vite 8 (runtime `forEach` failure in host load path).
- Updated federation naming/imports to Module Federation 2 style (`react_v16` / `react_v19`) and updated host import module IDs accordingly.
- Updated remote entry URL usage to `remoteEntry.js` path emitted by `@module-federation/vite` and disabled federation DTS generation (`dts: false`) to avoid TS 6 peer-compat warnings blocking clean output.

## 2026-05-07 (federation DX + feature compare tab UX)

- Added `apps/react-v16` script `serve:mfe` to run remote build-watch + preview together with `concurrently`, reducing local setup friction.
- Documented and implemented dev-only host auto-reload for federated remote updates:
  - `apps/shell/vite.config.ts`: added `watchFederatedRemote(...)` plugin.
  - `apps/react-v19/vite.config.ts`: added `watchFederatedRemote(...)` plugin.
  - Behavior: when `apps/react-v16/dist` changes, hosts broadcast HMR `full-reload` so browser refresh is automatic.
- Fixed Feature Compare tab accessibility/behavior:
  - Removed planned-tab click/keyboard blocking in `apps/react-v19/src/pages/feature-compare/TabBar.tsx`.
  - `state`, `context`, and `suspense` tabs now open placeholder panels as intended.
- Improved tab UI affordance in `TabBar.tsx`:
  - pointer cursor on hover
  - stronger active highlight
  - clearer hover styles
  - focus-visible ring for keyboard navigation

### Next

- Validate end-to-end dev loop once more (`react-v16 serve:mfe` + `shell dev` + `react-v19 dev`) and confirm auto-reload on v16 text edits from both host UIs.

### Blockers

- None currently.

## 2026-05-08 (build and lint stabilization)

- Ran root `pnpm run build` (`turbo build`) and fixed blocking errors:
  - `apps/react-v16/src/features/lifecycle/LifecycleFeaturePage.tsx`: renamed unused `prevProps` to `_prevProps`.
  - `apps/react-v19/src/pages/feature-compare/lifecycle/V16LifecyclePanel.tsx`: safe `globalThis` cast (`unknown` first) for runtime key lookup.
  - `apps/react-v19/src/react-router-typed.ts`: added typed `NavLink` re-export.
  - `apps/react-v19/src/components/AppNav.tsx`: switched to typed `NavLink` import.
  - `apps/react-v16/vite.config.ts`: made `build.watch` conditional on `--watch` to stop production builds from hanging.
- Ran root `pnpm run lint` and fixed strict typing rule violations:
  - Replaced empty object prop types (`{}`) with `Record<string, never>` in:
    - `apps/react-v16/src/exposed/LifecycleFeature.ts`
    - `apps/react-v16/src/features/lifecycle/LifecycleFeaturePage.tsx`
    - `apps/react-v19/src/types/federation.d.ts`
- Final validation:
  - `pnpm run build` passes.
  - `pnpm run lint` passes.

### Next

- Continue feature compare work with stable CI-safe build/lint baseline.

### Blockers

- None.

## 2026-05-08 (react-v19 production build fallback fix)

- Investigated CI/Vercel production build failure in `apps/react-v19`:
  - Error: `VITE_V16_REMOTE_URL is required for production builds`
- Updated `apps/react-v19/vite.config.ts`:
  - Added mode-aware fallback remote URL selection
  - Production fallback: `https://react16.nxhhuy.tech/remoteEntry.js`
  - Development fallback: `http://localhost:5174/remoteEntry.js`
  - Removed hard throw that aborted production build when env var was missing
- Validation:
  - `pnpm --filter react-v19 build` passes after the change.

### Next

- Re-run GitHub Actions deploy workflow to confirm Vercel prebuild step passes in CI with current secrets/environment.

### Blockers

- None.