# Cursor Prompt — Roadmap page bug fixes

> **STOP AND ASK** before touching any file not listed below. Do one fix at a time and confirm before moving to the next.

---

## Context

The `/roadmap` page at `apps/react-v19/src/pages/roadmap/` is working but has three visual bugs to fix. Read the current source files before making any changes.

---

## Fix 1 — Badge pill overflows node boundary and strikes through label text

**What's wrong:** Nodes with a `badge` field (`"recommended"`, `"NEW"`, `"optional"`) show the pill outside the node rect. The node label text also appears struck-through.

**What to fix in `RoadmapNode.tsx`:**
- The badge pill must be rendered fully inside the node rect — position it in the top-right corner, inset from the node edges so it never overflows the rect boundary
- The label text `<text>` vertical position must be calculated based on whether a badge is present — when a badge exists, shift the label downward slightly so the badge pill and label text do not overlap
- The struck-through appearance is caused by the badge rect overlapping the text element — fix the z-order (render badge after text, or adjust positions so they don't intersect)

---

## Fix 2 — Arrow chevrons between spine nodes are a fixed size

**What's wrong:** The V-shaped downward arrows drawn between consecutive spine nodes always render the same size regardless of the actual gap between nodes.

**What to fix in `RoadmapCanvas.tsx` (or wherever arrows are rendered):**
- The arrow chevron should be centered vertically in the gap between the bottom of one spine node and the top of the next
- The vertical stroke of the arrow (the stem above the V) should span most of that gap — leaving a small margin at top and bottom
- The V tip and its two diagonal strokes should remain a fixed pixel size (matching the Angular version) — only the stem length is dynamic
- If there is no stem (pure chevron only), just center the V in the gap instead

---

## Fix 3 — Header panel is missing above the SVG canvas

**What's wrong:** The new SVG implementation removed the header bar that existed in the previous version.

**What to add in `RoadmapPage.tsx`:**
- A fixed-height header bar above the SVG canvas (not inside it)
- Left side: page title "React learning path" + subtitle "Drag to pan · Scroll to zoom · click a node for details"
- Right side: "reset view" button that calls the existing reset function
- Below the title row: a legend row with four colored dots + labels — done (teal `#2dd4bf`) / in-progress (amber `#f59e0b`) / planned (slate `#94a3b8`) / skipped (red `#ef4444`)
- The SVG canvas should fill the remaining viewport height below this header — adjust the canvas height calculation so the graph still fills the full remaining space

---

## Files allowed to touch

- `apps/react-v19/src/pages/roadmap/RoadmapNode.tsx`
- `apps/react-v19/src/pages/roadmap/RoadmapCanvas.tsx`
- `apps/react-v19/src/pages/roadmap/RoadmapPage.tsx`

Do NOT modify `roadmap.types.ts`, `roadmap-layout.ts`, `RoadmapDetailPanel.tsx`, `App.tsx`, or any file outside `pages/roadmap/`.

---

## Checklist

- [ ] Badge pill is fully inside the node rect on all badge types (recommended / NEW / optional)
- [ ] Node label text is not struck-through on any node
- [ ] Arrow chevrons scale to fill the gap between each pair of spine nodes
- [ ] Header bar visible above the canvas with title, subtitle, legend, and reset view button
- [ ] SVG canvas still fills full remaining height below the header
- [ ] No TypeScript errors (`pnpm build` passes)
