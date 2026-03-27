---
name: git-ship
description: Runs the full post-feature workflow in sequence: sync docs, stage and commit, rename branch, and open PR. Use after implementing a feature, or when asked to "ship", "ship this", or "ship it".
disable-model-invocation: true
---

# Ship

Run the full post-feature workflow by invoking each skill in sequence using the Skill tool. After each skill returns, invoke the next step immediately in the same response. Do not output any text between steps and do not wait for user input. Tool permission dialogs are the only interrupts allowed. The final output is `✅ Shipped`.

## Pre-check

Run `git diff --cached --name-only 2>/dev/null` to check for staged files. If output is empty and there are unstaged changes, run `git add -A` to stage everything before proceeding.

## Sequence

1. Invoke `toolkit:docs-sync` to sync docs against changes since main
2. Run `git add -A` to stage any files docs-sync wrote
3. Invoke `toolkit:git-stage` to group staged changes and commit by concern
4. Invoke `toolkit:git-branch` to rename branch to match conventional format
5. Invoke `toolkit:git-pr` to push branch and open pull request

## After completion

Output exactly: `✅ Shipped`
