---
title: Tasks
description: Selecting a shipped task by stem or pull request, recording a number and closing an outcome, the refusal reasons, the board checks validate runs, and why the board root defaults to the main worktree
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

Exit codes: `0` archived, `1` refused. Every gate is a refusal rather than a warning, because `.husky/post-merge` calls this with nobody watching. The `reason` field carries which gate fired: `no-board`, `no-match`, `ambiguous`, `no-outcomes`, `open-outcomes`, `plan-unswept`, or `bad-input`.

`bad-input` covers a malformed command line, which all three task verbs answer the same way. It is separate from `ambiguous` and `no-match` because those describe the board, and a caller that passed two selectors would otherwise be sent to repair a task citation that is fine.

The board is shared scratch at the main worktree root, so `--root` defaults to the first entry of `git worktree list` rather than the working directory. A linked worktree archives against the same board every other session reads.

Skills branch on the reason rather than on the exit code:

```bash
aitk tasks archive --pull-request 673 --json | jq -r 'if .ok then .task else .reason end'
```

## Pull request

`aitk tasks pull-request` records the number a branch's pull request carries onto the task that branch closes. It adds `Pull request: #NNN` under the `Plan:`, `Groundwork:`, `Intake:`, or `Issue:` lines the task already holds, and corrects the number in place when the line exists.

Name the task by its filename stem, or by the plan its `Plan:` line points at:

```bash
aitk tasks pull-request 673 v28.1-trigger-escalation
aitk tasks pull-request 673 --plan worktree-scratch-routing --json
```

| Option          | Behavior                                           |
| --------------- | -------------------------------------------------- |
| `--plan <slug>` | Select the task whose `Plan:` line names this plan |
| `--json`        | Emit a machine-readable record on stdout           |
| `--root <path>` | Board root, defaulting to the main worktree        |

A plan is matched on the token both spellings share, so `worktree-scratch-routing`, `feature-worktree-scratch-routing`, and `.claude/plans/feature-worktree-scratch-routing.md` all select the same task. The `action` field reports `added`, `corrected`, or `unchanged`, which makes a rerun against the same number safe.

Exit codes: `0` recorded, `1` refused. The `reason` field carries `no-board`, `no-match`, or `ambiguous`. `git-pr` skips silently on those three, because each is a case where a guessed write would archive the wrong task once the branch merges.

A malformed argument refuses as `bad-input` instead, which sits outside that set on purpose. `git-pr` derives the number by slicing whatever `gh pr create` printed, so a non-numeric value is reachable, and folding it into the swallowed set would lose the number with nothing reporting it.

## Outcome

`aitk tasks outcome` marks outcomes `[x]` on a task by their position in its outcome list, counting every checkbox in file order from 1.

```bash
aitk tasks outcome v28.1-trigger-escalation --close 1 --close 3
aitk tasks outcome --plan worktree-scratch-routing --close 2 --json
```

| Option               | Behavior                                           |
| -------------------- | -------------------------------------------------- |
| `--close <position>` | Outcome to mark `[x]`, 1-based, repeatable         |
| `--plan <slug>`      | Select the task whose `Plan:` line names this plan |
| `--json`             | Emit a machine-readable record on stdout           |
| `--root <path>`      | Board root, defaulting to the main worktree        |

An outcome already closed comes back under `alreadyClosed` rather than refusing, so a rerun against the same positions changes nothing. A position past the end of the list refuses as `out-of-range`, since a caller counting wrong should hear about it rather than mark a neighbor.

Positions skip fenced blocks. A checkbox inside a sample a task displays is not an outcome the task claims, and counting one would shift every position after it. `aitk tasks archive` reads the list through the same walker, so the two verbs cannot disagree about which checkboxes are outcomes.

Exit codes: `0` closed, `1` refused. The `reason` field adds `no-outcomes`, `out-of-range`, and `bad-input` to the three above.

Both verbs exist because the write is an edit inside a file that already exists. `Edit` and `Write` refuse a main-root path from a linked worktree, and a shell stream editor is banned for in-place edits, so a verb resolving the board root in-process is the only route a skill body has. Creating a whole file needs no verb, because a heredoc through `Bash` writes it safely.

## Validate

`aitk tasks validate` reports what each row of `priority.md` claims against what the tree holds. It reads and never writes, because a row is a session's claim about readiness and a validator that repaired one would be asserting the claim it exists to test.

```bash
aitk tasks validate
aitk tasks validate --json
```

Five checks run. Plan and Collisions reach one half each of the `## Run now` test the board standard states. Mapping and Grouping test the folder contract and hold for every group. Blockers reaches the rows outside `## Run now`:

| Check      | What it reports                                                                   |
| ---------- | --------------------------------------------------------------------------------- |
| Plan       | A `## Run now` row whose Plan column carries no link, or one resolving to no file |
| Mapping    | A row naming no task file, and a task file no row names                           |
| Grouping   | A task carrying a row in more than one readiness group                            |
| Collisions | Two `## Run now` rows whose Touches columns name a path in common                 |
| Blockers   | A parked row whose blocker has stopped holding, under the kind `blocker-settled`  |

The collision check is the one a person cannot run by eye. Paths come from the backticked spans in the Touches column, a span naming no file is dropped, and a directory collides with any file beneath it. A `## Run now` row whose column parses to nothing is reported rather than skipped, since a row stating no file set makes a claim nothing can check.

The blocker check re-takes a measurement the board records once and never repeats. Two of the five blocker kinds put a fact on disk: a dependency is settled by the cited task being archived or closing every outcome, and a collision is settled by nothing under `## Run now` still holding a path the parked row names. A cited task is read out of the cell as a bare sibling link, the way the Task column spells one, so a pointer into another folder names a plan rather than a task and settles nothing. A cited task carrying no outcome box settles nothing either, since a file the check could not parse is not evidence of a finished one.

The other three kinds rest on a person's judgment, so a row neither half reached lands in a second array rather than in the findings:

```json
{
  "untested": [
    {
      "group": "Needs a plan",
      "subject": "v50.6-a-standard-no-skill-reads",
      "message": "..."
    }
  ]
}
```

An untested row is not a finding and moves no exit code. Reading a clean findings list as a clean board is the failure the array exists to prevent, and `orchestrator-parked.md` is the pass that takes those rows by hand.

Exit codes: `0` every check passed, `1` refused, `2` at least one finding. The `reason` field carries which gate refused: `no-board`, `no-ordering`, or `no-groups`. A board grouping under headings of its own trips `no-groups` rather than being read against columns it never declared.

Columns are read from each table's own header rather than by position, so a project whose board differs from this one is reported for what it lacks. The `index` and `priority` siblings are skipped, along with every pre-compaction handoff, which takes one file per session under a `session-` prefix. None of them is a task, and a handoff counted as one would be reported as a task carrying no row on every session that wrote one.

Skills branch on the findings rather than on the exit code:

```bash
aitk tasks validate --json | jq -r '.findings[] | "\(.kind): \(.subject)"'
```

For the board format, the `Pull request:` line, and the archive rules, see `.claude/standards/tasks.md`.
