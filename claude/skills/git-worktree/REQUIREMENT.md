---
name: git-worktree
description: What worktree listing and cleanup is for, the gaps it closes, and why entry lives elsewhere
---

# Git worktree requirement

## Gap

Without this skill, linked worktrees accumulate past the point where any of them is remembered. Merge state does not appear in the worktree list, so a cleanup either removes a worktree still holding unmerged work or, lacking a way to tell, removes nothing. Removing a worktree also leaves its local branch behind, so the branch list keeps growing even when cleanup runs.

## Must

- Resolve merge state per branch from the pull request first, and fall back to local ancestry when no pull request exists
- Match the ancestry fallback against the branch name alone. `git branch --merged` decorates the current branch and every branch checked out in a linked worktree, which is the whole set this skill enumerates.
- Remove the worktree and its local branch together, since either one left alone is the state the skill exists to prevent
- Exclude four kinds of row from the remove set: the main root, the current session's worktree, any dirty tree, and any worktree registered from outside the path prefix `claude-worktree` creates under
- Give every skipped row a one-word reason, so the skip is a decision the user can overturn rather than a silence
- Pick exactly one mode. Listing and removing are different requests and inferring both from one invocation removes worktrees the user meant to read about.

## Must not

- Enter or create a worktree. The description states the boundary so the model routes entry elsewhere rather than discovering it here.
- Remove a worktree with uncommitted work, whatever its merge state
- Remove the worktree the session is currently running in
- Emit anything after the result line

## Guards

- Not a git repository: stop
- Remove set is empty: stop and say why every row was held back

## Out of scope

- Entering a worktree, which `claude-worktree` owns. That skill derives the name and aligns the branch, and this one never creates.
- Deciding which features can run in parallel, which is a planning call rather than a git operation
- The pull request lifecycle, which `git-pr` and `git-followup` own. This skill reads pull request state and never writes it.
