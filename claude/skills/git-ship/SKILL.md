---
name: git-ship
description: Runs the full post-feature workflow in sequence: sync docs, stage and commit, rename branch, open PR, and append changelog if one exists. Use after implementing a feature, or when asked to "ship", "ship this", or "ship it". Do NOT use for changelog-only updates.
disable-model-invocation: true
---

# Ship

Run the full post-feature workflow by invoking each skill in sequence using the Skill tool. Do not pause between steps. Each skill's permission dialogs are the confirmation gates.

## Pre-check

Run `git diff --cached --name-only 2>/dev/null` to check for staged files. If output is empty and there are unstaged changes, run `git add -A` to stage everything before proceeding.

## Sequence

1. Invoke `toolkit:docs-sync` to sync docs against changes since main
2. Run `git add -A` to stage any files docs-sync wrote
3. Check if `CHANGELOG.md` exists at the project root. If yes, invoke `toolkit:release-changelog`. If no, skip silently.
4. Run `git add -A` to stage any changelog changes
5. Invoke `toolkit:git-stage` to group staged changes and commit by concern
6. Invoke `toolkit:git-branch` to rename branch to match conventional format
7. Invoke `toolkit:git-pr` to push branch and open pull request

Wait for each skill to complete before invoking the next.

## After completion

Output exactly:

`✅ Shipped`

Do not add any other text.
