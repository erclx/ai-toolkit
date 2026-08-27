---
title: Worktrees
description: Reporting which worktrees are reclaimable, why the reading keys on the pull request rather than on git ancestry, the refusals it names, and the two removal shapes
---

# Worktrees

## List

`aitk worktrees list` reports every worktree of the current repository with a reclaim verdict and the reason behind it.

```bash
aitk worktrees list
aitk worktrees list --json
```

| Option   | Behavior                                |
| -------- | --------------------------------------- |
| `--json` | Add a machine-readable record on stdout |

It reads and removes nothing. The question it answers is which worktrees the work has finished with, which nothing in the loop asks: a worktree is created per feature and removed by nobody, so directories left by shipped work accumulate for the life of the checkout.

Exit codes: `0` every worktree was read, `1` refused. The refusal carries a `reason` of `gh-missing`, `gh-failed`, or `sessions-unreadable`.

An exit code says nothing about a call made from a session, since a shell profile may wrap the binary in a function taking its status from a later command. Read the record's `reason` rather than the exit when a skill consumes this.

## What makes a worktree reclaimable

All three hold: its branch has a merged pull request, its working tree is clean, and no live session holds the directory. Each alone has a case where removal loses something, so `refusals` names every failing condition rather than the first.

| Refusal                  | What it means                                           |
| ------------------------ | ------------------------------------------------------- |
| `main-worktree`          | The main worktree, which is never reclaimable           |
| `detached-head`          | No branch, so nothing names a pull request              |
| `no-merged-pull-request` | Its branch has no merged pull request                   |
| `uncommitted-changes`    | Work no history stands behind, untracked files included |
| `unreadable-worktree`    | The working tree status could not be read               |
| `held-by-session`        | A live session still holds the directory                |

Uncommitted work is the condition that gates rather than warns. A worktree is gitignored scratch with no history behind it, so a directory removed with unstaged changes takes them somewhere nothing recovers.

## Why the pull request rather than git ancestry

Ancestry is the reading anyone reaches for and it fails in both directions on a repository that squash merges. A merged branch is never an ancestor of the trunk there, so `git merge-base --is-ancestor` calls shipped work unmerged. Measured against nine worktrees, it named five of six lingering branches unmerged, each of which had a merged pull request, reporting them 2 to 6 commits ahead.

The one branch it did call merged was the one that had to stay. That branch had no pull request at all, sat at a release commit, and its worktree held finished work outside any commit. So the cheap test kept every directory safe to remove and offered the only one that was not.

The read is one `gh pr list --state merged` for the whole repository rather than one call per worktree, which would be a network round trip inside a loop. It covers the most recent 200 merges, so a worktree older than that reads as having none and is refused, which fails in the direction that keeps a directory.

## Two removal shapes

`route` names which one applies rather than choosing it, since picking wrong strands state.

- `session`: a live session holds the directory, and `claude rm <name>` removes the session and its worktree together. The `sessions` field carries the names, and a name is whatever string the session was launched under, spaces included, so quote it.
- `worktree`: the session has ended, and `git worktree remove` with a branch delete is the pair.
- `null`: the main worktree, which no removal shape reaches.

A held worktree is refused rather than reported reclaimable, and its route is reported for whoever decides to act on it. Deleting a directory underneath a live session is the case that has to refuse.

## What an unreadable input does

It refuses the whole report rather than producing verdicts around the gap. An absent merge state and a branch with no merged pull request return the same empty answer, and so do an absent session roster and a worktree nobody holds. Reporting the second when it was the first is a false clean, and here that ends in a removal rather than in a warning.
