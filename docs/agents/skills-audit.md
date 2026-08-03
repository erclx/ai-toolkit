---
title: Skill audit
description: Measuring both skill corpora against standards/skill.md, the checks it reads, and the requirement gate that is the only failing one
---

# Skill audit

`aitk claude skills audit [path]` reports both skill corpora against the rules `standards/skill.md` states mechanically. It reads and reports. Fixing what it finds is separate work.

```bash
aitk claude skills audit
aitk claude skills audit --json
aitk claude skills audit --requirements-only
```

| Option                | Behavior                                                             |
| --------------------- | -------------------------------------------------------------------- |
| `--json`              | Add a machine-readable record on stdout, keeping the frame           |
| `--requirements-only` | Run the gating presence check alone, printing nothing when it passes |

## Corpus scope

Both trees are measured. `claude/skills/` installs into a target and `.claude/skills/` stays in the toolkit, the standard governs each, so a run reading one reports a pass over half its subject. A tree the project does not carry is skipped, which puts a target holding `.claude/skills/` alone in scope. A run where neither resolves refuses, since a clean exit over nothing measured is the outcome the command exists to prevent.

The audit reads the directory it is pointed at, defaulting to the cwd. `aitk claude skills list` resolves the shipped corpus from its own install root instead, so a dev-linked binary reports `main` no matter which worktree runs it. Auditing a branch needs the cwd reading, which is why the two commands resolve their root differently.

## What it measures

Each check traces to a line in the standard.

- `REQUIREMENT.md` present in every skill folder
- Frontmatter `name` matching the folder name
- Frontmatter `description` present
- `description` under 1024 characters
- No `README.md` inside a skill folder
- Folder name in kebab-case
- Each `REQUIREMENT.md` declaring `Gap` and `Must`, matched at any heading level

A body whose frontmatter does not parse reports as declaring neither field rather than ending the run, so one malformed file cannot hide the corpus behind it. A key present with an empty value reads as absent, since a blank `name` would otherwise report as a name disagreeing with every folder. A folder carrying no requirement is reported once under presence rather than counted again for the sections it therefore lacks.

## What it leaves alone

The report names its own blind spots on every run, including the run where everything passed. Whether each `Must` traces to a stated gap is the rule in that standard worth the most and no parser reads it. Whether a gap states an observed failure rather than an intent, and whether a description routes, are the same kind of judgment. The 5,000-word body ceiling is mechanical and still absent here.

A check with no rule behind it prints an opinion as a defect, which is where the list stops.

## Exit codes

Exit codes are `0` for a clean run, `1` for a refusal, and `2` for a skill folder carrying no `REQUIREMENT.md`. Only presence sets a failing code. Name, description, folder, and requirement-section findings print and return `0`, because each is a judgment a reader settles and failing a push on one would make the check something to route around.

## The requirement gate

`--requirements-only` is the half wired into `bun run check`. Presence of a required file is a fact with no false positives, and the rule had nothing reading it, so a skill shipped without the sibling passed every stage while the standard required it.

The check is preventive rather than diagnostic. Every mechanical rule passed across both corpora the day it shipped, so what it buys is the regression it stops rather than a backlog it surfaces.
