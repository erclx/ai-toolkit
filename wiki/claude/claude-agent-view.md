---
title: Claude Code agent view
description: Managing background sessions, their groups, peek and attach, filter syntax, pinning, the shell verbs beside the view, and its operational limits
---

# Claude Code agent view

Agent view is the terminal surface that lists and manages background Claude Code sessions, opened with `claude agents` or reached automatically from a session sent to the background. Each row is a full independent session with its own conversation, transcript, and quota, dispatched with `claude --bg "<task>"` or by sending the current one to the background with `/bg`.

Source: Anthropic, in the [agent view docs](https://code.claude.com/docs/en/agent-view.md), read 2026-08-27.

## What it manages and what it does not

Agent view covers background sessions exclusively. A subagent spawned through the `Agent` tool has no equivalent view: it runs inside its parent's context and shows up only in that parent's own transcript, sharing the parent's quota rather than drawing its own.

Trading a background session for an `Agent` tool call does not gain a pane. It loses the one background dispatch already has, in exchange for the independence a subagent does not carry. See [Claude Code subagents](claude-subagents.md) for what that channel looks like instead.

## Groups a row falls into

Agent view sorts rows with the most urgent state at the top:

| Group            | Meaning                                                    |
| ---------------- | ---------------------------------------------------------- |
| Pinned           | Explicitly pinned. The process keeps running while idle.   |
| Needs input      | Blocked on an approval, an answer, or a permission prompt. |
| Working          | Actively running tools or generating.                      |
| Ready for review | Idle and awaiting interaction. The process has exited.     |
| Completed        | Finished successfully.                                     |
| Failed           | Ended with an error.                                       |
| Stopped          | Stopped by `Ctrl+X`, `/stop`, or `claude stop`.            |

A `∙` marker on a row means its process has exited and the session resumes on next interaction rather than responding immediately. `✢` marks a `/loop` session sleeping between runs, showing its run count and the countdown to the next one.

## Opening, replying to, and leaving a row

`Space` on a row opens a peek panel: full status, linked pull requests, and how long it has been waiting, without attaching. A reply typed there, or a numbered choice picked with `1`–`9`, reaches the session while the panel stays open, and `↑`/`↓` moves the peek to an adjacent row.

`Enter` or `→` attaches, opening the session as a normal interactive `claude` session with every command and shortcut available, plus a recap of what happened while detached. `←` on an empty prompt, or `Ctrl+Z`, detaches back to agent view without stopping the session. `Ctrl+C` twice exits to the shell entirely.

## Filter syntax

Typing in the dispatch input filters the row list, and filters compose:

| Filter         | Narrows to                                                    |
| -------------- | ------------------------------------------------------------- |
| `a:<name>`     | sessions running a named agent or subagent                    |
| `s:<state>`    | sessions in a given state, such as `s:working` or `s:blocked` |
| `#1234`        | the session working on pull request #1234                     |
| a URL          | the session whose first prompt contained it                   |
| any other text | a fuzzy match on session names                                |

Clearing the input returns to the full list.

## Pinning against cleanup

`Ctrl+T` on a row toggles pinning. A pinned session moves to the Pinned group and keeps its process running while idle, which is what keeps it from being reclaimed by the idle timeout below.

## Shell verbs beside the view

Every row-level action has a non-interactive counterpart:

- `claude agents --json`: list every session as JSON and exit, for a script that reads state without opening the view
- `claude attach <id>`: open a session in the terminal, equivalent to `→` on its row
- `claude logs <id>`: print its recent output without attaching
- `claude stop <id>` (alias `claude kill <id>`): stop it
- `claude respawn <id>`: restart it with its conversation intact, rather than starting a fresh session over. `claude respawn --all` restarts every running session.
- `claude rm <id>`: remove it from the list and delete its worktree

A stopped session is not a session to relaunch from scratch. `respawn` picks the conversation back up, which is the verb to reach for before rebuilding a worker's context by hand.

## Operational limits

A session with no activity for roughly an hour has its process exit to free resources, unless pinned. Its state persists on disk and the session resumes on the next interaction, but it stops responding immediately in the meantime. Pinning is the only way to keep a session warm past that window.

Each background session draws subscription quota independently of the account's other usage, including a small per-turn request on a Haiku-class model to generate its row summary. Running several sessions at once multiplies that draw by however many are live, which is the real cost of a wave of dispatched work rather than any shortcut in the view itself.

## Related

- [Claude Code subagents](claude-subagents.md) for the in-process channel this view does not cover
- [Claude Code and git worktrees](claude-worktrees.md#background-sessions) for how a background session's working directory relates to a worktree
- [Claude Code sessions](claude-sessions.md) for discovering and messaging a peer session from inside another one
