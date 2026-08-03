---
title: Skill requirements
description: The REQUIREMENT.md sibling, what loads it, and the admission test replaced when coverage went from selective to universal
---

# Skill requirements

A skill folder may also carry `REQUIREMENT.md` beside `SKILL.md`, stating the gaps that skill exists to close so a proposed change has something to be argued against. It is authoring context for whoever maintains the skill. Claude Code loads `SKILL.md` as the entry and never reads the sibling, and `src/sync/check.ts` leaves `claude/skills/` out of the synced sources because skills load live from the plugin directory rather than being copied, so the file reaches no target session and costs no tokens there. `governance/rules/claude/570-skill.md` fires on both filenames and carries the consult-first bullet.

The unit is the skill rather than the family. A single file covering the whole `git-*` family or the ship chain would state a boundary no one body could be checked against, and the boundaries worth writing down are the ones between siblings.

Which skills carry the file is a fact `aitk claude skills list --json` reports as `requirement` per entry. Read coverage from the command rather than from a count written here. The corpus is migrating a batch at a time, so a number in prose is wrong between any two of them.

## The admission test that was replaced

Coverage was selective and is going universal across both corpora. `.claude/context/claude-internal.md` carries the argument from the internal half, and it holds here unchanged: an absent file reads as a gap in the authoring rather than as a verdict that the body is already its own specification, so a corpus covered in part cannot be scanned for either. Under selective coverage an uncovered skill needed a stated reason, since a skill nobody read and a skill the criterion turned down looked identical from outside. Universal coverage retires that whole class of bookkeeping.

`standards/skill.md` had admitted a skill when its scope was arguable rather than obvious. That criterion exempted most of the corpus correctly, and being correct is what made it unusable. A coverage push under it argues with the test it was meant to satisfy, and the path-scoped rule globbing the tree bound almost nothing. The standard now names the second purpose the file already served, compressed orientation over a body that is procedural by design, and admits a skill when a reader cannot recover what it is for from the body alone.

Length never discriminated under either test. Across the selective passes the longest body read was turned down and the second shortest admitted, which is why the standard states length as a weak proxy rather than a threshold.

What the selective criterion kept turning down is the other half of why it lost. Most skills it rejected already opened with a line naming what the skill is for or what fails without it, carried an explicit `## Boundaries` section, or both, so both limbs of the test were answered before the body reached its first step. An earlier corpus-wide audit and two unreachable-step sweeps had added that content while working the same corpus, so the skills read last arrived already carrying what a requirement would have supplied. The families sampled first were the shared-prefix ones, `setup-*` and `migration-*`, chosen because a shared prefix contests scope by construction, and the residue that has no family and no prefix to contest is where the rejection rate ran highest.
