---
title: Tasks reference
description: Folder layout, filename convention, readiness groups, and content rules for .claude/tasks/
---

# Tasks reference

Applies to `.claude/tasks/`. Tracks what is being built and why, at the level of features and outcomes. One file per task. Update when a task starts, completes, or changes scope. When to open a task at all is project policy, not a shape rule, and lives in `CLAUDE.md`.

The folder is gitignored. Board state changes when work ships rather than when a branch is written, so committing it would put a claim about the future into the diff of an unrelated pull request. The git log records what shipped.

## Scope

Governs the task board under `.claude/tasks/`: folder layout, filenames, frontmatter, file format, origin lines, execution ordering, and archiving.

Does not govern:

- The plan file a task cites, its sections, and its answer contract: `plan.md`
- Phase-label format and which surfaces a label may appear on: `versioning.md`
- Sequencing across versions and why the order is what it is: `roadmap.md`
- Architectural reasoning that outlives a task: `architecture.md`
- When a project opens a task at all, which is project policy rather than a shape rule

## Layout

```plaintext
.claude/tasks/
├── index.md              ← generated, never hand-edited
├── priority.md           ← hand-maintained execution order
├── session.md            ← optional, what a compaction is about to destroy
├── v09.0-sync-paths.md
└── v13.0-toolkit-drift.md
```

One file per task is what keeps the board safe under parallel sessions. Two sessions working different tasks never write the same file, which matters because a gitignored board has no history to recover a clobbered write from.

Three siblings sit in the folder without being tasks, and each earns its place by being governed somewhere. `index.md` and `priority.md` are governed here. `session.md` is the pre-compaction handoff, written by `orchestrator-handoff` and read by `orchestrator-resume`, and it is optional: a project running no orchestrator carries no such file. Anything reading the folder as a task list skips all three, so a name outside the set is a task whatever it holds.

`index.md` is generated from sibling frontmatter. The folder is gitignored, so the whole-repo index walk skips it and a hook passing the changed path regenerates it instead. Never hand-edit it.

The `claude-tasks` skill creates and archives task files. `claude-docs` marks outcomes `[x]` in an existing file and sweeps the plans those tasks cite. Neither does the other's job.

## Ordering

`priority.md` carries execution order and what each task is waiting on. The generated index sorts by filename and says nothing about order, so without this file board state gets reconstructed by hand every session. Why the order is what it is belongs in `.claude/ROADMAP.md`, which is committed because that rationale has no substitute record.

Group tasks by readiness rather than by status, one row per task, under the columns each group fixes below. Keep it to links and blockers: tables, plus at most one sentence per section. A paragraph in `priority.md` is a defect whatever it says. Stating the shape this way is what lets a single diff fail, since a size cap only trips after the fact and every addition looks defensible on its own.

Readiness is three groups under fixed headings, `## Run now`, `## Up next`, and `## Needs a plan`, in that order. The names are the contract rather than a suggestion, because a board grouped by readiness under names of its own satisfies every other rule here and still reads as empty to anything counting rows under a heading. Add no fourth group. A task belongs to exactly one, and the tests are read in order.

- `## Run now`: a written plan covers every open outcome, and the files the task touches collide with nothing already running. A worker is handed a task from this group alone.
- `## Up next`: a written plan exists, and the task either collides with something running or waits on another task to land. The blocker column names which.
- `## Needs a plan`: everything else. The task has no plan, or the plan it carries no longer describes the work.

Each group fixes its own columns, which follow from the test above it rather than from preference. Neither half of the `## Run now` test is checkable without the file set and the plan sitting beside the task. The blocker column under `## Up next` names whether a collision or a dependency holds the row. `## Needs a plan` states no file set at all, because a task with no plan has no bounded one to state. A group with no rows keeps its heading and its header row.

`aitk tasks validate` reads those columns and reports where a row's claim and the tree disagree: a plan pointer resolving to no file, a row and a task file that do not map one to one, a task in two groups, and two `## Run now` rows touching a path in common. Run it when the readiness claim is made rather than on a schedule, since the board is gitignored per-machine scratch and no shared moment exists to hang it on. It reports and never writes, so a session fixes the row it names.

```markdown
---
title: Priority
description: One line on what the board covers
---

# Priority

## Run now

| Task                            | Touches                 | Plan                                 |
| ------------------------------- | ----------------------- | ------------------------------------ |
| [vXX.Y <slug>](vXX.Y-<slug>.md) | <what the task touches> | [<slug>](../plans/feature-<slug>.md) |

## Up next

| Task | Touches | Waiting on |
| ---- | ------- | ---------- |

## Needs a plan

| Task                            | Waiting on                              |
| ------------------------------- | --------------------------------------- |
| [vXX.Y <slug>](vXX.Y-<slug>.md) | <the collision or the task it waits on> |
```

The tests live here so the board does not carry them. Writing them as a sentence under each heading produces the paragraph the rule above deletes, and a criterion with no home gets restated from memory every time the board is touched.

## Filenames

`vXX.Y-<slug>.md`, where the version is the phase label zero-padded to two digits and the slug is kebab-case.

Padding is load-bearing. Index entries sort by filename and nothing else, so a bare `v9.0` sorts after `v15.0` and the catalog reads out of board order. `standards/versioning.md` governs the label itself and permits free renumbering, so expect the occasional rename. Nothing points at a task filename, since a `Plan:` line runs from task to plan rather than the reverse.

## Frontmatter

Every task file carries both fields. The index walker fails the whole folder when one is missing, which surfaces the gap on the next edit.

```yaml
---
title: 'v13.0: Detect and close toolkit drift in target projects'
description: Record what a target installed and report the delta against the toolkit
---
```

- `title`: the phase label and the task title, matching the H1. Quote it, since a leading `vX.Y:` reads as a key to a YAML parser.
- `description`: what the task achieves, in one line. A session reads this in the index to decide whether to open the file.

## File format

Two headings, `## Outcomes` and `## Findings`. Outcomes are future and checkable, findings are past and factual, and as flat bullets at the same indent they are visually identical. A heading separates them at no cost. Add no third heading. Status stays inline on an outcome rather than becoming an "In progress" section.

Size the outcomes so one pull request closes all of them. A task whose outcomes span two pull requests ships the first half and leaves the rest open, with nothing recording which outcomes the merged work covered, so the board reads as in-progress work that no branch is carrying. Split the task before handing it off rather than after. This is what `## Archiving` below depends on, since a task closes whole or not at all.

Prefix the H1 with the `vX.Y:` phase label, then a short title whose form depends on the task type:

- Feature: an outcome describing what the user can now do
- Fix: a problem statement describing what is wrong
- Chore: an imperative describing what is being done

```markdown
---
title: 'vX.Y: Title'
description: One line on what this task achieves
---

# vX.Y: Title

Plan: [feature-<slug>](../plans/feature-<slug>.md)
Groundwork: [<slug>](../groundwork/<slug>/)
Intake: [<slug>](../intake/<slug>/)
Issue: #NNN
Pull request: #NNN

Why this task exists and what it depends on.

## Outcomes

- [ ] Outcome: what done looks like
- [ ] Outcome: what done looks like

## Findings

- What constrains the task, dated where it matters.

> Test strategy: <unit | component | e2e | visual | manual>, what is being verified
```

## Origin

Every task names where it came from, through a `Plan:`, `Groundwork:`, `Intake:`, or `Issue:` line under the title. Include each only when the file, folder, or issue it names exists.

A task with no origin is either lost context or work nobody decided to do. The invariant runs both ways, and the second direction is the one that bites: a groundwork track or an open issue that no task points at is work already decided and on its way to being forgotten. An intake folder is exempt from that direction, since it dispositions many items at once and most of them close without ever becoming a task.

`Plan:`, `Groundwork:`, and `Intake:` name their target as a markdown link whose text is the file or folder stem, so the line resolves on a ctrl-click the way `priority.md` rows already do. Write the path relative to `.claude/tasks/`, which makes it `../plans/`, `../groundwork/`, and `../intake/`. A path written from the project root renders as a link and resolves to nothing in an editor rooted at the project. `Issue:` stays a bare `#NNN`, since an issue number is not a path and a full URL would write the remote into a gitignored file.

Phase-label format and where labels may appear are governed by `standards/versioning.md`.

`Plan:` points at `../plans/feature-<slug>.md` while the task is open. Once the task ships and the plan is archived, it points at `../plans-archive/feature-<slug>.md`. Retarget both halves of the link rather than dropping it, so a completed task still leads to the reasoning behind it. A project that archived plans before the folder moved out of `.claude/.tmp/` holds closed tasks pointing at `../.tmp/plans-archive/`, and both forms resolve against the files each names, so leave those pointers where they are. Nothing migrates them, and a task retargeted without its plan moving leads nowhere. One plan per task. A plan cited by two tasks is a misfile rather than a shape to design for, which is why the sweep counts citations before archiving: the count is a guard against the misfile stranding a pointer, not support for the shape.

`Groundwork:` points at `../groundwork/<slug>/`, the folder `claude-groundwork` fills. It names the surface it points at the way `Plan:` does. Use this key alone. `Research record` and `Decision record` are earlier spellings of the same thing and both convert to it.

`Intake:` points at `../intake/<slug>/`, the folder an intake pass fills. Use it rather than `Groundwork:`, because a groundwork track measures one question in depth while an intake dispositions many across a tree, and one key covering both loses which kind of pass produced the task. The line names the folder rather than an item inside it. A task routinely promotes several items at once, so an anchored line would name one and drop the rest, and the item numbers belong in that task's `## Findings`.

`Pull request:` records which pull request carries the task's work, as a bare `#NNN` the way `Issue:` does. It is not an origin, so a task without one is well-formed. `git-pr` writes it when a pull request opens, which is the one step that always runs whether the chain drives it or a person does.

The line is what lets a merge close its own task. Every merge on `main` is a squash carrying the number in its subject, so the number survives where a branch name does not, and `aitk tasks archive --pull-request <n>` resolves the task from it. Without the line the board can only be swept blind, and a blind sweep cannot tell a shipped task from an abandoned one. One task, one pull request: two tasks naming the same number refuse to archive rather than both moving.

## What goes in

- Task entries describing observable behavior, one outcome per line
- A test strategy line naming the mechanism and what it verifies
- Findings stating what constrains the task, including blockers and dependencies

## What does not go in

- Class names, file paths, function names, or prop names in any entry or title
- Code-level steps or implementation detail. Behavioral specifics are fine.
- Architectural reasoning that outlives the task. A finding explains why this task is shaped as it is. A decision the system keeps after the task closes belongs in `.claude/ARCHITECTURE.md`.
- Narrative of the session that produced the task. A finding states what constrains the task, so what was probed, what it cost, and who decided belongs in the groundwork folder the `Groundwork:` line names. A task with no groundwork folder cuts the narrative rather than relocating it, since the board is not the fallback destination for it.
- "In progress" or "Blocked" headings. Note status inline on the outcome instead.
- Sequencing rationale or which version is active. Those belong in `.claude/ROADMAP.md`, which is committed because that reasoning has no substitute record.

## Archiving

Never delete a task file. A shipped task moves to `.claude/task-archive/` under its own name, and the live index regenerates without it. `aitk tasks archive` owns the move, the ordering-row removal, and the index regen as one unit.

Two callers reach that command. The `claude-tasks` skill runs it inside a session, and the `post-merge` hook runs it unattended after a pull that merged the work. Both go through the command rather than moving the file themselves, so the two paths cannot drift into archiving differently. Every gate the command applies refuses with a non-zero exit rather than reporting, because a caller with nobody watching cannot act on a warning.

One destination rather than a per-project choice is what lets the move happen without asking. It mirrors the plans archive at `.claude/plans-archive/` and stays gitignored, so an archived task does not start appearing in diffs. The cost is that the folder is unbacked, which is the same cost the plans archive already carries.

Archiving a task does not archive its plan. `claude-docs` owns the plans sweep and moves a plan only when the closing task is its last live citation. The archive clears the task's row from `priority.md` itself, since a shipped task left in the ordering reads as ready to hand a worker. It leaves prose naming the task alone for a person to resolve.

The row is matched by the link in its first cell rather than by a pattern against the whole line. A row names the task it is about in the first cell, so a link anywhere after that is a reference, such as a blocker pointing at what it waits on. Matching the line would delete the referring task's row too, on a board that is gitignored and has nothing to recover it from.

Sweep the plan before archiving the task. The sweep finds its work by scanning the live folder, so a task archived first is beyond its reach for good, and the plan is left with no live task citing it and an archived task pointing at a path nothing will retarget. The archive refuses a task whose `Plan:` line still resolves inside `.claude/plans/` for that reason, which puts the ordering under a gate rather than under a convention the unattended caller cannot follow.

That gate resolves the target against `.claude/tasks/` and against the project root both, so `../plans/x.md` and `.claude/plans/x.md` land on the same file. `claude-docs` reads the line the same way, and two halves of one ordering that parsed it differently would leave a plan stranded by the form it was written in.

A task with an open outcome stays on the board. Close it, or cut it from the task when the work is being abandoned, so what was dropped is recorded rather than inferred from an archived file. The sweep is gated on the same condition, so archiving around an open outcome also leaves the plan behind.
