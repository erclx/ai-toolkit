---
title: Roadmap reference
description: Shape and content rules for .claude/ROADMAP.md
---

# Roadmap reference

Applies to `.claude/ROADMAP.md`. Sequences the scope from `.claude/REQUIREMENTS.md` into ordered versions, each a usable increment. Update when the sequence changes or a version ships. The roadmap is committed because the sequence and its rationale are shared strategic truth a fresh session needs, unlike `.claude/TASKS.md`, which is ephemeral scratch.

The roadmap is one scannable table, not a stack of blocks. That is what keeps it distinct from `.claude/TASKS.md`: the roadmap is an overview read at a glance, while tasks are worked one block at a time.

## What goes in

- One row per version, ordered top to bottom by sequence
- A status per version: active, next in line, or deferred
- The observable outcome each version delivers, as a short phrase
- The features a version groups, by name, drawn from the MVP list in `.claude/REQUIREMENTS.md`
- The version each row depends on, and a short why

## What does not go in

- Task breakdown, checkboxes, or per-feature file lists. Those live in `.claude/TASKS.md` and `.claude/plans/`.
- Implementation detail, API names, or component references
- Rationale for tech choices. That belongs in `.claude/ARCHITECTURE.md`.
- Sentence-long cells. Keep each cell terse so the table stays scannable.

## Format

One table. Columns, in order:

- `Version`: the `vX.Y` phase label. Phase-label format is governed by `standards/versioning.md`.
- `Status`: `Now` for the active version, `Next` for sequenced upcoming versions, `Later` for deferred themes.
- `Outcome`: what the user can do once this version ships, as a phrase.
- `Features`: the feature names this version groups, comma-separated.
- `Depends on`: the version this one needs and a short why, or `none` when independent.

## Template

```markdown
# Roadmap

| Version | Status | Outcome  | Features             | Depends on         |
| ------- | ------ | -------- | -------------------- | ------------------ |
| v0.1    | Now    | <phrase> | <feature>, <feature> | none               |
| v0.2    | Next   | <phrase> | <feature>            | v0.1, for <reason> |
| v0.3    | Later  | <phrase> | <feature>            | none               |
```

## Lifecycle

The roadmap sequences a finite, known scope. When the last version ships, the scope is exhausted and the project cuts a semver release per `standards/versioning.md`. Later work arrives as discrete items, a fresh requirements pass or tracked issues, rather than extending the original roadmap without end.
