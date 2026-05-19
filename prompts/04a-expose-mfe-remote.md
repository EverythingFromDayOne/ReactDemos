# Phase 4a — Expose react-v19 as MFE Remote

## Context

ReactDemos is a Turbo monorepo. `apps/react-v19` currently acts as an MFE **host** only: it consumes `react-v16` as a remote via `@module-federation/vite`. It has no `exposes`, no `filename`, and no CORS config.

This prompt turns `react-v19` into a **dual-role app**: it continues consuming react-v16, and it now also exposes its own demo components so `nextjs-tech` (the Next.js shell) can load them at runtime.

Run this prompt with Cursor open in the **ReactDemos** root.

## Goal

`apps/react-v19` exposes 2 demo components via MF v2 remoteEntry. In local dev, `http://localhost:5173/remoteEntry.js` is reachable and returns a valid MF module manifest. nextjs-tech (prompt `04b`) will consume this.

**Done when:** `http://localhost:5173/remoteEntry.js` returns a JavaScript module (not HTML), and the exposed components render correctly when imported by a host.

---

## The `shared` config — RESOLVED, do not change

> **Status:** Reverted to `shared: {}` after implementation. See reasoning below.

## The `shared` config — reasoning

`apps/react-v19` currently has `shared: {}`. The comment explains why: `normalizeShared(undefined)` (when shared was omitted) auto-shared react-dom@19 into `__mf_module_cache__.share`, and react-v16 was reading from that slot — which broke its `render` import because React 19 dropped `render`.

This fix is now safe to evolve. `apps/react-v16` also has `shared: {}`, which means it **opts out of all shared resolution entirely** — it bundles its own react@16 and react-dom@16 directly and never reads from the shared scope regardless of what the host configures.

This means `apps/react-v19` can now declare explicit, named sharing:

```ts
shared: {
  react:     { singleton: true, requiredVersion: '^19.0.0' },
  'react-dom': { singleton: true, requiredVersion: '^19.0.0' },
}
```

This is not a workaround — it is the correct approach. Explicit named sharing is safe because:
- react-v16 (`shared: {}`) ignores the shared scope entirely. It will not pick up react@19.
- nextjs-tech, which also declares these as singletons, will negotiate with react-v19 and one React 19 instance will be used for both — preventing the dual-React hooks error.

Update the comment in vite.config.ts to reflect this new reasoning.

---

## Files to create

- `apps/react-v19/src/exposed/UseTransitionDemo.tsx`
- `apps/react-v19/src/exposed/UseActionStateDemo.tsx`

## Files to modify

- `apps/react-v19/vite.config.ts`
- `apps/react-v19/package.json`

---

## Detailed requirements

### `apps/react-v19/vite.config.ts`

Four changes:

**1. Add `filename` and `exposes` to the federation config:**

Set `filename: 'remoteEntry.js'`. Add an `exposes` map:
- `'./UseTransitionDemo'` → `'./src/exposed/UseTransitionDemo.tsx'`
- `'./UseActionStateDemo'` → `'./src/exposed/UseActionStateDemo.tsx'`

**2. Update `shared` from empty object to explicit React singletons:**

Replace `shared: {}` with the explicit form shown in the section above. Update the comment to explain the new reasoning (react-v16 has `shared: {}` and is fully isolated from the shared scope).

**3. Add `serveFederationDistPlugin` function:**

Copy the same plugin pattern already used in `apps/react-v16/vite.config.ts`. It intercepts requests to `/remoteEntry.js`, `/mf-entry-bootstrap-*.js`, and `/assets/*` during the dev server and serves them from `dist/` on disk. This is necessary because Vite's SPA fallback would otherwise return `index.html` for unknown routes, breaking remoteEntry resolution.

Place the function above `defineConfig`. Register it in `plugins` **before** the `federation()` plugin.

**4. Add CORS to the vite server config:**

Set `server.cors: true`. nextjs-tech running on a different port needs CORS to load the remote entry.

The `watchFederatedRemote` plugin already in the config watches react-v16's dist/ — leave it in place unchanged.

### `apps/react-v19/package.json`

Add two scripts:

- `"dev:mfe"` — runs `vite build --watch` to continuously rebuild dist/ (and therefore keep remoteEntry.js current) as source files change. nextjs-tech reads remoteEntry.js from dist/ via the dev server plugin.
- `"serve:mfe"` — runs `dev:mfe` and `vite` in parallel using `concurrently`. This is the single command to start react-v19 as both a running app and a live-rebuilding remote.

Add `concurrently` as a devDependency (same version as in `apps/react-v16` for consistency).

The `dev:mfe` script must include `--watch` and also set `emptyOutDir: false` (same as react-v16's pattern, to prevent dist/ from being wiped on incremental rebuilds). This is configured via the `isWatchBuild` flag in vite.config.ts — check if react-v19's config already has it; if not, add it.

### `apps/react-v19/src/exposed/UseTransitionDemo.tsx`

A self-contained React 19 component that demonstrates `useTransition`. No dependencies on React Router context, no fetch calls to absolute asset paths, no full-page height layout.

Requirements:
- Uses `useTransition` to defer a slow state update (simulate a heavy render with a deliberately slow computation or a list of items)
- Shows a visual pending indicator while the transition is in progress
- Has an interactive trigger (a button or input that starts the transition)
- Styled with Tailwind classes — dark-mode aware (uses `dark:` variants so it looks correct when the `dark` class is on `<html>` in nextjs-tech)
- Exports a named export `UseTransitionDemo` and a default export pointing to the same component

### `apps/react-v19/src/exposed/UseActionStateDemo.tsx`

A self-contained React 19 component demonstrating `useActionState` (the React 19 API for form action state, replacing the experimental `useFormState`).

Requirements:
- A small form with one or two fields and a submit button
- The action is an async function that simulates a server operation (setTimeout-based, no real network call)
- Shows the pending/success/error states clearly in the UI
- Styled with Tailwind classes — dark-mode aware
- Exports a named export `UseActionStateDemo` and a default export

---

## Local dev workflow after this prompt

Two terminals are needed in ReactDemos:

- **Terminal A:** `pnpm --filter react-v16 serve:mfe` — starts react-v16 remote (port 5174)
- **Terminal B:** `pnpm --filter react-v19 serve:mfe` — starts the watch build + react-v19 dev server (port 5173)

nextjs-tech (prompt 04b) runs separately.

Document this workflow in `apps/react-v19/README.md` or in a comment block at the top of the new package.json scripts section.

---

## Senior checks before marking done

- [ ] `http://localhost:5173/remoteEntry.js` returns JavaScript (not HTML) — verify in browser or with `curl -I`
- [ ] `shared` comment updated to explain why explicit React singletons are safe with the current react-v16 `shared: {}` config
- [ ] `serveFederationDistPlugin` intercepts `/remoteEntry.js` in dev — verify the plugin runs by checking server log output on first request
- [ ] Both exposed components have named + default exports
- [ ] Both exposed components use `dark:` Tailwind variants — verify they look correct with the `dark` class on `<html>`
- [ ] `dev:mfe` uses `emptyOutDir: false` equivalent — dist/ is not wiped on incremental rebuilds
- [ ] `concurrently` added to devDependencies
- [ ] Existing react-v16 host relationship still works — run `pnpm --filter react-v19 dev` and verify the FeatureComparePage lifecycle tab loads the v16 remote without errors
