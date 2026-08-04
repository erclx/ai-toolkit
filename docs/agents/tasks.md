---
title: Tasks
description: Selecting a shipped task by stem or pull request, the refusal reasons, the board checks validate runs, and why the board root defaults to the main worktree
---

# Tasks

## Archive

`aitk tasks archive` moves a shipped task from `.claude/tasks/` into `.claude/task-archive/`, drops its row from `priority.md`, and regenerates the board index. The three run as one unit, so the attended and unattended callers cannot archive differently.

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

## Validate

`aitk tasks validate` reports what each row of `priority.md` claims against what the tree holds. It reads and never writes, because a row is a session's claim about readiness and a validator that repaired one would be asserting the claim it exists to test.

```bash
aitk tasks validate
aitk tasks validate --json
```

Four checks run. Plan and Collisions are the two halves of the `## Run now` test the board standard states. Mapping and Grouping test the folder contract and hold for every group:

| Check      | What it reports                                                                   |
| ---------- | --------------------------------------------------------------------------------- |
| Plan       | A `## Run now` row whose Plan column carries no link, or one resolving to no file |
| Mapping    | A row naming no task file, and a task file no row names                           |
| Grouping   | A task carrying a row in more than one readiness group                            |
| Collisions | Two `## Run now` rows whose Touches columns name a path in common                 |

The collision check is the one a person cannot run by eye. Paths come from the backticked spans in the Touches column, a span naming no file is dropped, and a directory collides with any file beneath it. A `## Run now` row whose column parses to nothing is reported rather than skipped, since a row stating no file set makes a claim nothing can check.

Exit codes: `0` every check passed, `1` refused, `2` at least one finding. The `reason` field carries which gate refused: `no-board`, `no-ordering`, or `no-groups`. A board grouping under headings of its own trips `no-groups` rather than being read against columns it never declared.

Columns are read from each table's own header rather than by position, so a project whose board differs from this one is reported for what it lacks. The `index`, `priority`, and `session` siblings are skipped, since none of the three is a task.

Skills branch on the findings rather than on the exit code:

```bash
aitk tasks validate --json | jq -r '.findings[] | "\(.kind): \(.subject)"'
```

For the board format, the `Pull request:` line, and the archive rules, see `.claude/standards/tasks.md`.
