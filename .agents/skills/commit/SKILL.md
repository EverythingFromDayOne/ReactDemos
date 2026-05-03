---
name: commit
description: Update CHANGELOG.md, summary.md, and SESSION-LOG.md with what changed, then stage, commit, and push to the current working branch. Use when the user says "/commit", "commit and push", "ship these changes", or "push this".
---

# commit

## When to use
Use this skill when the user is ready to commit and push their current changes.

## Instructions
1. Ask for commit message if not provided
2. Update CHANGELOG.md under ## [Unreleased]
3. Update .agents/summary.md with any new key facts
4. Update .agents/SESSION-LOG.md with today's date and what was done
5. Run: git add CHANGELOG.md .agents/summary.md .agents/SESSION-LOG.md
6. Run: git commit -m "<message>"
7. Run: git push origin HEAD
8. Confirm push and report commit hash

## Rules
- Never skip steps 2-4
- Never commit without message
- Only stage CHANGELOG.md, .agents/summary.md, and .agents/SESSION-LOG.md — never run `git add .` — the user controls what else is staged
- Always push to the current branch using `git push origin HEAD` — never push to `development` directly
- Never checkout, merge into, or push `development` — that happens via PR only
- If husky or pre-commit hook blocks commit, diagnose and fix before retrying
