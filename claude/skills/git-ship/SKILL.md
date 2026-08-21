---
name: git-ship
description: Runs the full post-feature workflow by syncing docs, staging commits, renaming the branch, and opening a PR. Use after implementing a feature, or when asked to "ship", "ship this", or "ship it".
disable-model-invocation: true
---

# Ship

Run the full post-feature workflow by invoking each skill in sequence using the Skill tool. After each skill returns, invoke the next step immediately in the same response.

Do not output any text between steps and do not wait for user input. Tool permission dialogs are the only interrupts allowed. The final output is `✅ Shipped`.

## Pre-check

Run `git diff --cached --name-only 2>/dev/null` to check for staged files. If output is empty and there are unstaged changes, run `git add -A` to stage everything before proceeding.

## Sequence

1. Invoke `aitk:claude-memory-capture` to route what this session learned to the context entries that own it and write the residue to `.claude/memory/`
2. Invoke `aitk:claude-docs` to sync internal planning docs against session decisions, folding in the routed facts
3. Invoke `aitk:docs-sync` to sync public docs against changes since main
4. Run `git add -A` to stage any files the sync skills wrote
5. Invoke `aitk:git-stage` to group staged changes and commit by concern
6. Invoke `aitk:git-branch` to rename branch to match conventional format
7. Invoke `aitk:git-pr` to push branch and open pull request
8. After the PR opens, watch CI. Poll `gh pr checks <number>` until no check is pending, then read the final status. On all-pass, continue. On any failure, stop the sequence and report the failing check with its URL. Do not auto-fix. This step may output on failure, the one exception to the no-text-between-steps rule.
9. If step 1 wrote or updated at least one memory file, invoke `aitk:claude-memory-review` scoped to those entries to propose fixes while session context is fresh. If the pen got nothing, skip this step.

Capture leads the sequence because a routed fact lands in a context entry, which is a tracked file. Running it after the pull request opens leaves that edit off the branch entirely, so the fact reaches nothing. Memory files are gitignored either way, which is what hid the ordering while capture wrote only those.

Stop at the Propose phase. Do not run Apply. Promoting an entry to `CLAUDE.md` or a skill body ships as its own change, separate from this feature.

## After completion

Output up to four lines:

```plaintext
✅ Shipped
<N facts routed to context entries>
<N memories captured in .claude/memory/>
<Memory proposal at .claude/review/memory/memory-review-<slug>.md>
```

Omit the second line if nothing routed. Omit the third and fourth if `claude-memory-capture` wrote no memory file this session, since an empty pen means no scoped review and no proposal.
