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