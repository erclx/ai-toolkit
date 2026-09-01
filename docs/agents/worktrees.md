---
title: Worktrees
description: Reporting which worktrees are reclaimable, removing the ones that are, why the reading keys on the pull request rather than on git ancestry, the refusals it names, and the two removal shapes
---

# Worktrees

## List

`canon worktrees list` reports every worktree of the current repository with a reclaim verdict and the reason behind it.

```bash
canon worktrees list
canon worktrees list --json
```

| Option   | Behavior                                |
| -------- | --------------------------------------- |
| `--json` | Add a machine-readable record on stdout |

It reads and removes nothing. The question it answers is which worktrees the work has finished with, which nothing in the loop asks: a worktree is created per feature and removed by nobody, so directories left by shipped work accumulate for the life of the checkout.

Exit codes: `0` every worktree was read, `1` refused. The refusal carries a `reason` of `gh-missing`, `gh-failed`, or `sessions-unreadable`.

An exit code says nothing about a call made from a session, since a shell profile may wrap the binary in a function taking its status from a later command. Read the record's `reason` rather than the exit when a skill consumes this.

## Reclaim

`canon worktrees reclaim` removes every worktree the reading above called reclaimable, and the branch behind each one.

```bash
canon worktrees reclaim --dry-run
canon worktrees reclaim
```

| Option      | Behavior                                    |
| ----------- | ------------------------------------------- |
| `--dry-run` | Report what would be removed without acting |

Removal sits on the default path rather than behind an apply flag. Report-only is what the `list` verb already did, and what it produced was a hand cleanup: eight directories deleted outside git in one afternoon, each leaving the registration and the branch that `git worktree remove` would have taken with it. A flag a reader has to remember is one nobody passes the first time, and the first time is when the directories are still there.

Each entry unlocks, removes, then deletes its branch, and the sequence is the same whether the directory still stands or is already gone. A run carrying a directory that is gone sweeps stale registrations once between the removals and the branch deletes, since a branch git still reads as held by a worktree cannot be deleted. That sweep is the one step reaching past the reclaimable set, because git takes no path to scope it: it clears the bookkeeping for every directory already gone, refused entries included, and deletes no branch and no directory of its own.

Exit codes: `0` every reclaimable worktree was removed or there were none, `1` refused or a removal failed. A reading that could not reach the merge state refuses every entry rather than falling back to a default, since that state is the one input deciding whether a branch is safe to delete.

## What makes a worktree reclaimable

All three hold: its branch has a merged pull request, its working tree is clean, and no live session holds the directory. Each alone has a case where removal loses something, so `refusals` names every failing condition rather than the first.

| Refusal                  | What it means                                           |
| ------------------------ | ------------------------------------------------------- |
| `main-worktree`          | The main worktree, which is never reclaimable           |
| `current-worktree`       | The worktree the command is running in                  |
| `detached-head`          | No branch, so nothing names a pull request              |
| `no-merged-pull-request` | Its branch has no merged pull request                   |
| `uncommitted-changes`    | Work no history stands behind, untracked files included |
| `unreadable-worktree`    | The working tree status could not be read               |
| `held-by-session`        | A live session still holds the directory                |

Uncommitted work is the condition that gates rather than warns. A worktree is gitignored scratch with no history behind it, so a directory removed with unstaged changes takes them somewhere nothing recovers.

A directory already deleted by hand is clean rather than unreadable, so the merged and session checks decide it like any other worktree. Reading the two together is what reported eight reclaimable worktrees as unreadable, since `git status` exits the same way for a path that is gone and one it could not read.

The worktree the command runs in refuses on position rather than on state. Git removes the directory a caller is standing in without complaint, and every later call scoped to that directory then fails, so a run that took it would leave the branches after it undeleted and report the failures against the worktrees rather than the cause.

## Why the pull request rather than git ancestry

Ancestry is the reading anyone reaches for and it fails in both directions on a repository that squash merges. A merged branch is never an ancestor of the trunk there, so `git merge-base --is-ancestor` calls shipped work unmerged. Measured against nine worktrees, it named five of six lingering branches unmerged, each of which had a merged pull request, reporting them 2 to 6 commits ahead.

The one branch it did call merged was the one that had to stay. That branch had no pull request at all, sat at a release commit, and its worktree held finished work outside any commit. So the cheap test kept every directory safe to remove and offered the only one that was not.

The read is one `gh pr list --state merged` for the whole repository rather than one call per worktree, which would be a network round trip inside a loop. It covers the most recent 200 merges, so a worktree older than that reads as having none and is refused, which fails in the direction that keeps a directory.

## Two removal shapes

`route` names which one applies rather than choosing it, since picking wrong strands state.

- `session`: a live session holds the directory, and `claude rm <name>` removes the session and its worktree together. The `sessions` field carries the names, and a name is whatever string the session was launched under, spaces included, so quote it.
- `worktree`: the session has ended, and `canon worktrees reclaim` is what runs the remove and the branch delete.
- `null`: the main worktree, which no removal shape reaches.

A held worktree is refused rather than reported reclaimable, and its route is reported for whoever decides to act on it. Deleting a directory underneath a live session is the case that has to refuse.

## What an unreadable input does

It refuses the whole report rather than producing verdicts around the gap. An absent merge state and a branch with no merged pull request return the same empty answer, and so do an absent session roster and a worktree nobody holds. Reporting the second when it was the first is a false clean, and here that ends in a removal rather than in a warning.
