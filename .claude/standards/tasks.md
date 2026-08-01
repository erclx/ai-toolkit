---
title: Tasks reference
description: Folder layout, filename convention, and content rules for .claude/tasks/
---

# Tasks reference

Applies to `.claude/tasks/`. Tracks what is being built and why, at the level of features and outcomes. One file per task. Update when a task starts, completes, or changes scope. When to open a task at all is project policy, not a shape rule, and lives in `CLAUDE.md`.

The folder is gitignored. Board state changes when work ships rather than when a branch is written, so committing it would put a claim about the future into the diff of an unrelated pull request. The git log records what shipped.

## Layout

```plaintext
.claude/tasks/
├── index.md              ← generated, never hand-edited
├── priority.md           ← hand-maintained execution order
├── v09.0-sync-paths.md
└── v13.0-toolkit-drift.md
```

One file per task is what keeps the board safe under parallel sessions. Two sessions working different tasks never write the same file, which matters because a gitignored board has no history to recover a clobbered write from.

`index.md` is generated from sibling frontmatter. The folder is gitignored, so the whole-repo index walk skips it and a hook passing the changed path regenerates it instead. Never hand-edit it.

`priority.md` carries execution order and what each task is waiting on. The generated index sorts by filename and says nothing about order, so without this file board state gets reconstructed by hand every session. Why the order is what it is belongs in `.claude/ROADMAP.md`, which is committed because that rationale has no substitute record.

Group tasks by readiness rather than by status, one row per task, with a stated column for what each is blocked on. Keep it to links and blockers: tables, plus at most one sentence per section. A paragraph in `priority.md` is a defect whatever it says. Stating the shape this way is what lets a single diff fail, since a size cap only trips after the fact and every addition looks defensible on its own.

The `claude-tasks` skill creates and archives task files. `claude-docs` marks outcomes `[x]` in an existing file and sweeps the plans those tasks cite. Neither does the other's job.

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
Groundwork: [<slug>](../.tmp/groundwork/<slug>/)
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

Every task names where it came from, through a `Plan:`, `Groundwork:`, or `Issue:` line under the title. Include each only when the file, folder, or issue it names exists.

A task with no origin is either lost context or work nobody decided to do. The invariant runs both ways, and the second direction is the one that bites: a groundwork track or an open issue that no task points at is work already decided and on its way to being forgotten.

`Plan:` and `Groundwork:` name their target as a markdown link whose text is the file or folder stem, so the line resolves on a ctrl-click the way `priority.md` rows already do. Write the path relative to `.claude/tasks/`, which makes it `../plans/` and `../.tmp/groundwork/`. A path written from the project root renders as a link and resolves to nothing in an editor rooted at the project. `Issue:` stays a bare `#NNN`, since an issue number is not a path and a full URL would write the remote into a gitignored file.

Phase-label format and where labels may appear are governed by `standards/versioning.md`.

`Plan:` points at `../plans/feature-<slug>.md` while the task is open. Once the task ships and the plan is archived, it points at `../.tmp/plans-archive/feature-<slug>.md`. Retarget both halves of the link rather than dropping it, so a completed task still leads to the reasoning behind it. One plan per task. A plan cited by two tasks is a misfile rather than a shape to design for, which is why the sweep counts citations before archiving: the count is a guard against the misfile stranding a pointer, not support for the shape.

`Groundwork:` points at `../.tmp/groundwork/<slug>/`, the folder `claude-groundwork` fills. It names the surface it points at the way `Plan:` does. Use this key alone. `Research record` and `Decision record` are earlier spellings of the same thing and both convert to it.

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

Never delete a task file. A shipped task moves to `.claude/.tmp/task-archive/` under its own name, and the live index regenerates without it. `aitk tasks archive` owns the move, the ordering-row removal, and the index regen as one unit.

Two callers reach that command. The `claude-tasks` skill runs it inside a session, and the `post-merge` hook runs it unattended after a pull that merged the work. Both go through the command rather than moving the file themselves, so the two paths cannot drift into archiving differently. Every gate the command applies refuses with a non-zero exit rather than reporting, because a caller with nobody watching cannot act on a warning.

One destination rather than a per-project choice is what lets the move happen without asking. It mirrors the plans archive at `.claude/.tmp/plans-archive/` and stays gitignored, so an archived task does not start appearing in diffs. The cost is that scratch is unbacked, which is the same cost the plans archive already carries.

Archiving a task does not archive its plan. `claude-docs` owns the plans sweep and moves a plan only when the closing task is its last live citation. The archive clears the task's row from `priority.md` itself, since a shipped task left in the ordering reads as ready to hand a worker. It matches the row by the link it carries rather than by a line pattern, and it leaves prose naming the task alone for a person to resolve.

Sweep the plan before archiving the task. The sweep finds its work by scanning the live folder, so a task archived first is beyond its reach for good, and the plan is left with no live task citing it and an archived task pointing at a path nothing will retarget. The archive refuses a task whose `Plan:` line still resolves inside `.claude/plans/` for that reason, which puts the ordering under a gate rather than under a convention the unattended caller cannot follow.

A task with an open outcome stays on the board. Close it, or cut it from the task when the work is being abandoned, so what was dropped is recorded rather than inferred from an archived file. The sweep is gated on the same condition, so archiving around an open outcome also leaves the plan behind.
