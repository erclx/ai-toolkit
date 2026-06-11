---
name: git-ship
description: Runs the full post-feature workflow by syncing docs, staging commits, renaming the branch, and opening a PR. Use after implementing a feature, or when asked to "ship", "ship this", or "ship it".
disable-model-invocation: true
---

# Ship

Run the full post-feature workflow by invoking each skill in sequence using the Skill tool. After each skill returns, invoke the next step immediately in the same response. Do not output any text between steps and do not wait for user input. Tool permission dialogs are the only interrupts allowed. The final output is `✅ Shipped`.

## Pre-check

Run `git diff --cached --name-only 2>/dev/null` to check for staged files. If output is empty and there are unstaged changes, run `git add -A` to stage everything before proceeding.

## Sequence

1. Invoke `toolkit:claude-docs` to sync internal planning docs against session decisions
2. Invoke `toolkit:docs-sync` to sync public docs against changes since main
3. Run `git add -A` to stage any files the sync skills wrote
4. Invoke `toolkit:git-stage` to group staged changes and commit by concern
5. Invoke `toolkit:git-branch` to rename branch to match conventional format
6. Invoke `toolkit:git-pr` to push branch and open pull request
7. Invoke `toolkit:claude-memory-capture` to extract durable patterns from the session into `.claude/memory/`
8. If `claude-memory-capture` wrote or updated at least one entry this session, invoke `toolkit:claude-memory-review` scoped to those entries to propose fixes while session context is fresh. If capture wrote nothing, skip this step.

Stop at the Propose phase. Do not run Apply. Promoting an entry to `CLAUDE.md` or a skill body ships as its own change, separate from this feature.

## After completion

Output up to three lines:

```plaintext
✅ Shipped
<N memories captured in .claude/memory/>
<Memory proposal at .claude/review/memory-review-<slug>.md>
```

Omit the second and third lines if `claude-memory-capture` wrote nothing this session, since no captures means no scoped review and no proposal.
