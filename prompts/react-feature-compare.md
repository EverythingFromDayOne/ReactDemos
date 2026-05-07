# Prompt: react-feature-compare Page

## Prerequisites
This prompt assumes `prompts/mfe-federation-setup.md` has been completed and verified:
- `apps/react-v16` is a working federation remote with `mount()` exposed at `'react-v16/LifecycleFeature'`
- `apps/react-v19` is a configured federation host with TypeScript declarations in place
- `apps/react-v16/src/event-bus.ts` and `apps/react-v19/src/event-bus.ts` exist with identical `EVENTS` constants
- `apps/react-v16/src/features/lifecycle/LifecycleFeaturePage.tsx` is a stub class component

If any of the above is missing, stop and complete the federation setup first.

---

## Role
You are a 10y+ senior React engineer who understands both React 16 (class components, lifecycle methods) and React 19 (hooks, concurrent features). You hold the bar of a principal engineer on every file: correctness, accessibility, strict TypeScript, and resilience to runtime failures. You write code that is correct for the React version you are in — you never mix patterns between versions. You read existing files before editing them. You apply the react-refactor-guard rules from `.agents/skills/react-refactor-guard/SKILL.md` to every file you touch without exception. You proactively identify gaps — you do not wait to be asked.

## Objective
Build a `/feature-compare` page inside `apps/react-v19` that:
- Sits at the route `/feature-compare` alongside the existing `/roadmap` route
- Has a tab bar with four tabs: **Lifecycle** (active, full implementation), **State**, **Context**, **Suspense** (the last three are placeholder tabs)
- The Lifecycle tab shows a two-panel layout:
  - **Left panel** — React 16 LifecycleFeature mounted via federation `mount()` into a container `<div>`, running its own React 16 root
  - **Right panel** — React 19 LifecycleFeature as a native React 19 component rendered inside the host's React 19 tree
  - **Event log** — a shared area at the bottom (or as a sidebar) that receives lifecycle hook events from both panels via `window.CustomEvent` and displays them in chronological order with source labels
- When switching away from the Lifecycle tab, the v16 React root is unmounted (teardown called) and the event log is cleared — preventing the iframe-desync class of bug that affected angular-demos
- The shell (`apps/shell`) dev host is updated to show the feature-compare page in the right pane instead of a blank placeholder

---

## Architecture of the Lifecycle tab

```
FeatureComparePage (react-v19 React tree)
├── TabBar — switches between Lifecycle / State / Context / Suspense
└── LifecycleTab (active)
    ├── LifecycleTabLayout
    │   ├── LeftPanel — contains a <div ref={containerRef} />
    │   │              mount() is called on this div in a useEffect
    │   │              teardown is called on unmount or tab switch
    │   ├── RightPanel — <LifecycleV19Feature /> native React 19 component
    │   └── EventLog — subscribes to window CustomEvents from both panels
    └── (PlaceholderTab for State / Context / Suspense)
```

Communication flow:
- Both `LifecycleV16Feature` (class component, v16 root) and `LifecycleV19Feature` (hook component, v19 root) dispatch `window.CustomEvent` using the `EVENTS` constants when lifecycle hooks fire
- `EventLog` subscribes to these events in a `useEffect` with cleanup — it only listens when mounted
- When the tab switches away from Lifecycle, the v16 root unmounts (event bus messages stop), the v19 component unmounts (hooks stop), and the EventLog is cleared via a `key` prop reset or explicit state clear

---

## Phase 1 — Audit before touching code

1. Read `apps/react-v19/src/App.tsx` — confirm current routes
2. Read the TypeScript declaration at `apps/react-v19/src/types/federation.d.ts` — confirm mount signature
3. Read `apps/react-v19/src/event-bus.ts` — confirm EVENTS constants
4. List all files currently in `apps/react-v19/src/`
5. Read `apps/react-v16/src/features/lifecycle/LifecycleFeaturePage.tsx` — understand the current stub

Present a summary of findings before proceeding.

---

## Phase 2 — Routing update in apps/react-v19

### 2a. Update App.tsx
Update `apps/react-v19/src/App.tsx`:
- Add a lazy import for the new `FeatureComparePage` (to be created in phase 3)
- Add a `/feature-compare` route
- Keep the existing `/roadmap` route
- Change the catch-all `Navigate` to redirect to `/roadmap` (or leave as-is — do not change existing behaviour)
- The `Suspense` fallback and `BrowserRouter` wrapper must remain unchanged

### 2b. Navigation between pages
Create `apps/react-v19/src/components/AppNav.tsx`:
- A minimal top navigation bar with two links: "Roadmap" → `/roadmap`, "Feature Compare" → `/feature-compare`
- Use `NavLink` from `react-router-dom` so the active link is visually distinguished
- Styling: dark background consistent with the existing roadmap header style (dark slate palette, already used in RoadmapPage)
- This component must be rendered above the `<Routes>` in `App.tsx` so it appears on every page

---

## Phase 3 — FeatureComparePage scaffold

Create `apps/react-v19/src/pages/feature-compare/FeatureComparePage.tsx`:
- Default export function component
- Manages a single piece of state: the active tab ID (`'lifecycle' | 'state' | 'context' | 'suspense'`)
- Renders:
  1. A tab bar (component from step 3a)
  2. Conditionally renders the correct tab panel based on active tab
- **Critical**: when switching away from `'lifecycle'`, reset the event log and trigger v16 unmount before the tab changes. The tab switch handler must be synchronous — do not use `useEffect` to detect tab changes.

### 3a. TabBar component
Create `apps/react-v19/src/pages/feature-compare/TabBar.tsx`:
- Props: `activeTab: string`, `onTabChange: (id: string) => void`
- Renders four tab buttons: Lifecycle, State, Context, Suspense
- State tab, Context tab, and Suspense tab render a badge or visual indicator saying "planned"
- Clicking a planned tab does nothing (disabled) — use `aria-disabled="true"` and `tabIndex={-1}` on those buttons

**Accessibility — non-negotiable (a senior ships this correctly on the first pass):**
- The wrapping element must have `role="tablist"` and an `aria-label` describing the tab group (e.g. `"React version feature comparison"`)
- Each tab button must have `role="tab"`
- The active tab must have `aria-selected="true"`; all others `aria-selected="false"`
- Each tab must have `aria-controls="<id>"` pointing to the `id` of its panel, and the panel must have `role="tabpanel"` with `aria-labelledby="<tab-id>"`
- Keyboard navigation: `ArrowRight` and `ArrowLeft` move focus between tabs and activate the focused tab (roving tabIndex pattern — active tab has `tabIndex={0}`, all others have `tabIndex={-1}`)
- Disabled (planned) tabs keep `tabIndex={-1}` and `aria-disabled="true"` — they are reachable by arrow key but do not activate

### 3b. Placeholder tab component
Create `apps/react-v19/src/pages/feature-compare/PlaceholderTab.tsx`:
- Props: `title: string`, `description: string`
- Renders a centered "coming soon" card with the tab title and a one-sentence description of what will be demonstrated
- This component is reused for State, Context, and Suspense tabs
- Placeholder content per tab:
  - State: "React 16 `setState` batching behaviour vs React 19 automatic batching with `startTransition`"
  - Context: "React 16 `contextType` on class components vs React 19 `use(Context)` and context selectors"
  - Suspense: "React 19 `<Suspense>` with `use()` for data fetching — React 16 does not support Suspense for data"

---

## Phase 4 — Lifecycle tab: full implementation

### 4a. LifecycleTab layout
Create `apps/react-v19/src/pages/feature-compare/lifecycle/LifecycleTab.tsx`:
- Receives a prop `onUnmount: () => void` — called when the tab is about to switch away, giving it a chance to clean up
- Manages a piece of state: `eventLog` — an array of log entries (timestamp, source, hook name)
- Renders three sections:
  - Left panel: `<V16LifecyclePanel />` (step 4b)
  - Right panel: `<V19LifecyclePanel />` (step 4c)
  - Event log: `<LifecycleEventLog entries={eventLog} onClear={() => setEventLog([])} />` (step 4d)
- Subscribes to `window.CustomEvent` for both `EVENTS.HOOK_FIRED`, `EVENTS.MOUNTED`, `EVENTS.UNMOUNTED` in a `useEffect` with cleanup
- Appends received events to `eventLog` state — only when the event detail has `source: 'v16'` or `source: 'v19'` and a valid hook name
- When this component unmounts, the `useEffect` cleanup removes the window listener

### 4b. V16LifecyclePanel
Create `apps/react-v19/src/pages/feature-compare/lifecycle/V16LifecyclePanel.tsx`:
- Contains a `containerRef = useRef<HTMLDivElement>(null)`
- Contains a `teardownRef = useRef<(() => void) | null>(null)`
- In a `useEffect` with `[]` deps:
  - Dynamically imports `react-v16/LifecycleFeature`
  - Once resolved: calls `mount(containerRef.current!, {})` and stores the returned teardown in `teardownRef.current`
  - Returns a cleanup: calls `teardownRef.current?.()` to unmount the v16 React root
- Renders a container `<div>` with `ref={containerRef}` that fills the available panel space
- Renders a loading state (e.g. a subtle "Loading React 16…" text) while the dynamic import is pending — use local `useState` for the loading flag
- Renders an error state if the import fails — show a clear message that react-v16 dev server must be running on port 5174

**Error Boundary — non-negotiable:**

`V16LifecyclePanel` must be wrapped in a React Error Boundary at the call site in `LifecycleTab`. A federated remote can fail at runtime for reasons outside the host's control: network failure, version mismatch, the remote dev server not running, a runtime error thrown inside the v16 React tree. Without an Error Boundary, any of these crashes the entire `FeatureComparePage`.

Create `apps/react-v19/src/components/FederationErrorBoundary.tsx`:
- A class component extending `React.Component` with `static getDerivedStateFromError()` and `componentDidCatch()`
- Props: `fallback: ReactNode` (the UI to show when the remote fails), `children: ReactNode`
- The fallback UI must clearly describe what failed and what the user can do (e.g. "React 16 remote failed to load. Is the dev server running on port 5174?")
- This boundary is reusable — wrap every federated mount point with it, not just `V16LifecyclePanel`

In `LifecycleTab.tsx`, wrap `<V16LifecyclePanel />` as:
```
<FederationErrorBoundary fallback={<V16ErrorFallback />}>
  <V16LifecyclePanel ... />
</FederationErrorBoundary>
```

The Error Boundary is a class component even inside the React 19 app — this is correct and intentional. Error Boundaries cannot be function components (hooks do not catch render errors). This is NOT a violation of the react-refactor-guard rules — it is a deliberate use of the one remaining valid class component pattern in React 19.

### 4c. V19LifecyclePanel
Create `apps/react-v19/src/pages/feature-compare/lifecycle/V19LifecyclePanel.tsx`:
- A native React 19 function component — rendered directly inside the React 19 tree (no federation, no mount trick)
- Demonstrates React 19 lifecycle equivalents using hooks:
  - Mount equivalent: `useEffect(() => { /* dispatch MOUNTED event */ return () => { /* dispatch UNMOUNTED event */ }; }, [])`
  - Update equivalent: `useEffect(() => { /* dispatch HOOK_FIRED for 'useEffect[deps]' */ }, [someState])`
  - A button that changes `someState` to trigger the update effect
- Dispatches `window.dispatchEvent(new CustomEvent(EVENTS.HOOK_FIRED, { detail: { source: 'v19', hook: 'useEffect[]', timestamp: Date.now() } }))` from appropriate effects
- Uses `EVENTS` constants from `'../../event-bus'`

### 4d. LifecycleEventLog
Create `apps/react-v19/src/pages/feature-compare/lifecycle/LifecycleEventLog.tsx`:
- Props: `entries: LogEntry[]`, `onClear: () => void`
- Renders a scrollable list of log entries, newest first
- Each entry shows: timestamp (relative, e.g. "+120ms"), source badge (coloured "v16" or "v19"), hook name
- "Clear log" button calls `onClear`
- Auto-scrolls to the newest entry when `entries` changes
- The scroll container must not cause the overall page to scroll — constrain its height

---

## Phase 5 — React 16 LifecycleFeaturePage: full implementation

Now replace the stub created in `mfe-federation-setup` with a real implementation.

Update `apps/react-v16/src/features/lifecycle/LifecycleFeaturePage.tsx`:

**This is a React 16 class component. Apply react-refactor-guard v16 rules strictly:**
- Extends `React.Component` (not PureComponent for the outer page, since it needs to respond to lifecycle events)
- Demonstrates the following lifecycle methods in order: `constructor`, `componentDidMount`, `componentDidUpdate`, `componentWillUnmount`
- In each lifecycle method, dispatches a `window.CustomEvent` using `EVENTS` constants with `detail.source: 'v16'`
- Has a button that triggers a state change (`setState`) to show `componentDidUpdate` firing
- Registers the `window.CustomEvent` listener in `componentDidMount` and removes it in `componentWillUnmount` — BUT react-v16 is the producer, not a consumer of these events. The listener in the react-v16 component (if any) must be wrapped in a type+source guard and must not listen for its own events.
- The event listener (`window.addEventListener`) must be registered inside `this.ngZone.runOutsideAngular`... wait — this is React, not Angular. **Correct approach for v16**: register the listener with `window.addEventListener` wrapped in nothing — React 16 uses synthetic events, `window.addEventListener` is not zone-patched. However, each `setState` call from within the listener will trigger a render. If the listener is only dispatching events (producer, not consumer), no `setState` is needed and this is a non-issue.

**Checklist before finalising this component:**
- [ ] No hooks anywhere — this is a class component
- [ ] `setState` callback form used when new state depends on old state
- [ ] All `window.addEventListener` calls have matching `removeEventListener` in `componentWillUnmount`
- [ ] Handler stored as class property (arrow function on the class), not as inline lambda
- [ ] `componentDidUpdate` has a conditional guard before calling `setState` (no infinite loop)
- [ ] All dispatched CustomEvents include `detail.source: 'v16'` and `detail.timestamp: Date.now()`

---

## Phase 6 — Tab switch safety: preventing the angular-demos desync bug

This is the most important correctness requirement.

In angular-demos, switching away from the lifecycle tab left the host signals (`lifecycleMounted`, `lifecycleCount`) in a stale state because the iframe reloaded but the host didn't reset. This bug MUST NOT appear in react-demos.

Verify the following is true in `FeatureComparePage.tsx`:

```
setTab(newId) {
  if (activeTab === 'lifecycle' && newId !== 'lifecycle') {
    // 1. Clear event log
    // 2. v16 teardown is called by V16LifecyclePanel's useEffect cleanup
    //    when the tab panel unmounts — this happens automatically when
    //    React unmounts LifecycleTab. No manual call needed here.
    //    BUT: verify that LifecycleTab unmounts cleanly when the tab changes.
  }
  setActiveTab(newId);
}
```

The correct model: `LifecycleTab` is conditionally rendered based on `activeTab === 'lifecycle'`. When it unmounts, React calls the `useEffect` cleanup in `V16LifecyclePanel`, which calls the federation teardown. This is automatic and correct.

What IS needed in `setTab`:
- Clear the `eventLog` state in `FeatureComparePage` so the log doesn't persist across tab switches
- Optionally: force the `LifecycleTab` to reset by changing its `key` prop on mount (ensures a clean slate each time the user returns to the Lifecycle tab)

---

## Phase 7 — Shell update for dev experience

Update `apps/shell/src/main.ts` (created in the federation setup prompt):
- The shell's right pane (`#pane-v19`) currently shows a placeholder
- Since react-v19 now has the feature-compare route at `/feature-compare`, the shell can load that page in the right pane using an iframe pointing to `http://localhost:5173/feature-compare`

Wait — this reintroduces an iframe for react-v19. Clarification: **the shell is dev-only infrastructure**. Using an iframe for react-v19 in the dev shell is acceptable and simpler than federating react-v19's entire routing into the shell. The shell's role is to show both apps side by side for local development. Only react-v16 uses federation (to demonstrate MFE).

Update the shell accordingly:
- Left pane: react-v16 LifecycleFeature mounted via federation (as configured)
- Right pane: react-v19 at `/feature-compare` in an iframe `src="http://localhost:5173/feature-compare"`

---

## Phase 8 — Verification

1. Start both app dev servers and the shell
2. Open `http://localhost:5173/feature-compare` directly — confirm the page loads with tab bar
3. Confirm the Lifecycle tab shows two panels side by side
4. Confirm the left panel (v16) loads without error — "Loading React 16…" appears briefly then the component renders
5. Click the button in both panels that triggers `componentDidUpdate` / `useEffect[deps]` — confirm events appear in the event log with correct source labels
6. Switch to the State tab — confirm the event log clears and the v16 React root unmounts (no events continue after switching)
7. Switch back to Lifecycle — confirm a fresh v16 mount occurs (check console for mount log)
8. Open `http://localhost:3000` — confirm the shell shows v16 on the left and v19 feature-compare on the right
9. Check console on all three URLs — no uncaught errors, no extension-heartbeat event misfire

---

## Senior gap review — apply before closing this prompt

After completing all phases, verify these concerns before reporting done. These are the things a 10y+ senior checks without being asked.

### Gap 1 — Error Boundary is actually in place
Confirm `FederationErrorBoundary` wraps `V16LifecyclePanel` at the call site. Open the browser DevTools, manually throw an error inside `LifecycleFeaturePage.tsx` in the v16 app, and verify the fallback UI appears instead of a white screen. Then remove the manual throw.

### Gap 2 — Tab ARIA is correct and keyboard-navigable
Open the feature-compare page. Tab to the tab bar with the keyboard. Confirm:
- Pressing `ArrowRight` moves focus to the next tab and activates it
- Pressing `ArrowLeft` moves to the previous tab
- Pressing `Tab` moves focus out of the tab bar to the tab panel, not to the next tab
- Screen reader (or `aria-` inspection in DevTools) shows `role="tablist"`, `role="tab"`, `aria-selected="true"` on active tab, `aria-controls` pointing to correct panel

### Gap 3 — TypeScript strict mode produces no errors
Run `pnpm --filter react-v19 tsc --noEmit` and `pnpm --filter react-v16 tsc --noEmit`. Both must exit with zero errors. No `// @ts-ignore` or `as any` anywhere in the new files.

### Gap 4 — No event listener leak across tab switches
Switch to Lifecycle tab → switch away → switch back → switch away five times. Open DevTools Memory panel and check that `window` does not accumulate duplicate `react-demos:lifecycle:*` listeners. Each mount adds one listener; each unmount removes it. The count must never grow above 1 (for the currently mounted LifecycleTab).

### Gap 5 — Race condition in V16LifecyclePanel dynamic import
If the component unmounts before the dynamic import resolves (e.g. user switches tab immediately), the `mount()` call will try to mount into an already-unmounted container. Guard this with a `cancelled` flag in the `useEffect`:

The effect body must set `let cancelled = false` at the top. After the dynamic import resolves, check `if (cancelled) return` before calling `mount()`. The cleanup sets `cancelled = true` and also calls `teardownRef.current?.()`.

This is a real race condition that happens in slow networks or fast tab switches. A senior handles it on the first pass.

---

## Hard constraints

- **Read react-refactor-guard SKILL.md** (`.agents/skills/react-refactor-guard/SKILL.md`) before writing any `.ts` or `.tsx` file. Every rule there is mandatory.
- **`LifecycleFeaturePage.tsx` in react-v16 must be a class component.** No hooks. No `useState`. No `useEffect`.
- **`V19LifecyclePanel.tsx` must be a function component with hooks.** No class, no `this`, no `setState`.
- **`FederationErrorBoundary` must be a class component.** Error Boundaries cannot be function components in React — this is the one valid remaining use of class components in the react-v19 app. It is not a violation of the refactor-guard rules.
- **The v16 mount is managed by a `useEffect` in `V16LifecyclePanel`, not in `FeatureComparePage`.** Do not hoist lifecycle concerns to the page level.
- **Every `window.addEventListener` must have a matching `removeEventListener` in its cleanup.** The handler must be a stable reference (stored in a ref or wrapped in `useCallback`).
- **Event dispatches must include `source`, `hook`, and `timestamp`** in the CustomEvent detail. Never dispatch an event with an empty or partial detail — the EventLog consumer expects all three fields.
- **Tab switch must clear the event log synchronously** — not in a `useEffect`. Log clearing is part of the user's intent when switching tabs, not a side effect to be scheduled.
- **`"strict": true` must be present in every `tsconfig.json`.** No implicit `any`. No `as any`. No `// @ts-ignore`.
- **Dynamic import in `V16LifecyclePanel` must guard against the race condition** (cancelled flag). This is not optional.
- **Do not touch `apps/react-v19/src/pages/roadmap/`** — the roadmap page is already complete.
- **One file per edit.** State what changed and why before moving to the next file.
- **If a step produces an error, stop and show the full error.** Do not attempt silent workarounds.
