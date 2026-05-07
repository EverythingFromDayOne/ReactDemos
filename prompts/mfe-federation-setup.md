# Prompt: Vite Module Federation Setup — react-demos

## Role
You are a 10y+ senior frontend architect specialising in Vite, microfrontend architecture, and Turborepo monorepos. You hold the bar of a principal engineer on every file you touch: correctness first, then accessibility, then performance, then developer experience. You understand the fundamental constraint that React 16 and React 19 cannot share a React singleton — their internal reconciler APIs are incompatible. You always read existing files before proposing changes and you never modify more than one concern per edit. You proactively flag gaps — you do not wait to be asked.

## Objective
Wire `@originjs/vite-plugin-federation` into the react-demos Turborepo so that:
- `apps/react-v16` is a **federation remote** that exposes typed `mount()` functions — one per feature
- `apps/react-v19` is a **federation host** (for production at `react19.nxhhuy.tech`) that dynamically imports from the v16 remote
- `apps/shell` is a **dev-only federation host** (port 3000) that imports from both remotes simultaneously for local side-by-side development
- A typed event-bus constants file in each app defines the namespaced `window.CustomEvent` names used for cross-root communication

---

## Architecture rationale (read before touching code)

### Why mount-function, not component export
React 16 uses `ReactDOM.render(element, container)`. React 19 uses `createRoot(container).render(element)`. If the host imports a React 16 component and tries to render it in a React 19 tree, both reconcilers fight over the same DOM node. The mount-function pattern avoids this entirely:

- Each remote exports a plain TypeScript function: `mount(container: HTMLElement, props: Props): () => void`
- Inside the function, the remote calls its own React's render API into `container`
- The function returns a teardown/unmount callback
- The host (shell or react-v19) calls `mount()` and stores the teardown — it never touches React at all

### Why React is NOT in the shared config
`@originjs/vite-plugin-federation` allows declaring shared singletons. Sharing React would mean one React instance for all remotes. React 16 and React 19 cannot be the same instance. Therefore: **do not list `react` or `react-dom` in `shared` for any app in this repo.** Every remote bundles its own React. The host never uses React (shell) or uses React 19 only (react-v19).

### Why window.CustomEvent for the event bus
With separate React roots (v16 in one container, v19 in another), there is no shared React context or props channel. `window` is always a true singleton regardless of how federation bundles modules. Events dispatched with `window.dispatchEvent(new CustomEvent(...))` are received by all `window.addEventListener` handlers in the same browsing context — no iframe boundary, no postMessage ceremony.

Event names use a namespaced prefix `react-demos:lifecycle:` to prevent collisions with browser APIs and browser extension heartbeat events (extensions such as Claude in Chrome send unlabelled postMessages every ~250ms — these must never be confused with app events).

---

## Current state (read before proposing)

| File | What exists |
|------|-------------|
| `apps/shell/index.html` | Vanilla HTML, two hardcoded `<iframe>` elements pointing to localhost:5174 and localhost:5173 |
| `apps/shell/vite.config.ts` | Vite + Tailwind, port 3000, no React, no federation |
| `apps/react-v16/vite.config.ts` | Vite + React plugin + Tailwind, port 5174, no federation |
| `apps/react-v19/vite.config.ts` | Vite + React plugin + Tailwind, port 5173, no federation |
| `apps/react-v16/src/App.tsx` | Empty placeholder, renders version string only |
| `apps/react-v19/src/App.tsx` | React Router v7, `/roadmap` route, catch-all redirects to `/roadmap` |
| `turbo.json` | Standard `build`/`dev`/`lint` pipeline, no federation-specific ordering |
| `pnpm-workspace.yaml` | `apps/*` only — no `packages/*` |

---

## Phase 1 — Audit (read, do not touch)

Before proposing any change:
1. Read all three `vite.config.ts` files
2. Read `apps/react-v16/src/App.tsx` and list every file inside `apps/react-v16/src/`
3. Read `apps/react-v19/src/App.tsx` and list every file inside `apps/react-v19/src/`
4. Read `apps/shell/index.html`
5. Read `turbo.json` and `pnpm-workspace.yaml`
6. Check whether `@originjs/vite-plugin-federation` is already present in any `package.json`

Present a one-paragraph summary of what you found and any concerns before proceeding.

---

## Phase 2 — Dependency installation (propose only, do not run)

Propose the exact pnpm commands to install `@originjs/vite-plugin-federation` in all three apps.

Rules:
- Install as a `devDependency` in each app separately, not at the workspace root
- No other packages should be installed
- Present the commands and wait for approval before executing

---

## Phase 3 — Configure remote: apps/react-v16

Work through the following in order, one file at a time. After each file, state what changed and why.

### 3a. vite.config.ts
Update `apps/react-v16/vite.config.ts`:
- Add the `federation()` plugin from `@originjs/vite-plugin-federation`
- Plugin configuration:
  - `name`: `'react-v16'`
  - `filename`: `'remoteEntry.js'`
  - `exposes`: one entry — key `'./LifecycleFeature'`, value pointing to the new file created in step 3b
  - `shared`: empty object `{}` — do NOT list react or react-dom
- Add `build.target: 'esnext'` (required by vite-plugin-federation — it uses top-level await in generated code)
- Preserve the existing `react()` and `tailwindcss()` plugins and port configuration

### 3b. Mount entry file
Create `apps/react-v16/src/exposed/LifecycleFeature.ts`:

This file is the federation boundary. It must:
- Export a TypeScript type `LifecycleFeatureProps` (initially an empty object — properties will be added when the UI is built)
- Export a `mount(container: HTMLElement, props: LifecycleFeatureProps): () => void` function that:
  1. Imports `ReactDOM` from `'react-dom'` and `React` from `'react'`
  2. Imports `LifecycleFeaturePage` from a sibling file `'../features/lifecycle/LifecycleFeaturePage'` (this component does not exist yet — create a stub that renders a `<div>` with the text "v16 Lifecycle — coming soon")
  3. Calls `ReactDOM.render(React.createElement(LifecycleFeaturePage, props), container)`
  4. Returns `() => ReactDOM.unmountComponentAtNode(container)` as the teardown

Important: the file extension is `.ts` not `.tsx`. JSX belongs in the imported component, not in this boundary file. This keeps the mount entry pure TypeScript and avoids JSX transform complications at the federation boundary.

### 3c. Lifecycle stub component
Create `apps/react-v16/src/features/lifecycle/LifecycleFeaturePage.tsx`:
- A minimal class component (React.Component, not function — this is the v16 app) that renders a placeholder `<div>` indicating the feature is under construction
- No state, no lifecycle hooks — just the placeholder render for now

### 3d. Event bus constants
Create `apps/react-v16/src/event-bus.ts`:
- Export a frozen `const EVENTS` object with string constants, all prefixed `'react-demos:lifecycle:'`
- Include these keys at minimum:
  - `HOOK_FIRED` — a lifecycle hook fired, detail includes which hook and from which source
  - `MOUNTED` — the component mounted
  - `UNMOUNTED` — the component unmounted
- Export a TypeScript type `LifecycleEventDetail` describing the CustomEvent's `detail` payload:
  - `source`: `'v16' | 'v19'`
  - `hook`: string (name of the lifecycle hook)
  - `timestamp`: number

---

## Phase 4 — Configure production host: apps/react-v19

### 4a. vite.config.ts
Update `apps/react-v19/vite.config.ts`:
- Add the `federation()` plugin
- Plugin configuration:
  - `remotes`: one entry — key `'react-v16'`, value from an environment variable `process.env.VITE_V16_REMOTE_URL` with a fallback to `'http://localhost:5174/assets/remoteEntry.js'` for local dev
  - `shared`: empty object `{}` — react-v19 manages its own React; the remote has its own
- Add `build.target: 'esnext'`
- Preserve existing plugins and port

### 4b. Environment variable
Create `apps/react-v19/.env.production`:
- One line: `VITE_V16_REMOTE_URL=https://react16.nxhhuy.tech/assets/remoteEntry.js`

Create `apps/react-v19/.env` (local dev default):
- One line: `VITE_V16_REMOTE_URL=http://localhost:5174/assets/remoteEntry.js`

### 4c. TypeScript federation declaration
Create `apps/react-v19/src/types/federation.d.ts`:
- A module declaration for `'react-v16/LifecycleFeature'`
- Declares the exported `mount` function with the same signature as step 3b
- Declares the `LifecycleFeatureProps` type (initially empty)

This file prevents TypeScript from erroring on the dynamic import before the remote is built.

### 4d. Event bus constants (react-v19 copy)
Create `apps/react-v19/src/event-bus.ts`:
- Identical `EVENTS` object and `LifecycleEventDetail` type as step 3d
- This duplication is intentional — there is no shared package in this workspace
- Add a comment at the top: `// Intentionally duplicated from apps/react-v16/src/event-bus.ts — window is the singleton, not this file`

---

## Phase 5 — Configure dev host: apps/shell

### 5a. vite.config.ts
Update `apps/shell/vite.config.ts`:
- Add the `federation()` plugin
- Plugin configuration:
  - `remotes`: two entries
    - `'react-v16'` → `'http://localhost:5174/assets/remoteEntry.js'`
    - `'react-v19-feature'` → `'http://localhost:5173/assets/remoteEntry.js'` (note: react-v19 does not expose federation remotes yet — leave this as a placeholder for future use; only react-v16 is used today)
  - `shared`: empty `{}`
- Add `build.target: 'esnext'`
- The shell is never built for production — the build config is only needed for vite-plugin-federation's dev server to resolve remote imports

### 5b. Replace iframes with mount containers
Update `apps/shell/index.html`:
- Remove the two `<iframe class="pane-frame">` elements
- Replace each with a `<div>` that has an `id` for JavaScript targeting: `id="pane-v16"` and `id="pane-v19"`
- The `<div>` elements should fill the pane space the same way the iframes did (use the existing `.pane-frame` class or equivalent inline style)
- Add a `<script type="module" src="/src/main.ts">` tag in the body

### 5c. Shell orchestrator script
Create `apps/shell/src/main.ts`:
- Dynamically imports `mount` from `'react-v16/LifecycleFeature'`
- Finds the `#pane-v16` container
- Calls `mount(container, {})` and stores the returned teardown
- Prints a console message on success and a clear error message if the import fails (to help diagnose if the remote is not running)
- Adds a `beforeunload` handler that calls the teardown function

For the v19 pane: for now, leave `#pane-v19` empty with a placeholder message rendered via vanilla DOM (not React) — "react-v19 feature-compare coming soon". The full v19 component mounts from within react-v19's own router, not from the shell.

### 5d. TypeScript declaration for shell
Create `apps/shell/src/types/federation.d.ts`:
- Same module declaration as step 4c for `'react-v16/LifecycleFeature'`

---

## Phase 6 — Turborepo pipeline update

Update `turbo.json`:
- The `build` pipeline already has `"dependsOn": ["^build"]`
- This is sufficient — Turborepo will build dependencies first
- Add a note in the build pipeline output for `react-v16`: ensure `dist/assets/remoteEntry.js` is included in build outputs (add `"dist/assets/**"` if not already covered by `"dist/**"`)
- Do NOT add a `packages/*` entry to `pnpm-workspace.yaml` — no shared packages are needed

---

## Phase 7 — Verification checklist

After all phases, verify in order:

1. `pnpm --filter react-v16 build` — must complete without errors and emit `dist/assets/remoteEntry.js`
2. `pnpm --filter react-v16 dev` — start the remote dev server on port 5174
3. Open `http://localhost:5174/assets/remoteEntry.js` in browser — must return JavaScript (not 404)
4. `pnpm --filter react-v19 dev` — start react-v19 on port 5173
5. `pnpm --filter shell dev` — start shell on port 3000
6. Open `http://localhost:3000` — the left pane must show the v16 placeholder (not an iframe, not a blank div)
7. Open browser console on localhost:3000 — no errors about failed remote imports

Report the result of each check. If any check fails, stop and show the full error before attempting a fix.

---

## Senior gap review — apply before closing this prompt

After completing all phases, verify these four concerns that a 10y+ senior would catch immediately. If any is missing, fix it before reporting done.

### Gap 1 — CORS on the remote dev server
`@originjs/vite-plugin-federation` requires the remote's dev server to respond with `Access-Control-Allow-Origin: *` (or the host's origin). Without this the host's dynamic import is blocked by the browser with a CORS error — not a federation error — making the failure opaque.

Add `server.cors: true` to `apps/react-v16/vite.config.ts`. Verify by opening the remote entry URL in the browser with the host origin in the `Origin` request header and confirming the response includes the CORS header.

### Gap 2 — TypeScript strict mode in all three apps
Confirm `"strict": true` exists in every `tsconfig.json` in `apps/react-v16`, `apps/react-v19`, and `apps/shell`. If any tsconfig is missing it, add it. Strict mode catches implicit `any`, unchecked nullable access, and missing return types — all of which are real risks in the federation boundary code (mount signatures, event detail types, dynamic import results).

### Gap 3 — Remote URL env var fallback is production-safe
The `VITE_V16_REMOTE_URL` env var must have a `.env.production` value that points to the deployed remote URL and a `.env` value for local dev. Verify the fallback in code (`process.env.VITE_V16_REMOTE_URL ?? 'http://localhost:5174/...'`) is NOT used as the production build default — in production, Vite replaces `import.meta.env.VITE_V16_REMOTE_URL` at build time. The fallback is only for type-safety. If the env var is missing at build time, the build must fail loudly — do not silently fall back to localhost in a production bundle.

### Gap 4 — remoteEntry.js is included in CI deploy artifact
When Vercel deploys `apps/react-v16`, it must include `dist/assets/remoteEntry.js` in the uploaded artifact. Confirm the Vercel output directory config covers `assets/**` and not just the app's entry HTML. If the `remoteEntry.js` is missing from the deploy, `react-v19` production host will fail silently.

---

## Hard constraints

- **Never add `react` or `react-dom` to the `shared` config.** Each React version is self-contained.
- **The mount entry file (`LifecycleFeature.ts`) must not contain JSX.** JSX stays in the component file.
- **Do not modify `apps/react-v19/src/App.tsx` or its routing** in this prompt — routing is handled in the feature-compare prompt.
- **Do not add React or any framework to `apps/shell`.** The shell is and remains framework-agnostic vanilla TypeScript.
- **`build.target: 'esnext'` is non-negotiable** for all three vite configs — vite-plugin-federation uses top-level await.
- **`server.cors: true` is non-negotiable** for `apps/react-v16/vite.config.ts` — the host cannot import the remote without CORS headers.
- **`"strict": true` is non-negotiable** in every `tsconfig.json` — no implicit `any`, no loose nullability.
- **One file per edit.** State what you changed and why before moving to the next file.
- **If any step produces an error, stop immediately** and show the full error text. Do not attempt a workaround without confirmation.
- **Read the react-refactor-guard SKILL.md** (`.agents/skills/react-refactor-guard/SKILL.md`) before writing any `.ts` or `.tsx` file. The rules there are non-negotiable.
