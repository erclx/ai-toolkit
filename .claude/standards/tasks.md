---
title: Tasks reference
description: Shape and content rules for .claude/TASKS.md
---

# Tasks reference

Applies to `.claude/TASKS.md`. Tracks what is being built and why, at the level of features and outcomes. Update when a task starts, completes, or changes scope. When to open a task at all is project policy, not a shape rule, and lives in `CLAUDE.md`.

## What goes in

- Task entries describing observable behavior, one outcome per line
- A test strategy line per block naming the mechanism and what it verifies
- Inline notes on blockers or dependencies, attached to the relevant entry

## What does not go in

- Class names, file paths, function names, or prop names in any entry or title
- Code-level steps or implementation detail. Behavioral specifics are fine. Reasoning behind a decision belongs in `.claude/ARCHITECTURE.md`.
- "In progress" or "Blocked" sections. Note status inline on the entry instead.

## Sections

One section only: `## Up next`. Completed blocks stay there until archived by hand, never moved automatically. When nothing is queued, keep a `### Nothing queued` placeholder and remove it when the first real task lands.

## Block format

Prefix each block title with a `vX.Y:` phase label for ordering and dependencies, then a short title whose form depends on the task type:

- Feature: an outcome describing what the user can now do
- Fix: a problem statement describing what is wrong
- Chore: an imperative describing what is being done

Phase-label format and where labels may appear are governed by `standards/versioning.md`. Include the `Plan:` line only when `.claude/plans/feature-<slug>.md` exists.

```markdown
### vX.Y: Title

Plan: .claude/plans/feature-<slug>.md

- [ ] Outcome: what done looks like
- [ ] Outcome: what done looks like

> Test strategy: <unit | component | e2e | visual | manual>, what is being verified
```
