---
title: Skill requirements
description: The REQUIREMENT.md sibling, the admission test that decides which plugin skills carry one, and the verdict behind each exemption
---

# Skill requirements

A skill folder may also carry `REQUIREMENT.md` beside `SKILL.md`, stating the gaps that skill exists to close so a proposed change has something to be argued against. It is authoring context for whoever maintains the skill. Claude Code loads `SKILL.md` as the entry and never reads the sibling, and `src/sync/check.ts` leaves `claude/skills/` out of the synced sources because skills load live from the plugin directory rather than being copied, so the file reaches no target session and costs no tokens there. `governance/rules/claude/570-skill.md` fires on both filenames and carries the consult-first bullet. Twenty-five skills carry one, covering the whole `git-*` family and the five-skill ship chain, which is what settled the unit as the skill rather than the family. `aitk claude skills list --json` reports presence per entry as `requirement`, so a caller reads coverage from the catalog rather than from the filesystem.

The admission test was replaced and the coverage spread was the reason. No internal skill carried the file while the path-scoped rule globbed that tree, so the gate bound nothing there. `standards/skill.md` had said the file was worth writing when a skill's scope was arguable rather than obvious, which correctly exempts most of the corpus and makes a coverage push an argument with the criterion it was meant to satisfy. The standard now names the second purpose the file already served, compressed orientation over a body that is procedural by design, and admits a skill when a reader cannot recover what it is for from the body alone.

Internal coverage went universal under that test, which `.claude/context/claude-internal.md` records and argues. Plugin coverage stays selective, and the sections below are why.

## Why the verdicts are written down

Coverage is selective by design, so an uncovered skill needs a stated reason rather than silence. The verdicts below are what make an exemption checkable, since a skill nobody read and a skill the criterion turned down look identical from outside.

Which skills carry the file is a fact `aitk claude skills list --json` reports as `requirement` per entry, so nothing below repeats it. What a listing cannot give is why, and that is what this entry holds. A reason is stated per skill where the call was close and collectively where one test decided a whole set, so an exemption is always checkable and is not always its own bullet.

## The setup and migration families

The `setup-*` and `migration-*` families were read as one batch because a shared prefix contests scope by construction. Each verdict names the boundary the prefix contests and which file settles it.

- `setup-init` carries one. It orchestrates a chain whose pieces four siblings each perform, so which of them the chain runs is contested by construction and only the requirement settles it against all four.
- `setup-gov` carries one. It installs one domain of a chain `setup-init` runs whole, and the rule it refuses to author belongs to `create-rule`, so two boundaries meet in one skill.
- `migration-context` carries one. It proposes into the same `.claude/context/` folder `migration-claude-md` writes, so the order the two run in is a contract neither body owns alone and the requirement is where it lives.
- `setup-indexes` carries none. Its scope block, its `.claude/snippets/` exclusion, and its opt-in maintenance note each ship with the reason behind them.
- `setup-plugins` carries none. Machine scope against project scope is its edge, stated in the description and again in the body with the reason.
- `setup-verify` carries none. Its `## Out of scope` section names three exclusions with a reason each, and hands the first to `project-commands`.
- `migration-claude-md` carries none. Its description names `migration-context` as the owner of `docs/` files, and its closing rule bans execution outright.
- `migration-standards` carries none. It reads the root folders neither sibling touches, and its toolkit-owned against author-owned split ships with the reason it exists.

Length did not discriminate. The longest body in the batch was turned down and the second shortest admitted.

## The remaining twenty-five

The remaining twenty-five were read in one pass rather than batched, since two samples at three of eight had already shown the criterion separates. Four were admitted. Their reasons are below, and the twenty-one rejections are stated collectively at the end of this section rather than one bullet each.

- `bash-script` carries one. Its body asserts a visual house style whose value is that every generated script shares it, which is a property no single script establishes for itself and no body written from inside one can state.
- `ci-workflow` carries one. Where pipeline structure ends and job contents begin is the only boundary it has, and the requirement is what fixes that line for a body whose rules are otherwise all structure.
- `docs-sync` carries one. It runs immediately after `claude-docs` in the ship chain and resolves the same baseline against the same tree, and neither body states that the split is by audience rather than by subject.
- `claude-seed-sync` carries one. It is the section-granular alternative to `aitk standards sync`, which is the grounds `toolkit-cli` and `toolkit-operator` both route to it on, and its own body never says so.

The twenty-one rejections share one reason and it is checkable per file. Nineteen of them open with a line stating what the skill is for or what fails without it, carry an explicit `## Boundaries` section, or both, so the two limbs of the test are answered before the body reaches its first step. Open any of the nineteen and the line is the first paragraph under the H1. Two carry neither and were turned down on narrower grounds:

- `claude-ui-test` is the genuine close call. It writes into the same `.claude/review/` namespace as `claude-ux-audit` over the same file types, which reads as contested until the entry conditions are compared. Verify a change against audit an existing surface is a real partition and both descriptions state it.
- `session-resume` states its purpose in the description rather than the body, and its three do-nots each carry the reason behind them, which answers the second limb without a boundary block.

The rate broke from the prior two samples: four of twenty-five against three of eight twice. The pass was not stopped early, and the nineteen are why. That content is what the earlier audit and the two unreachable-step sweeps added while working the same corpus, so the tail arrived already carrying what a requirement would have supplied. The families the earlier batches sampled were selected because a shared prefix contests scope, and the tail is the residue that has no family and no prefix to contest.
