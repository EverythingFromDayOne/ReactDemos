# Prompt: Make MFE remote entry URLs environment-driven

## Context

The react-v16 remote entry URL (`http://localhost:5174/remoteEntry.js` in dev,
`https://react16.nxhhuy.tech/remoteEntry.js` in production) is currently
hardcoded in multiple places. `apps/react-v19` already has the correct `.env`
infrastructure and partially reads it, but the other consumers are not wired up.
This task completes the pattern consistently across all three consumers.

---

## Files to change

### 1. `apps/react-v19/vite.config.ts`

The file already loads `VITE_V16_REMOTE_URL` from the environment and uses it as
`remoteUrl ?? fallbackRemoteUrl`. But it also defines three dead-code variables
(`localRemoteUrl`, `productionRemoteUrl`, `fallbackRemoteUrl`) that duplicate
what the `.env` files already express.

Remove those three intermediate variables entirely. The `entry` field should read
directly from `env.VITE_V16_REMOTE_URL`. There is no need for a programmatic
fallback because the `.env` files are the source of truth — a missing env var
during build is a configuration error that should surface as one, not be masked
by a silent string default.

---

### 2. `apps/shell/vite.config.ts`

The file has no environment loading at all. Its federation config contains a
hardcoded `entry: 'http://localhost:5174/remoteEntry.js'`.

Switch `defineConfig` to its function form so it receives `{ mode }`. Use Vite's
`loadEnv` to load env vars for the current mode. Read `VITE_V16_REMOTE_URL` from
the loaded env and use it as the `entry` value.

Apply the same treatment as the cleaned-up react-v19 config: no inline fallback
strings, no programmatic mode switch. The `.env` files own the values.

---

### 3. `apps/shell/src/main.ts`

The error message on the `catch` branch of `bootstrap()` contains a hardcoded
`http://localhost:5174` URL. Replace it with a reference to
`import.meta.env.VITE_V16_REMOTE_URL` so the logged URL always matches whatever
environment the build was targeting.

---

### 4. `apps/shell/.env` and `apps/shell/.env.production` (new files)

Create both files mirroring the existing pattern in `apps/react-v19/`:

- `.env` — development value: `http://localhost:5174/remoteEntry.js`
- `.env.production` — production value: `https://react16.nxhhuy.tech/remoteEntry.js`

`VITE_V16_REMOTE_URL` is the env var name in both files, matching react-v19.

---

## Constraints

- Do not create a shared constants file or cross-app import for these values. Each
  app reads its own `.env` independently — that is the correct Vite pattern for a
  monorepo where apps are built separately.
- Do not add `VITE_V16_REMOTE_URL` to any root-level `.env` file. Keep env files
  co-located with the app that consumes them.
- The env var name `VITE_V16_REMOTE_URL` is fixed — do not rename it.
- Do not touch any other hardcoded localhost URL in the codebase (e.g. the
  `localhost:5173` iframe src in `shell/src/main.ts` is out of scope).
- Do not touch `apps/react-v19/.env` or `apps/react-v19/.env.production` — they
  are already correct.
- No changes to `apps/react-v16/` — the remote serves from whatever port it is
  started on; that is a runtime concern, not this task's concern.

## Acceptance test

1. Run `grep -r "localhost:5174" apps --include="*.ts" --include="*.tsx"` (excluding
   `.md` files) — expect zero matches.
2. `apps/shell/vite.config.ts` uses `loadEnv` and reads `VITE_V16_REMOTE_URL`.
3. `apps/react-v19/vite.config.ts` no longer defines `localRemoteUrl`,
   `productionRemoteUrl`, or `fallbackRemoteUrl`.
4. Both apps build without error: `pnpm --filter react-v19 build` and
   `pnpm --filter shell build`.
