---
title: Claude internal
description: Toolkit-only internal skills, the orchestrator and worker flow, and plugin discovery for local sessions
---

# Claude internal

## Overview

Owns the Claude surfaces that never leave this repo: the `aitk-*` internal skills under `.claude/skills/`, the orchestrator and worker artifacts that coordinate multi-session work, and how a local session loads the plugin. What ships to target projects lives in `.claude/context/claude-plugin.md`.

## Layout

- `.claude/skills/` owns the internal `aitk-*` skills, loaded before editing a toolkit domain and never installed into a target

## Internal skills

Internal skills live in `.claude/skills/` and are toolkit-only. They are not installed into target projects.

| Skill                | Description                                                                                            |
| -------------------- | ------------------------------------------------------------------------------------------------------ |
| `aitk-claude`        | Load before editing plugin skills, the CLAUDE.md seed, or the Claude context entries                   |
| `aitk-governance`    | Load before editing Cursor rules or stack definitions                                                  |
| `aitk-scripts`       | Load before editing scripts or sandbox scenarios                                                       |
| `aitk-snippets`      | Load before editing snippets                                                                           |
| `aitk-standards`     | Load before editing standards or docs                                                                  |
| `aitk-tooling`       | Load before editing tooling stacks or golden configs                                                   |
| `aitk-sandbox-check` | Audit changed plugin skills for missing sandbox scenario edits, user-invoked via `/aitk-sandbox-check` |

## Orchestration

Larger projects use an orchestrator session that breaks work into task files and hands each one to a worker session running in a linked worktree. The toolkit ships two artifacts to make this flow mechanical.

| Artifact                          | Author                 | Holds                                                                                     | Lifecycle                                              |
| --------------------------------- | ---------------------- | ----------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| `.claude/tasks/vXX.Y-<slug>.md`   | orchestrator           | One task with its outcomes and a test strategy. Phase labels live here.                   | Gitignored, shared across worktrees, archived on ship. |
| `.claude/plans/feature-<slug>.md` | orchestrator or worker | Files to touch with reasons, optional constraints, risks, answered questions for one task | Gitignored, shared across worktrees, archived on ship. |

Drafting flow: orchestrator writes a task file through `claude-tasks`, runs `claude-feature` to produce a plan carrying the reading list and any constraints, then hands the worker a plan slug. Worker enters a linked worktree, reads the plan, and implements. `claude-docs` moves the plan to `.claude/.tmp/plans-archive/` when the task ships and retargets the task file's `Plan:` line at it, and `claude-tasks` archives the task itself.

The origin invariant is owned by `.claude/standards/tasks.md`. What orchestration adds is that a handoff needs more than an origin, because scope lives in the plan rather than in the task file, so a task can sit on the board plan-less and gains one when it is handed out. See Boundaries in `claude-orchestrate` for the handoff rule and for the boundary that keeps tracked edits out of the main worktree.

Both artifacts are gitignored, which is what limits the board to one orchestrator at a time. A second session reads neither the other's task files nor its archives, so the two write colliding labels and archive each other's plans. `claude-orchestrate` states the constraint and holds the queue-refill sweep that keeps planned, non-conflicting tasks ahead of a free worker. `internal/snippets/orchestrator-resume.md` covers the one moment the model cannot detect on its own, which is a compaction dropping the reasoning behind the board it is about to act on.

Phase labels stay inside the task board, in both the filename and the title. They never appear in PR titles, commit messages, or git tags. See `.claude/standards/versioning.md` for the rules and the why.

## Plugin discovery

Inside the toolkit repository, Claude Code auto-discovers the plugin from `claude/.claude-plugin/plugin.json`. No flag needed.

In other repositories, pass `--plugin-dir` explicitly:

```bash
claude --plugin-dir $TOOLKIT/claude
```

Add shell aliases to avoid typing the flag each time. Set `TOOLKIT` once in `~/.zshrc` and reference it in the `clp` alias:

```zsh
TOOLKIT=~/path/to/toolkit

alias cl='claude'
alias clp='claude --plugin-dir $TOOLKIT/claude'
alias clps='clp --model sonnet'
```

For the full alias set covering resume, continue, worktree, and model shortcuts, see [Zshrc aliases for Claude Code](../../wiki/zshrc-aliases.md).

Machine provisioning is a separate concern reachable by the same word. `aitk claude setup` installs user-level Claude config at `~/.claude/` and is covered in `.claude/context/claude-plugin.md`.
