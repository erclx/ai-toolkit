---
title: Tasks
description: Selecting a shipped task by stem or pull request, the refusal reasons, and why the board root defaults to the main worktree
---

# Tasks

`aitk tasks archive` moves a shipped task from `.claude/tasks/` into `.claude/.tmp/task-archive/`, drops its row from `priority.md`, and regenerates the board index. The three run as one unit, so the attended and unattended callers cannot archive differently.

Name the task by its filename stem, or by the pull request it carries:

```bash
aitk tasks archive v28.1-trigger-escalation
aitk tasks archive --pull-request 673 --json
```

| Option               | Behavior                                                     |
| -------------------- | ------------------------------------------------------------ |
| `--pull-request <n>` | Select the task whose `Pull request:` line names this number |
| `--json`             | Emit a machine-readable record on stdout                     |
| `--root <path>`      | Board root, defaulting to the main worktree                  |

Exit codes: `0` archived, `1` refused. Every gate is a refusal rather than a warning, because `.husky/post-merge` calls this with nobody watching. The `reason` field carries which gate fired: `no-board`, `no-match`, `ambiguous`, `no-outcomes`, `open-outcomes`, or `plan-unswept`.

The board is shared scratch at the main worktree root, so `--root` defaults to the first entry of `git worktree list` rather than the working directory. A linked worktree archives against the same board every other session reads.

Skills branch on the reason rather than on the exit code:

```bash
aitk tasks archive --pull-request 673 --json | jq -r 'if .ok then .task else .reason end'
```

For the board format, the `Pull request:` line, and the archive rules, see `.claude/standards/tasks.md`.
