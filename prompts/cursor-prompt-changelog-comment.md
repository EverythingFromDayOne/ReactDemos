# Cursor Prompt — Add changelog PR comment to React demos CI

> **STOP AND ASK** before touching any file not listed below. Read the current file before making any changes.

---

## Context

We are in the **ReactDemos** Turborepo (`EverythingFromDayOne/ReactDemos`).
Target file: `.github/workflows/deploy.yml`

The Angular demos repo has a `changelog-comment` job that posts a sticky "What changed in this PR" comment on every PR, pulling content from `CHANGELOG.md`'s `## [Unreleased]` section. The React demos workflow is missing this entirely — add it now to match.

---

## What to change in `.github/workflows/deploy.yml`

### 1 — Add `pull_request` trigger

The workflow currently only triggers on `push` to `development`. Add a `pull_request` trigger for the same branch so the changelog job fires on PRs:

```
on:
  push:
    branches: [development]
  pull_request:
    branches: [development]
```

### 2 — Gate the existing jobs to `push` only

The `deploy-v19`, `deploy-v16`, and `notify` jobs must not run on pull requests — add an `if: github.event_name == 'push'` condition to each of those three jobs. No other changes to those jobs.

### 3 — Add a new `changelog-comment` job

Add the job at the end of the file. Key requirements:

- **Runs on:** `pull_request` events only — `if: github.event_name == 'pull_request'`
- **No `needs:`** — runs independently, does not wait for deploy jobs
- **Permissions** (job-level, not workflow-level):
  ```
  permissions:
    pull-requests: write
    contents: read
  ```
  The `contents: read` is required or the checkout step will fail silently with "repo not found".

- **Steps:**
  1. `actions/checkout@v4` — needed to read `CHANGELOG.md`
  2. Read `CHANGELOG.md` and extract the body of the `## [Unreleased]` section (everything between `## [Unreleased]` and the next `## [` heading). Store it as a step output.
  3. `peter-evans/find-comment@v3` — search for an existing comment containing the marker `<!-- changelog-comment -->` on the current PR
  4. `peter-evans/create-or-update-comment@v4` — create a new comment or update the existing one (using the `comment-id` output from the previous step). The comment body must:
     - Start with the marker `<!-- changelog-comment -->` (so future runs can find and update it)
     - Include a heading **"What changed in this PR"**
     - Include the extracted `## [Unreleased]` content below the heading
     - If the `## [Unreleased]` section is empty or missing, fall back to a message like `_No unreleased changes documented yet._`

Use the same `peter-evans` action versions already used in the angular-demos repo (`find-comment@v3`, `create-or-update-comment@v4`).

---

## File allowed to touch

- `.github/workflows/deploy.yml`

Do NOT touch `turbo.json`, any app source files, `CHANGELOG.md`, or any other file.

---

## Checklist

- [ ] Workflow still deploys correctly on push to `development`
- [ ] Deploy and notify jobs are skipped on pull requests
- [ ] Opening or updating a PR against `development` triggers the `changelog-comment` job
- [ ] A sticky comment appears on the PR with the `## [Unreleased]` content from `CHANGELOG.md`
- [ ] Subsequent pushes to the PR branch update the existing comment rather than adding a new one
- [ ] YAML is valid — no syntax errors
