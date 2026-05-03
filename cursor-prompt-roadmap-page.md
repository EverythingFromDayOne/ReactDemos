# Cursor Prompt — `/roadmap` page for `apps/react-v19`

> **STOP AND ASK** before doing anything if a step is ambiguous, you discover something unexpected, or you are about to touch a file not listed in the summary below. Do one step at a time — confirm with me before moving to the next.

---

## Context

We are in the **ReactDemos** Turborepo (`EverythingFromDayOne/ReactDemos`).
Target: **`apps/react-v19/`** — React 19.2.5, Vite 8.0.10, Tailwind CSS 4 via `@tailwindcss/vite`.

The goal is to build a `/roadmap` page that looks and behaves identically to the Angular version at `ng21.nxhhuy.tech/roadmap`. Read the Angular source before starting:

- Layout logic: `apps/angular-demos/src/app/pages/roadmap/roadmap-page.component.ts`
- Template: `apps/angular-demos/src/app/pages/roadmap/roadmap-page.component.html`
- Data: `apps/angular-demos/public/assets/roadmap.json`

The React data file already exists at `apps/react-v19/public/assets/react-roadmap.json` — do NOT recreate it.

**Known current state of `apps/react-v19/`:**
- `react-router-dom` is installed
- `App.tsx` already has `BrowserRouter` + `Routes` with a `/roadmap` route pointing to a `RoadmapPage` component
- That component currently renders a flat HTML grid — the entire implementation needs to be replaced with the SVG-based version described below
- No existing `pages/roadmap/` folder or files beyond what was generated from the previous prompt

---

## What to build

### Visual design — match Angular exactly

- **Full-viewport dark canvas**: `bg-slate-950`, fills the screen below any top nav
- **SVG element** covers 100% width and height of the canvas — all graph rendering happens inside it
- **Pan**: drag on the SVG background moves the entire graph (pointer events, not mouse events — supports touch)
- **Zoom**: scroll wheel zooms toward the cursor position; scale clamped between 0.4 and 2.8
- **Floating zoom controls**: `+`, `1:1`, `-` buttons stacked vertically, bottom-right corner, shift left when detail panel is open
- **No legend bar** — the Angular version has none; status is communicated purely by node border/dot color

---

### Layout engine — spine + branches

The layout is computed from the JSON data and rendered as SVG elements. Key dimensions to match:

- **Spine nodes** run vertically down the center (x = 0). They are wider and taller than branch nodes, with a larger corner radius.
- **Branch nodes** fan out horizontally from each spine node. Multiple children are spaced evenly left and right of center.
- **Connecting lines**: a vertical line drops from each spine node to a horizontal bar; vertical drops from the bar lead to each branch node. Branches with their own children have further vertical lines + drops.
- **Arrows**: between consecutive spine nodes, a downward arrow (two diagonal strokes forming a chevron) indicates progression.
- Study the Angular layout algorithm in `roadmap-page.component.ts` (`layout` computed property) and replicate the same spacing constants, width calculation, and recursive `createBranchColumn` logic in React.

---

### Node rendering

Two node kinds — **spine** and **branch** — both rendered as SVG `<rect>` + `<text>` + a status dot `<circle>`:

- The status dot sits on the left edge of each node
- Node border color and dot fill color are driven by status:
  - `done` → `#2dd4bf` (teal)
  - `in-progress` → `#f59e0b` (amber)
  - `planned` → `#94a3b8` (slate)
  - `skipped` → `#ef4444` (red)
- Node fill: dark slate (`fill-slate-900/95` for branch, `fill-slate-800/95` for spine)
- Node text: light slate, centered, `font-medium`
- Optional `badge` field (values: `"NEW"`, `"optional"`, `"recommended"`) renders as a small pill in the top-right corner of the node
- **Selected node**: three layered rings — an outer pulsing ring (animated), a solid inner ring, and a thin white hairline — all using the node's status color

---

### Detail panel

- Fixed 360px panel anchored to the right edge of the viewport, full height, `z-index` above the SVG
- Dark background (`bg-slate-900/95`), left border (`border-slate-700`)
- Panel opens when a node is clicked; clicking the same node again or the close button (`X`) closes it
- Panel contents:
  1. Muted label "Roadmap node" above the node title
  2. Node title (`text-xl font-semibold text-white`)
  3. Status badge — rounded pill with matching border/background/text for the status, contains a colored dot + status label
  4. Optional badge pill (NEW / optional / recommended) with its own distinct color
  5. Description text
  6. "Children" section — lists the immediate branch children of the selected node by title; shows "No branch children." if none
  7. "Open demo →" button (fuchsia-tinted) — only visible if the node has a `route` field; navigates using React Router

---

### Data structure

The JSON shape (already in `react-roadmap.json`):

```
{
  spine: Array of spine nodes, each with:
    id, title, status, description,
    badge? ("NEW" | "optional" | "recommended"),
    route? (string),
    children? (recursive — same shape, rendered as branch nodes)
}
```

This is identical to the Angular data shape — the layout algorithm can be ported directly.

---

### File structure

Create all files under `apps/react-v19/src/pages/roadmap/`:

```
roadmap/
├── roadmap.types.ts          — TypeScript types matching the JSON shape above
├── roadmap-layout.ts         — Pure layout computation (port of the Angular `layout` computed)
├── RoadmapPage.tsx           — Page shell: fetches JSON, owns selectedNodeId state, composes the SVG canvas and detail panel
├── RoadmapCanvas.tsx         — The SVG element with pan/zoom pointer events, renders lines/arrows/nodes from layout output
├── RoadmapNode.tsx           — Single SVG node (rect + text + dot + badge + selection rings)
└── RoadmapDetailPanel.tsx    — The 360px right panel
```

The pan/zoom state (panX, panY, zoom) lives in `RoadmapPage` and is passed as a `<g transform="...">` on the SVG canvas — same approach as the Angular version.

---

### Route

The `/roadmap` route already exists in `App.tsx`. Replace the current `RoadmapPage` import target with the new component at `./pages/roadmap/RoadmapPage`.

---

## Checklist before committing

- [ ] `http://localhost:5173/roadmap` loads without console errors
- [ ] Spine nodes visible down the center, branch nodes fanning out with connecting lines and arrows
- [ ] Drag to pan and Scroll to zoom work correctly; zoom is toward cursor
- [ ] `+`, `1:1`, `-` buttons visible bottom-right and functional
- [ ] Clicking a node opens the detail panel; clicking again or `X` closes it
- [ ] Detail panel shifts zoom buttons left when open
- [ ] Status colors match Angular exactly (teal / amber / slate / red)
- [ ] Selected node shows pulsing outer ring + solid highlight ring
- [ ] Nodes with a `route` show "Open demo →" in the panel and navigate on click
- [ ] Nodes with a `badge` show the correct pill in the top-right corner
- [ ] No TypeScript errors (`pnpm build` passes)

---

## What NOT to do

- Do NOT install any graph or SVG library (no react-flow, no d3, no dagre)
- Do NOT use HTML divs for the graph — SVG only
- Do NOT keep any code from the previous flat-grid implementation
- Do NOT touch `apps/react-v16/` or any monorepo root files
- Do NOT create a separate CSS file — Tailwind classes + inline SVG attributes only
- Use the `/commit` skill after everything is confirmed working
