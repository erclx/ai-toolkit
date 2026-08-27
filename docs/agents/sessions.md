---
title: Sessions
description: Resolving live peer sessions to the worktree and branch each holds, the liveness confidence field, the unresolved reasons, and what the read depends on
---

# Sessions

## List

`aitk sessions list` reports every live Claude Code session on the machine with the working directory and branch it holds.

```bash
aitk sessions list
aitk sessions list --json
aitk sessions list --branch feat/parser --json
```

| Option            | Behavior                                     |
| ----------------- | -------------------------------------------- |
| `--json`          | Add a machine-readable record on stdout      |
| `--branch <name>` | Report the sessions holding this branch here |

It reads and never writes. The question it answers is which session to address when work has to reach the one holding a given branch, which a session listing cannot answer on its own.

Exit codes: `0` the roster was read, `1` refused. The refusal carries a `reason` of `no-registry` or `no-repository`.

An exit code says nothing about a call made from a session, since a shell profile may wrap the binary in a function taking its status from a later command. Read the record's `reason` rather than the exit when a skill consumes this.

## Scope and count

`--branch` scopes the match to the repository the command runs in, and refuses outside one. A branch name identifies a branch inside a repository and nothing across a machine, so an unscoped match reaches a session working in a different project, and `main` collides on every machine running two of them.

A bare run reports every repository and carries a `repository` field on each row, holding the shared git directory that a main checkout and all its linked worktrees agree on. That is what a caller filters on when it wants a scope of its own.

The match can return more than one session. Read the count rather than the first row, since nothing stops two sessions holding one branch, and a caller that treats the result as singular picks among candidates without knowing it.

## Whether a branch is already claimed

With `--branch`, the JSON record also carries `worktree` (the path of any worktree already checked out to it, or `null`), `refs` (the refs that already name the branch, the local head and the `origin` remote-tracking ref alike), and `claimed` (`true` when any of the three holds it).

Read `claimed` rather than composing the three fields by hand. A worktree can outlive the session that made it, and a session can hold a branch before any worktree exists for it. A branch sitting behind a merged pull request has neither and is taken all the same, which is the reading that was missing when a dispatcher cleared a merged branch and told a worker to build on it.

The ref read covers the local head and the remote-tracking ref, which means it sees the remote at whatever the last fetch left behind. A branch pushed from another machine since then reads absent. Closing that gap needs `git ls-remote`, and it is left open deliberately: the remote read costs 0.438s against 0.001s for the local one, on a check that runs before every dispatch.

`worktree`, `refs`, and `claimed` are `null` on a bare run with no `--branch`, since none of the three questions has a branch to answer about. A refusal (`no-registry` or `no-repository`) carries none of the keys at all, which a caller should read as unverified rather than as clear.

Two flags say which reading came up short. `sessionsReadable` is `false` when the session roster could not be read, and `refsReadable` is `false` when the ref read failed. Either one leaves `claimed` covering the readings around it alone, so a `false` there is a report that ran short of evidence rather than a report that the branch is clear. They stay separate fields because a caller told the roster failed goes and looks at the roster, and folding both into one flag would send it to the wrong place.

## Why the verb exists

A session listing reports a name, a kind, a status, and how long each session has been running. None of those names a branch. Resolving a branch to a session therefore meant ordering the roster by start time and matching it against the order the worktrees were created, which is an inference that fails whenever two sessions start inside the same minute.

Each session writes its own record on disk carrying its working directory beside its own name. This verb reads those records, so a name joins to a branch by an exact match on one file rather than by a guess across two orderings.

## What a row carries

Every row names the session, the process holding it, its working directory, and the branch checked out there. The status field repeats what the session listing reports, so a caller picking a target reads one output instead of two.

A field the record did not carry is reported as null rather than as a value, so an absent start time never reads as a session launched in 1970 and an absent identifier never reads as an empty one.

A row whose branch cannot be read is kept and marked rather than dropped. A caller has to be able to tell a session holding no branch from one the resolver never saw, and the second is the failure the verb replaces. The `unresolved` field carries the reason:

- `detached-head`: the session holds a worktree with no branch name
- `not-a-repository`: the session is working outside any git repository
- `git-unavailable`: git is not on the path, so nothing could be read

## The confidence field

Every report states how liveness was decided, on a pass as well as a failure.

`confirmed` means each row's process was matched against the start time its own record stamped at launch, so the process holding the pid is the session that wrote the file. A caller can address a row of that kind directly.

`unverified` means only that the pid answers a probe. That cannot separate the original session from an unrelated process that inherited its pid after the session ended, so the roster is a candidate list rather than an identity. Treat the mapping as inferred and open the message by naming the branch the reader is believed to hold, asking to be corrected.

The registry holds one record per session and is never pruned, so it accumulates thousands of entries. On the `unverified` path a stale record whose pid has been reused reads as live, which is why the field is reported rather than assumed.

## What the read depends on

The records live under the Claude Code configuration directory, which the verb resolves from `CLAUDE_CONFIG_DIR` and falls back to `~/.claude`. Their location, their filenames, and the fields inside them are a client implementation detail rather than a published interface, so a client change can move them. The verb reports an absent registry as a refusal rather than as a machine running no sessions, which is what surfaces the move instead of burying it in an empty roster.

The start-time comparison reads the process filesystem and exists only on some platforms. Where it does not, the verb still answers and marks the confidence, so a target without it keeps a working roster rather than losing the command.
