# Tech Debt — MFE Federation Workarounds

**Created:** 2026-05-07
**Branch at creation:** `feat/feature-compare`
**Priority:** Medium — none of these break production today, all three will break silently on a package update

---

## Context

Three workarounds were introduced to unblock the react-v16 ↔ react-v19 federation. They work correctly as of `@module-federation/vite@1.15.2`. Two of them will silently break on any version bump that changes internal plugin behaviour. One imposes a developer-experience degradation that accumulates confusion over time.

Each item below has a **break condition**, a **target fix**, and an **acceptance test**.

---

## TD-01 — `loadRemoteViaRuntime` uses a globalThis internal key

**File:** `apps/react-v19/src/pages/feature-compare/lifecycle/V16LifecyclePanel.tsx`

**Current code:**

```ts
const RUNTIME_INIT_KEY_SUFFIX = '__mf_v__runtimeInit__mf_v__.js__'
const RUNTIME_INIT_KEY_PREFIX = '__mf_init____mf__virtual/'

function findRuntimeInitKey(): string | null {
  for (const key of Object.keys(globalThis as Record<string, unknown>)) {
    if (key.startsWith(RUNTIME_INIT_KEY_PREFIX) && key.endsWith(RUNTIME_INIT_KEY_SUFFIX)) {
      return key
    }
  }
  return null
}

async function loadRemoteViaRuntime(remoteId: string): Promise<unknown> {
  const key = findRuntimeInitKey()
  // ...
  const mfGlobal = (globalThis as Record<string, ModuleFederationGlobal>)[key]
  const runtime = await mfGlobal.initPromise
  return runtime.loadRemote(remoteId)
}
```

**Why this is debt:** The key `__mf_init____mf__virtual/...__mf_v__runtimeInit__mf_v__.js__` is an internal implementation detail of `@module-federation/vite`. It is not documented, not versioned, and not part of any public API contract. Any patch release of the plugin can rename or restructure it.

**Break condition:** Any `@module-federation/vite` or `@module-federation/runtime` update that renames the globalThis key, restructures the init flow, or moves the runtime initialisation off globalThis. The failure is silent — `findRuntimeInitKey()` returns `null`, the error thrown is "Module Federation runtime is not initialized in this host", the panel shows an error state with no obvious connection to a package update.

**Target fix:**

```ts
// Add @module-federation/runtime to apps/react-v19 devDependencies
// pnpm add -D @module-federation/runtime --filter react-v19

import { loadRemote } from '@module-federation/runtime'

const mountRemote = async () => {
  const imported = await loadRemote('react_v16/LifecycleFeature')
  const remote = resolveLifecycleRemote(imported)
  if (cancelled || !containerRef.current) return
  teardownRef.current = remote.mount(containerRef.current, {})
  setIsLoading(false)
}
```

`@module-federation/runtime` is the public, stable, semver-versioned API for MF2.0 hosts. `loadRemote` is documented and maintained. The `resolveLifecycleRemote` guard (handling `.default` wrapping) stays unchanged.

**Acceptance test:**
1. `pnpm add -D @module-federation/runtime --filter react-v19`
2. Replace `loadRemoteViaRuntime` with `loadRemote` from the public import
3. Delete `findRuntimeInitKey`, `loadRemoteViaRuntime`, `ModuleFederationRuntime`, `ModuleFederationGlobal` types, and both constants
4. `localhost:5173/feature-compare` → React 16 panel mounts with no error
5. Bump `@module-federation/vite` by one minor version — panel still mounts

**Effort:** 2–3 hours including dependency audit and test

---

## TD-02 — `serveFederationDistPlugin` serves stale pre-built files in dev mode

**File:** `apps/react-v16/vite.config.ts`

**Current behaviour:** The `dev` script runs `vite build && vite`. The initial build populates `dist/`. The custom Connect middleware in `serveFederationDistPlugin` intercepts `/remoteEntry.js` and `/assets/**` and serves the pre-built files from `dist/` synchronously. The SPA dev server continues with HMR for standalone react-v16 development.

**Why this is debt:** The federation assets (`remoteEntry.js`, the hashed JS chunks) are snapshots from the last `vite build`. If a developer changes react-v16 source code and doesn't rebuild, the host loads the old version silently. There is no warning, no console error, no type error. This is a common source of "why isn't my change showing up" confusion that costs 30–60 minutes per occurrence.

Additionally, this workaround exists because `@module-federation/vite` does not properly intercept the `/remoteEntry.js` route in Vite dev server mode. This is a plugin bug, not an architectural necessity.

**Break condition:** Not a silent break — this one degrades DX continuously. It will become more painful as the react-v16 source grows. Every source change requires a conscious rebuild step that nothing in the toolchain enforces.

**Target fix (Option A — preferred):** File a bug with `@module-federation/vite` for the dev server remoteEntry route not being intercepted before the SPA fallback. If fixed upstream, remove `serveFederationDistPlugin` entirely and revert `dev` back to `"vite"`. The plugin should handle this natively.

**Target fix (Option B — self-contained):** Replace `serveFederationDistPlugin` with `vite build --watch` + a stable file server on port 5174, isolated from Turborepo's task runner issues. Use a dedicated `serve:mfe` script:

```json
"serve:mfe": "concurrently --kill-others-on-fail \"pnpm dev:mfe\" \"pnpm preview\""
```

The `watchFederatedRemote` plugin on the host side (already in `apps/react-v19/vite.config.ts` and `apps/shell/vite.config.ts`) triggers a browser reload whenever `dist/` changes — so the DX of Option B is: edit react-v16 source → watch build detects change → rebuilds dist/ → host browser auto-reloads. No manual step.

The remaining issue with Option B is the `concurrently` + Turborepo interaction that caused vite preview to not surface in the current session — this needs to be diagnosed cleanly, likely by running `vite preview` as its own Turborepo persistent task rather than as a subprocess of `concurrently`.

**Target fix (Option C — architectural):** Add a dedicated `"dev:serve"` Turborepo task to `react-v16` that runs `vite preview --port 5174`. Configure `turbo.json` to run both `dev` (the watch build) and `dev:serve` (the preview) as parallel persistent tasks for react-v16. This eliminates `concurrently` entirely.

```json
// turbo.json
{
  "tasks": {
    "dev": { "persistent": true, "cache": false },
    "dev:serve": { "persistent": true, "cache": false }
  }
}
```

Root `package.json` dev script becomes: `turbo run dev dev:serve`.

**Acceptance test (Option B or C):**
1. Edit `apps/react-v16/src/features/lifecycle/LifecycleFeaturePage.tsx` — change any visible string
2. Within 3 seconds, `localhost:5173/feature-compare` shows the new string without a manual reload
3. `localhost:5174/remoteEntry.js` returns JavaScript at all times (no HTML)
4. No `serveFederationDistPlugin` in `vite.config.ts`

**Effort:** 4–6 hours (Option B: diagnose Turborepo + vite preview interaction; Option C: restructure turbo tasks)

---

## TD-03 — `watchFederatedRemote` plugin exists only because of TD-02

**Files:** `apps/react-v19/vite.config.ts`, `apps/shell/vite.config.ts`

**Current behaviour:** Both host apps watch `apps/react-v16/dist` via `server.watcher.add`. When files change there, they broadcast `full-reload` over the HMR WebSocket with a 150ms debounce.

**Why this is debt:** This plugin is compensating for the stale-file problem introduced by TD-02. If TD-02 is resolved (the remote serves live-transformed modules from the dev server, or `vite preview` is used with watch), there are no dist/ file changes to watch and this plugin becomes a no-op at best, a confusing artefact at worst.

**Break condition:** Non-breaking but adds noise. The watcher adds `apps/react-v16/dist` to Vite's chokidar instance. If that path doesn't exist (e.g. on a fresh clone before any build), chokidar silently ignores it — no error, but the DX goal (auto-reload) also silently doesn't work.

**Target fix:** Delete both instances of `watchFederatedRemote` once TD-02 is resolved.

**Acceptance test:** Same as TD-02's acceptance test (item 2 — auto-reload on source change).

**Effort:** 10 minutes — pure deletion after TD-02 is done.

---

## Resolution Order

```
TD-01  →  independent, do first
TD-02  →  requires Turborepo investigation, do second
TD-03  →  auto-resolves when TD-02 is done
```

TD-01 is completely isolated: it only touches `V16LifecyclePanel.tsx` and adds one devDependency. It should be done before any `@module-federation` package update to avoid being caught by a breaking internal rename.

TD-02 is the structural fix. Option C (dedicated Turborepo task) is the cleanest architecture because it removes `concurrently` from the equation entirely and gives Turborepo proper visibility into each long-running process.

---

## Do Not Address Until TD-01 is Done

Any `@module-federation/vite` version bump. The globalThis key scan in TD-01 is the most fragile piece in the codebase and should be replaced with the public API before anything else changes in the federation stack.
