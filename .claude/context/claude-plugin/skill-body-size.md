---
title: Skill body size
description: The line checkpoint that replaced a word cap nothing reached, the move rule deciding what leaves a body, and the dereference test each move has to pass
---

# Skill body size

`.claude/standards/skill.md` checks a skill body against 150 lines and names what moves to `references/` past it. The number is a prompt to look rather than a gate, matching the context-entry checkpoint the repository already runs, so nothing enforces it and a body carrying nothing but procedure stays whole at any length.

## Why the cap was replaced rather than lowered

The rule before it capped a body at 5,000 words. No skill in the corpus has ever approached that, so the rule that would force a reference has never once applied, and the corpus grew to roughly five thousand body lines across fifty-five skills with two thirds of them putting everything in the body. A cap that never fires is indistinguishable from no rule, and lowering the word number would have kept the wrong unit: a body is read as lines on a screen and edited as lines in a diff, and every neighboring checkpoint in this repository counts lines.

Words and lines also disagree about what a body is heavy with. A signal table or a stub template is few words and many lines, and those are exactly the blocks worth moving, so the word unit was blind to the content the rule exists to catch.

## What the move rule names

A catalog, a table of cases, or a format spec running past roughly fifteen lines goes to `references/`. Procedure prose stays, since a session sent to a reference for its own steps pays two reads for one job.

Each move owes a named branch that skips it. Body lines are paid on every invocation and a reference only when the body sends the session to it, so a block every run dereferences costs a read and saves nothing, and the asymmetry is the entire argument for moving anything. The body keeps the trigger, the skip condition, and the guard, because a run that never reaches the block has to decide that without opening the reference.

That test is what bounds the rule. All three sweeps in `claude-docs` moved on it: a project with no wireframe folder and a diff adding no source signal skips the first two outright, and an architecture record carrying no anchored entry skips the third. The rebase machinery in `claude-address-review` moved because a branch that still merges never reaches it. A reply format the same skill writes on every run stayed, having failed the test.

## Applying it is maintenance, not a sweep

Ten bodies clear the checkpoint. Moving all of them in one pass turns a standards change into a corpus rewrite, so the checkpoint fires on each skill as that skill is next edited and the rest stay as they are. The value is that it applies on every later edit rather than that the corpus is uniform on the day it lands.

A reference two skills read gets a copy under each rather than a shared location, and pointing one skill at a sibling's folder is banned outright, since a bare relative path across folders resolves against the session cwd and breaks the moment either skill runs from a plugin cache. `git-pr` and `git-split` both carrying `branch.md` and `pr.md` is the shape to expect.

Where that single source lives is a fact about this repository rather than a rule the standard can carry, so the standard states the generation rule and stops. Here the source is `standards/bundled/`, `scripts/core/regen-skill-references.sh` fans each file out to every skill declaring it, and the Skill references stage of `bun run check` fails on a copy edited in place. Editing the copy is the mistake the fan-out invites, and the failure message names the source folder, so the recovery is already in the error rather than in a citation the standard could not make.
