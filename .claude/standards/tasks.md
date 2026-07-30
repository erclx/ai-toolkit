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
├── v09.0-sync-paths.md
└── v13.0-toolkit-drift.md
```

One file per task is what keeps the board safe under parallel sessions. Two sessions working different tasks never write the same file, which matters because a gitignored board has no history to recover a clobbered write from.

`index.md` is generated from sibling frontmatter. The folder is gitignored, so the whole-repo index walk skips it and a hook passing the changed path regenerates it instead. Never hand-edit it.

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

No sections. The folder is the board and the index is the catalog, so a task file holds one task and nothing else. Status stays inline on an entry.

Prefix the H1 with the `vX.Y:` phase label, then a short title whose form depends on the task type:

- Feature: an outcome describing what the user can now do
- Fix: a problem statement describing what is wrong
- Chore: an imperative describing what is being done

Phase-label format and where labels may appear are governed by `standards/versioning.md`. Include the `Plan:` line only when the plan file it names exists. An open task points at `.claude/plans/feature-<slug>.md`. Once the task ships and the plan is archived, the line points at `.claude/.tmp/plans-archive/feature-<slug>.md` instead. Retarget the line rather than dropping it, so a completed task still leads to the reasoning behind it.

```markdown
---
title: 'vX.Y: Title'
description: One line on what this task achieves
---

# vX.Y: Title

Plan: .claude/plans/feature-<slug>.md

Why this task exists and what it depends on.

- [ ] Outcome: what done looks like
- [ ] Outcome: what done looks like

> Test strategy: <unit | component | e2e | visual | manual>, what is being verified
```

## What goes in

- Task entries describing observable behavior, one outcome per line
- A test strategy line naming the mechanism and what it verifies
- Inline notes on blockers or dependencies, attached to the relevant entry

## What does not go in

- Class names, file paths, function names, or prop names in any entry or title
- Code-level steps or implementation detail. Behavioral specifics are fine. Reasoning behind a decision belongs in `.claude/ARCHITECTURE.md`.
- "In progress" or "Blocked" headings. Note status inline on the entry instead.
- Sequencing rationale or which version is active. Those belong in `.claude/ROADMAP.md`, which is committed because that reasoning has no substitute record.

## Archiving

A shipped task moves to `.claude/.tmp/task-archive/` under its own name, and the live index regenerates without it. Never delete a task file.
