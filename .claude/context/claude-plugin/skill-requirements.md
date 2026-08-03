---
title: Skill requirements
description: The REQUIREMENT.md sibling, what loads it, and the admission test universal coverage retired
---

# Skill requirements

Every skill folder carries `REQUIREMENT.md` beside `SKILL.md`, stating the gaps that skill exists to close so a proposed change has something to be argued against. It is authoring context for whoever maintains the skill. Claude Code loads `SKILL.md` as the entry and never reads the sibling, and `src/sync/check.ts` leaves `claude/skills/` out of the synced sources because skills load live from the plugin directory rather than being copied, so the file reaches no target session and costs no tokens there. `governance/rules/claude/570-skill.md` fires on both filenames and carries the consult-first bullet.

The unit is the skill rather than the family. A single file covering the whole `git-*` family or the ship chain would state a boundary no one body could be checked against, and the boundaries worth writing down are the ones between siblings.

Which skills carry the file is a fact `aitk claude skills list --json` reports as `requirement` per entry. Read coverage from the command rather than from a count written here. Nothing gates the rule, so the command is the only reading of coverage there is, and a count in prose goes stale the moment a skill is added.

The command reads the shipped corpus rather than the cwd, which is what makes it useless for verifying a branch. A dev-linked `aitk` resolves its project root from its own source, so it reports `main` no matter which worktree runs it. Verify a batch by walking `claude/skills/*/` for the file, and keep the command for confirming the state of `main` after a merge.

## The admission test that was replaced

Coverage went universal across both corpora, the plugin half in three batches. `.claude/context/claude-internal.md` carries the argument from the internal half, and it holds here unchanged: an absent file reads as a gap in the authoring rather than as a verdict that the body is already its own specification, so a corpus covered in part cannot be scanned for either. Under selective coverage an uncovered skill needed a stated reason, since a skill nobody read and a skill the criterion turned down looked identical from outside. Universal coverage retires that whole class of bookkeeping.

`standards/skill.md` had admitted a skill when its scope was arguable rather than obvious. That criterion exempted most of the corpus correctly, and being correct is what made it unusable. A coverage push under it argues with the test it was meant to satisfy, and the path-scoped rule globbing the tree bound almost nothing. The standard now states the second purpose the file already served, compressed orientation over a body that is procedural by design, and admits every skill rather than testing each one.

Length never discriminated while the test existed. Across the selective passes the longest body read was turned down and the second shortest admitted, which is why no threshold survived into the standard.

Two skills carry no requirement and neither is an exemption. `create-snippet` is a retired redirect shell whose disposal is a separate call, and `create-standard` is held for the re-split branch that changes what it is for, since a requirement authored before that lands would describe the shape the skill is leaving.

What the selective criterion kept turning down is the other half of why it lost. Most skills it rejected already opened with a line naming what the skill is for or what fails without it, carried an explicit `## Boundaries` section, or both, so both limbs of the test were answered before the body reached its first step. An earlier corpus-wide audit and two unreachable-step sweeps had added that content while working the same corpus, so the skills read last arrived already carrying what a requirement would have supplied. The families sampled first were the shared-prefix ones, `setup-*` and `migration-*`, chosen because a shared prefix contests scope by construction, and the residue that has no family and no prefix to contest is where the rejection rate ran highest.
