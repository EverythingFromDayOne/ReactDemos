# Hosting React 16 Inside a React 19 App via Module Federation — Five Pitfalls and What Actually Fixed Them

**Date:** 2026-05-07
**Repo:** react-demos · `feat/feature-compare`
**Stack:** `@module-federation/vite` 1.15.x · Vite 8 · React 16.14 · React 19.2 · Turborepo · pnpm workspaces

---

## Background

The react-demos monorepo compares React 16 class-component patterns against React 19 hook patterns side by side. The architecture is:

- `apps/react-v16` — federation **remote**: exposes a `mount(container, props) → teardown` function backed by React 16 class components
- `apps/react-v19` — federation **host**: loads the v16 remote dynamically and mounts it alongside its own React 19 tree
- `apps/shell` — a framework-free dev-only host that places both in a side-by-side view

The goal was true microfrontend federation — not iframes — so both React runtimes live in the same page but never share a reconciler.

This post documents five distinct failure modes encountered during setup, the root cause of each, and what actually fixed them.

---

## Pitfall 1 — CJS Default Import Interop in the Federation Boundary

### What broke

```
TypeError: r is not a function   ← minified as ReactDOM.render
```

The remote's boundary file originally used default imports:

```ts
import React from 'react'
import ReactDOM from 'react-dom'

export function mount(container, props) {
  ReactDOM.render(React.createElement(LifecycleFeaturePage, props), container)
  return () => ReactDOM.unmountComponentAtNode(container)
}
```

### Why it happened

React 16 and react-dom 16 are CJS-only packages. Under `@module-federation/vite` (which uses rolldown internally), the CJS-to-ESM synthetic default export is not guaranteed at the federation boundary. When the bundler wraps a CJS module for federation, `import ReactDOM from 'react-dom'` resolves to `undefined` in some execution paths because the default interop shim is missing from the generated bundle.

### The fix

Named exports from CJS modules are always populated reliably because they map directly to `module.exports.render` / `module.exports.unmountComponentAtNode` without any synthetic default wrapper:

```ts
import { createElement } from 'react'
import { render, unmountComponentAtNode } from 'react-dom'

export function mount(container, props) {
  render(createElement(LifecycleFeaturePage, props), container)
  return () => unmountComponentAtNode(container)
}
```

**Rule:** At any CJS package federation boundary, always use named imports. Default imports of CJS packages are undefined-safe only if the bundler generates a correct `__esModule` interop shim — that shim is not guaranteed across all MF runtimes and bundlers.

---

## Pitfall 2 — React-dom 19 Being Substituted for the Remote's React-dom 16

### What broke

```
TypeError: r is not a function   ← same symptom, different cause
```

After fixing the named import issue, the error persisted on the react-v19 host but not on the shell.

### Why it happened

`@module-federation/vite` scans the host's dependencies and registers them in the shared scope. The react-v19 host has `react-dom@19.x`. When the remote initialises, the MF runtime compares the remote's required version against the shared scope. Semver resolution promotes the highest compatible version — since 19 > 16, the runtime decided to substitute the host's react-dom@19 for the remote's context. react-dom@19 does not export `render()` (removed in v18+), so `render` resolves to `undefined`.

The shell worked because it has **no** react-dom dependency — nothing in the shared scope to conflict with.

### The fix

In the remote's `vite.config.ts`, override the shared config for react-dom with an explicit version constraint and `singleton: false`:

```ts
federation({
  shared: {
    'react-dom': {
      singleton: false,         // do NOT reuse the host's copy
      requiredVersion: '~16.14.0',
      version: '16.14.0',       // what this remote provides
    },
  },
})
```

`singleton: false` tells the runtime: this package must never be shared across host and remote — load separate copies. `requiredVersion: '~16.14.0'` rejects any version that doesn't satisfy the constraint.

**Equally important:** do NOT add a `shared` block to the host (react-v19). If you declare `react-dom: { requiredVersion: '^19.0.0' }` on the host, you put react-dom@19 into the shared scope explicitly, which is exactly what the runtime then tries to negotiate against the remote's `~16.14.0`. The remote wins the version check (incompatible), triggers the async `loadShare` fallback, and introduces Pitfall 3.

---

## Pitfall 3 — `remote.mount is not a function` (Async loadShare Timing)

### What broke

```
TypeError: remote.mount is not a function
```

With version constraints correctly declared, the shell continued to work but the react-v19 host now produced this error instead. The debug logs confirmed:

```ts
console.log('[debug] remote keys:', Object.keys(remote))   // → []
console.log('[debug] mount type:', typeof remote.mount)     // → 'undefined'
```

### Why it happened

This is the subtlest bug in the session. When the MF runtime detects a version mismatch between host and remote for a shared package, it falls back to an async `loadShare` path — it fetches and initialises the remote's own copy of that package asynchronously. This is correct behaviour.

The problem is with `await import('react_v16/LifecycleFeature')`. Vite's dynamic import transform resolves the **module namespace object** immediately when the remote container is initialised. At that point the container is open but the async `loadShare` fetch for react-dom@16 hasn't completed. The module object is handed back with `mount: undefined` because the factory function that would call `render()` hasn't fully executed yet. By the time `teardownRef.current = remote.mount(...)` runs, `mount` is still `undefined`.

The shell avoided this because it has no react-dom in its dependency tree, so the runtime never takes the `loadShare` path — everything initialises synchronously.

### The fix

Bypass Vite's module transform pipeline entirely. Access the MF runtime through its own public API and call `loadRemote` directly. `runtime.loadRemote` is the runtime's native method that properly awaits all async initialisation before returning the module:

```ts
// react-v19 does not directly import @module-federation/runtime,
// but the plugin injects the runtime onto globalThis at init time.
// Access it via the public getInstance() API instead.
import { loadRemote } from '@module-federation/runtime'

const imported = await loadRemote('react_v16/LifecycleFeature')
```

`loadRemote` sequences internally: fetch remoteEntry.js → open the container → negotiate shared scope → await all `loadShare` fetches → execute the module factory → return the fully initialised module namespace.

> **Note on the current implementation:** The working code in this branch uses a `globalThis` key scan (`findRuntimeInitKey`) instead of the public `@module-federation/runtime` import. This is documented as a known technical debt item — see `docs/tech-debt/mfe-federation-workarounds.md`.

---

## Pitfall 4 — `remoteEntry.js` Returning HTML in Vite Dev Server Mode

### What broke

```
Failed to fetch dynamically imported module: http://localhost:5174/remoteEntry.js
```

The browser received `text/html` (the React 16 SPA page) instead of `application/javascript`.

### Why it happened

`vite` dev server does **not** generate `remoteEntry.js` as a static file. The federation plugin transforms module requests on-the-fly via Vite's module resolution pipeline, but the `/remoteEntry.js` URL endpoint is not registered as an HTTP middleware route in dev mode (at least not reliably in `@module-federation/vite` 1.15.x). Requests to that URL fall through to Vite's SPA historyApiFallback, which returns `index.html`.

### The fix

Two parts:

**Part A — Build once before starting the dev server.** The `dev` script becomes:

```json
"dev": "vite build && vite"
```

This populates `dist/` with `remoteEntry.js` and all hashed assets before the dev server starts.

**Part B — Intercept federation routes in the dev server.** A custom Vite plugin adds a Connect middleware that serves those pre-built files before the SPA fallback can intercept them:

```ts
function serveFederationDistPlugin() {
  return {
    name: 'serve-federation-dist',
    apply: 'serve',
    configureServer(server) {
      const distDir = resolve(__dirname, 'dist')
      server.middlewares.use((req, res, next) => {
        const url = (req.url ?? '/').split('?')[0]
        if (url === '/remoteEntry.js' || url === '/mf-entry-bootstrap-0.js' || url.startsWith('/assets/')) {
          const filePath = resolve(distDir, url.slice(1))
          if (existsSync(filePath)) {
            res.setHeader('Content-Type', extname(filePath) === '.css' ? 'text/css' : 'application/javascript')
            res.setHeader('Access-Control-Allow-Origin', '*')
            res.end(readFileSync(filePath))
            return
          }
        }
        next()
      })
    },
  }
}
```

The SPA at `localhost:5174/` continues to work with full HMR. `localhost:5174/remoteEntry.js` now returns the real JavaScript.

> **Trade-off:** The federation assets served in dev mode are snapshots from the last `vite build`. Changes to react-v16 source require a manual rebuild to be picked up by the host. This is documented as tech debt.

---

## Pitfall 5 — Infinite Rebuild Loop in Watch Mode

### What broke

`vite build --watch` rebuilt continuously (every 130–150ms) in an endless loop immediately after a source file changed.

### Why it happened

`@module-federation/vite` materialises its virtual modules as real `.mjs` files in `node_modules/__mf__virtual/` during each build. For example:

```
node_modules/__mf__virtual/__mfe_internal__react_v16__loadShare__react_mf_2_dom__loadShare__.mjs
```

Rollup's watch mode tracks these files as resolved module dependencies (because they are imported by the generated bundle). Each build rewrites them with updated content. Rollup's file watcher detects the write as a source change → triggers another build → overwrites the files again → infinite loop.

The loop only triggers after a user-initiated change because the watch needs a first trigger to enter the cycle; it doesn't spin from a cold start.

### The fix

Exclude that directory from Rollup's watch dependency tracking:

```ts
build: {
  watch: {
    exclude: /node_modules[\\/]__mf__virtual[\\/]/,
  },
}
```

Rollup's `WatcherOptions.exclude` removes matched paths from the file dependency graph. Subsequent builds no longer track the virtual module files as watched inputs.

`emptyOutDir: false` is also set to prevent the watch build from clearing `dist/` before each incremental rebuild, which would cause the `serveFederationDistPlugin` to briefly serve empty or missing files.

---

## Summary

| Pitfall | Root cause | Fix |
|---|---|---|
| `ReactDOM.render is not a function` | CJS default-export interop fails under rolldown bundling | Named imports at federation boundary |
| react-dom@19 substituted for remote | MF shared-scope semver promotion | `singleton: false` + explicit `requiredVersion` on remote; no `shared` on host |
| `remote.mount is not a function` | `await import()` resolves module namespace before async `loadShare` completes | `runtime.loadRemote()` which properly awaits full initialisation |
| `remoteEntry.js` returns HTML | Vite dev server SPA fallback wins over MF plugin route | Pre-build step + dev-server middleware serving from `dist/` |
| Infinite watch rebuild | MF plugin writes virtual modules to `node_modules/__mf__virtual/`; Rollup watches them | `build.watch.exclude` for that directory |

---

## Lessons

**Two React runtimes in one page via MF2.0 is feasible, but the shared-scope version negotiation is the sharpest edge.** The failure modes are asymmetric: the shell (no react-dom dependency) works fine while the react-v19 host (with react-dom@19) triggers both the substitution bug and the async timing bug. Always test against the real host, not a minimal harness.

**`await import()` is not safe as an MF async boundary when `singleton: false` shared packages are involved.** Use `loadRemote` from the runtime API instead. The dynamic import transform was designed for code splitting, not for cross-version shared dependency coordination.

**Vite dev server and `vite preview` have different module-serving semantics.** Federation remotes that need to serve a static `remoteEntry.js` during development should either build to `dist/` and serve from there, or use a separate static file server. Treating the dev server as equivalent to preview is the source of the HTML-instead-of-JS failure.
