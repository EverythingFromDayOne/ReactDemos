# Prompt: Fix react-dom version substitution crashing the production remote

## Symptom

`https://react19.nxhhuy.tech/feature-compare` shows:

```
[feature-compare] Failed to load react-v16 remote
TypeError: r is not a function
  at Object.1 [as mount] (LifecycleFeature-CzOMJvTP.js:1:1989)
```

`r` is the minified name for the `render` binding from
`import { render } from 'react-dom'` in
`apps/react-v16/src/exposed/LifecycleFeature.ts`. It is `undefined` at runtime.

The error reproduces only in production builds across the two deployed
origins (`react19.nxhhuy.tech` consuming `react16.nxhhuy.tech/remoteEntry.js`).
`localhost:5173/feature-compare` works because the load order of the host vs.
remote bundles in dev happens to populate the share cache differently.

## Root cause

`@module-federation/vite@1.15.2` (the federation plugin used in all three
apps) auto-shares dependencies when the `shared` option is **omitted** from
the `federation()` call. From `lib/index.mjs:532` (`normalizeShared`):

```js
function normalizeShared(shared) {
  if (!shared) {
    // No `shared` block -> read package.json and auto-share every dep
    // as singleton: true.
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
    Object.keys(packageJson.dependencies || {})
      .filter(shouldAutoShareDependency)
      .forEach((key) => {
        result[key] = normalizeShareItem(key, {
          name: key,
          import: void 0,
          singleton: true,
        });
      });
    return result;
  }
  // Explicit object/array (including {}) goes here -> only listed keys are shared.
}
```

For each shared package the plugin emits a `__mfe_internal__loadShare__<pkg>__loadShare__.mjs`
chunk that does the runtime resolution:

```js
var d = globalThis['__mf_module_cache__'], f = d.share['react-dom'];
f === void 0 && (f = l, d.share['react-dom'] = f);   // l = locally bundled fallback
var { render: y, unmountComponentAtNode: b } = f;    // destructured at module init
```

So the production crash sequence is:

1. v19 host bundle loads first → its `loadShare` shim writes **react-dom@19**
   into `globalThis.__mf_module_cache__.share['react-dom']`.
2. v19 imports the v16 remote's federated `LifecycleFeature` module.
3. v16 remote's `loadShare` shim runs → reads `share['react-dom']` → finds
   **react-dom@19** already there → its bundled fallback (react-dom@16) is
   **never used**.
4. The shim destructures `render` off react-dom@19 → React 19 removed `render`
   → `render` is `undefined` → bound to local `y` → re-exported as `t` → the
   minifier renamed it to `r` in `LifecycleFeature.js`.
5. `r(element, container)` → `TypeError: r is not a function`.

## Why removing the `shared` block does NOT fix it

A naive reading of "we don't want to share react-dom" suggests deleting the
`shared` block. **That is the worst possible config** — it triggers the
auto-share branch above and silently shares every `package.json` dependency
as `singleton: true`. The `__mfe_internal__loadShare__react_mf_2_dom__loadShare__.mjs`
chunk (~129 kB) is still emitted, the global share-cache lookup is still
performed, and the destructure-at-init pattern still snapshots `undefined`.

## Fix

Set `shared: {}` (an explicit empty object) on **both** apps:

- `apps/react-v16/vite.config.ts` — federation `shared: {}`
- `apps/react-v19/vite.config.ts` — federation `shared: {}`

Empty object hits the `else if (typeof shared === "object")` branch in
`normalizeShared`, which iterates `Object.keys({}) = []`, registers zero
shared keys, and the plugin's Rollup hooks therefore never call
`addUsedShares` / `writeLoadShareModule`. No `__mfe_internal__loadShare__`
chunks are emitted. `react`/`react-dom` are bundled directly into the
exposed chunk, and `LifecycleFeature.js` compiles to:

```js
function l(e, t) {
  return (0, a.render)((0, i.createElement)(c, t), e),
         () => (0, a.unmountComponentAtNode)(e)
}
```

`a` is the bundled react-dom@16 namespace — `a.render` is a live property
read on the inlined module, not a destructured snapshot from a global cache
that React 19 might have already poisoned.

Both apps need the empty object:

- v16 alone — would still leave v19 writing react-dom@19 into the share
  slot. v16 doesn't read from it any more, but other future remotes might.
- v19 alone — v16 still goes through its own `loadShare` shim and would
  pick up react-dom@19 (or any other host that beats v16 to the share slot).

## Files to change

- `apps/react-v16/vite.config.ts` — add `shared: {}` inside `federation({...})`
- `apps/react-v19/vite.config.ts` — add `shared: {}` inside `federation({...})`

Comment each one to explain why it must be `{}` and not omitted, so a future
agent doesn't "clean up" the empty object back into auto-sharing.

## Files NOT to change

- `apps/shell/vite.config.ts` — separate host with its own concerns
- Any file in `src/` — the import pattern in `LifecycleFeature.ts` is correct

## Acceptance test

1. `pnpm --filter react-v16 --filter react-v19 build` — both build clean.
2. Inspect `apps/react-v16/dist/assets/` and `apps/react-v19/dist/assets/` —
   no file matching `__mfe_internal__*loadShare*react_mf_2_dom*loadShare__.mjs`
   should exist.
3. Inspect the new `LifecycleFeature-*.js` — `mount` should call
   `(0, a.render)(...)` directly. No `var { render: y } = f` destructure.
4. `localhost:5173/feature-compare` — React 16 panel still mounts (dev still works).
5. Deploy to Vercel.
6. `https://react19.nxhhuy.tech/feature-compare` — React 16 panel mounts and
   logs `constructor` + `componentDidMount` with no console error.
7. `https://react16.nxhhuy.tech/remoteEntry.js` — still returns valid JavaScript.
