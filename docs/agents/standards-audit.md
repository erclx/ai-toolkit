---
title: Standard success criteria
description: Reading the corpus against the Success criterion gate, why the check scopes to arrival rather than the whole corpus, and the exit codes it sets
---

# Standard success criteria

`aitk standards audit` reads the corpus at `standards/` and reports which files carry a `## Success criterion` section against which do not, per `standards/standard.md`. It fails only on a standard new to the current branch, never on one already short the section.

```bash
aitk standards audit
aitk standards audit --json
aitk standards audit --arrivals-only
```

| Option            | Behavior                                                     |
| ----------------- | ------------------------------------------------------------ |
| `[path]`          | Project root, defaulting to the current directory            |
| `--json`          | Add a machine-readable record on stdout, keeping the frame   |
| `--arrivals-only` | Run the gating check alone, printing nothing on a clean pass |

## Why arrival rather than the corpus

`standards/standard.md` states that a criterion is added to an existing standard when that standard is next exercised, not in a sweep: a criterion written with no failure to point at is the taste-based edit the rule exists to prevent. Gating the whole corpus would fail every push until every standard already short the section was closed at once, which is the sweep that rule forbids. The check reads the whole corpus and fails only on a file present in the working tree and absent at the branch's merge base, treating a rename into the corpus the same as a standard authored fresh.

## Exit codes and refusals

| Code | Meaning                                                         |
| ---- | --------------------------------------------------------------- |
| `0`  | every arriving standard carries the section                     |
| `1`  | refused, with `reason` naming the cause                         |
| `2`  | a standard new to this branch carries no `## Success criterion` |

A project authoring no standards refuses with `no-corpus`, the ordinary state of most targets, the same absence `aitk claude skills audit` reads as its own `no-corpus`.

## What it does not measure

Presence of the heading is the whole check. The section's content, the questions it must answer or the task it must let a reader complete, is a judgment `aitk standards audit` cannot read, so a standard carrying an empty or token section still passes.
