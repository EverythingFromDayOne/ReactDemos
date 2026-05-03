# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **CI** (`.github/workflows/deploy.yml`): `pull_request` on `development`; **`changelog-comment`** job posts or updates a sticky PR comment from `CHANGELOG.md` `## [Unreleased]` (`peter-evans/find-comment@v3`, `create-or-update-comment@v4`); **`deploy-v19`**, **`deploy-v16`**, and **`notify`** run only on **`push`** to `development`.

- **apps/react-v19 `/roadmap`**: SVG spine-and-branch roadmap (`RoadmapPage`, `RoadmapCanvas`, `RoadmapNode`, `RoadmapDetailPanel`, `roadmap-layout.ts`, `roadmap.types.ts`), `react-router-dom`, `react-router-typed.ts` (React 19 JSX typings), lazy route in `App.tsx`, and `public/assets/react-roadmap.json`. Cursor prompt notes: `cursor-prompt-roadmap-page.md`, `cursor-prompt-roadmap-fixes.md`.

### Fixed

- `apps/react-v19` `/roadmap`: node title **true horizontal center** (`px-12` symmetric; removed asymmetric `pr-[7.5rem]`); badge **`absolute`** `top-2 right-2`; taller nodes (`BRANCH_H` 78, `SPINE_H` 64).
- `apps/react-v19` `/roadmap`: `RoadmapNode` uses **`foreignObject`** + HTML (`flex` center + `absolute` badge) so labels stay centered and badges do not affect text layout; `roadmap-layout.ts` node width/height/radius tuned for the overlay.
- `apps/react-v19` `/roadmap`: when the detail panel is open, the header uses **right padding** (`360px` + gutter) so **Reset view** and the legend stay clear of the overlay.
- `apps/react-v19` `/roadmap`: status legend, detail panel, node badges, and actions use **sentence case** labels (e.g. Done, In-progress, New); removed `uppercase` on detail panel section labels.
- `apps/react-v19` `/roadmap`: initial view and reset/1:1 frame the graph from the **first spine node at the top** of the canvas (top padding) instead of vertically centering the whole tree.
- `apps/react-v19` `/roadmap`: badge pills inset inside nodes with title shifted down; spine arrows use a dynamic vertical stem from measured gap plus fixed chevron; header bar restored (title, subtitle, status legend, reset view) above the SVG area.

### Changed

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