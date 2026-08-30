---
title: Targets
description: The projects this toolkit installed into, the record the install writes against the sweep that backs it, what bounds each answer, and the cross-target pull request read
---

# Targets

## List

`aitk targets list` reports the projects this toolkit has installed into, with where each answer came from.

```bash
aitk targets list
aitk targets list --json
aitk targets list --sweep ~/repos --json
```

| Option            | Behavior                                                |
| ----------------- | ------------------------------------------------------- |
| `--json`          | Add a machine-readable record on stdout                 |
| `--sweep <path…>` | Also walk these roots for targets the record never held |
| `--depth <n>`     | How deep below each swept root to walk, defaulting to 4 |

Exit codes: `0` the population was read, `1` refused. A refusal carries a `reason` of `bad-depth`, and an absent index reports as unknown rather than as no targets.

An exit code says nothing about a call made from a session, since a shell profile may wrap the binary in a function taking its status from a later command. Read the record's fields rather than the exit when a skill consumes this.

## Where the answer comes from

Every sync that stamps a target records it in a machine-level index at `$XDG_STATE_HOME/aitk/targets.json`, falling back to `~/.local/state/aitk/targets.json`. A project installed into since that shipped is therefore known without anyone naming it, and each row carries `stampedAt` from the sync that last touched it.

`--sweep` walks the roots given and finds what the record never held, which is every target installed before the index existed. A row says which of the two found it, and a row the record knows keeps that source even when the sweep reaches it too.

The record is the primary source and the sweep is the fallback, because they fail in opposite directions. A record only knows an install that ran after it shipped. A walk only knows the paths someone thought to name, which is how a hand census of this population was wrong in both directions at once: it counted two folders that had never been targets, counted one clone of a target already counted, and missed the clone a repair had actually run in.

## What bounds a sweep

A `--sweep` run carries a `bound` object naming the roots walked, the depth, the folders the walk stopped at on reaching the cap, and the roots it could not read. Read it before treating a count as the population.

The bound a sweep can never state is the machine. It reads this one, so a target on another machine or under a path nobody named is outside every answer it gives. That is the same limit the hand census had, and the record above is what closes it going forward rather than the sweep.

`--depth` refuses anything that is not a whole number rather than falling back to the default. A value that is not one leaves every depth test false, so the walk runs to the bottom of its root while the bound claims a cap it never applied.

## A project held in more than one clone

A target cloned twice is one target. The sweep reads each checkout's `origin`, trims it to a form an ssh URL and an https URL of one repository agree on, and reports a single row holding every path.

The row leads with the clone the record knows, because the record only names one a sync actually ran in. Every caller reading a single path takes the first, and picking that by sort order is the shape behind a repair that ran in one clone while a count was taken against another, leaving the target reported as untouched.

Nothing removes a row. A project deleted, moved, or that dropped the toolkit stays in the index, so a count drifts upward over time. It surfaces on use rather than silently, since the read below refuses a path it cannot open.

## Pulls

`aitk targets pulls` reports, per target, every open pull request with its checks and the heading its newest review pass carries.

```bash
aitk targets pulls
aitk targets pulls ../caret ../stackr --json
```

Naming paths reads those and looks up nothing. Naming none reads every target `aitk targets list` reports. One clone per project is read, since two checkouts sharing an origin answer the same query and reading both spends the rate limit to print one answer twice.

Exit codes: `0` at least one target was read, `1` refused or every target refused.

| Field            | Holds                                                                   |
| ---------------- | ----------------------------------------------------------------------- |
| `checks`         | `passing`, `failing`, `pending`, or `null` when GitHub reported none    |
| `review`         | `open`, `closed`, or `null` when no pass has landed                     |
| `reviewReadable` | `false` when the review query failed, leaving `review` covering nothing |

`checks` is `null` rather than `passing` when no check ran at all, which is not the same answer. A failure outranks a run still going, since a job that already failed cannot be cleared by one still in flight.

`review` reads the first line of the newest pass carrying `## Review` or `## Review closed`, which `claude-pr-review` owns and posts. A target leaves a wave on `closed` rather than on a worker's reply.

A target that could not be read carries a `reason` rather than an empty pull list. Reading a failed query as no open work is what reports a target as done having read nothing, which is the failure mode of the hand-written shell loop this replaces.

| Reason            | Means                                                  |
| ----------------- | ------------------------------------------------------ |
| `not-a-directory` | the path is not a directory, so nothing was read there |
| `gh-unavailable`  | `gh` is not on the path                                |
| `list-failed`     | the open pull request list could not be read           |

The reads run one target at a time. They share one GitHub API quota, and a wave firing a dozen at once meets the secondary rate limit rather than an answer.
