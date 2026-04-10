---
description: Runs the full post-feature workflow by syncing docs, staging commits, renaming the branch, and opening a PR. Use after implementing a feature, or when asked to "ship", "ship this", or "ship it".
---

# Ship

Run the full post-feature workflow by invoking each step in sequence. After each step completes, invoke the next immediately. Do not output any text between steps. Do not wait for user input between steps. The only interrupts allowed are tool permission dialogs.

## Pre-check

// turbo

1. Run `git diff --cached --name-only 2>/dev/null` to check for staged files. If output is empty and there are unstaged changes, run `git add -A` to stage everything before proceeding.

## Sequence

2. Run the `/docs-sync` workflow to sync docs against changes since main
3. Run `git add -A` to stage any files docs-sync wrote
4. Run the `/git-stage` workflow to group staged changes and commit by concern
5. Run the `/git-branch` workflow to rename branch to match conventional format
6. Run the `/git-pr` workflow to push branch and open pull request

## After completion

Output exactly: `✅ Shipped`
