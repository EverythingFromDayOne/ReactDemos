---
name: commit
description: Update CHANGELOG.md, summary.md, and SESSION-LOG.md with what changed, then stage, commit, and push to development. Use when the user says "/commit", "commit and push", "ship these changes", or "push this".
---

# commit

## When to use

Use this skill when the user is ready to commit and push their current changes to the `development` branch.

## Instructions

1. Ask the user for a one-line commit message if they haven't already provided one
2. Update `CHANGELOG.md` — under `## [Unreleased]`, add a `### Added` / `### Changed` / `### Fixed` entry (pick the right heading) summarising exactly what files changed and why
3. Update `.agents/summary.md` — update "Current status" and "Pending" to reflect the state after this commit
4. Update `.agents/SESSION-LOG.md` — append a dated bullet: what was done, what's next, any blockers
5. Run: `git add .`
6. Run: `git commit -m "<commit message from step 1>"`
7. Run: `git push origin development`
8. Confirm the push succeeded and report the commit hash

## Rules

- Never skip steps 2–4 — docs must be updated before the commit goes through
- Never commit without a message
- Always push to `development` unless the user explicitly says otherwise
- If the husky hook blocks the commit, diagnose and fix before retrying