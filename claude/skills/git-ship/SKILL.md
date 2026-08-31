---
name: git-ship
description: Runs the full post-feature workflow by syncing docs, staging commits, renaming the branch, and opening a PR. Use after implementing a feature, or when asked to "ship", "ship this", or "ship it". Do NOT auto-trigger. Shipping is a decision the user takes.
---

# Ship

Run the full post-feature workflow by invoking each skill in sequence using the Skill tool. After each skill returns, invoke the next step immediately in the same response.

Do not output any text between steps and do not wait for user input. Tool permission dialogs are the only interrupts allowed. The final output is `✅ Shipped`, unless a wrapping caller states it closes on its own block, which `claude-autoship` does.

## Verify

Run the verify commands `CLAUDE.md` names (lint, typecheck, tests) before the sequence starts. On a failure, stop: `❌ Verify failed. Fix the reported errors and run /git-ship again.` Make no fix attempt. This skill is the resume point after a stop, so the fix is the one the user is already making.

When `CLAUDE.md` names no verify command, say so on one line and continue. A project with no suite is not a project with a failing one.

Verify runs ahead of the sync skills so a stop leaves the tree exactly as the user left it. Re-running a suite the caller already ran costs one command, and the path it closes is the one that has no other guard: `claude-autoship` verifies at its own Step 3 and then hands four of its stop points straight back here, so a fix made by hand after one of those stops otherwise reaches the remote with nothing re-run.

## Pre-check

Run `git diff --cached --name-only 2>/dev/null` to check for staged files. If output is empty and there are unstaged changes, run `git add -A` to stage everything before proceeding.

## Sequence

1. Invoke `canon:claude-memory-capture` to route what this session learned to the context entries that own it and write the residue to `.claude/memory/`
2. Invoke `canon:claude-docs` to sync internal planning docs against session decisions, folding in the routed facts
3. Invoke `canon:docs-sync` to sync public docs against changes since main
4. Run `git add -A` to stage any files the sync skills wrote
5. Invoke `canon:git-stage` to group staged changes and commit by concern
6. Invoke `canon:git-branch` to rename branch to match conventional format
7. Invoke `canon:git-pr` to push branch and open pull request
8. After the PR opens, watch CI. Poll `gh pr checks <number>` until no check is pending, then read the final status. On all-pass, continue. On any failure, stop the sequence and report the failing check with its URL. Do not auto-fix. This step may output on failure, the one exception to the no-text-between-steps rule.
9. If step 1 wrote or updated at least one memory file, invoke `canon:claude-memory-review` scoped to those entries to propose fixes while session context is fresh. If the pen got nothing, skip this step.

A caller wrapping this sequence may act between step 7 and step 8, which is the one gap the order leaves open, since the pull request exists there and nothing has read its checks yet. `claude-autoship` marks the pull request draft in it. Nothing else may go there, and a caller that needs a step anywhere else in the sequence is asking for a change to this body rather than for a place to stand.

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

Emit nothing here when a wrapping caller states it closes on its own block. `claude-autoship` is that caller and its block carries these same three trailing lines above a first line naming the draft state, so emitting both reports one run twice. A caller that states no such thing gets this block, which is every direct invocation.
