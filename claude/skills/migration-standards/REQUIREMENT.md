---
name: migration-standards
description: Why the root-to-.claude relocation ships as git mv commands the user runs, and which inbound references are worth fixing
---

# Migration standards requirement

## Gap

Without this skill, a project whose rules cite `.claude/standards/` while the files sit at the root gets fixed by hand, and the hand fix loses what version control was holding. A plain `mv` breaks the rename chain, so every relocated standard reads as a delete beside an unrelated add and its history stops at the move.

A fourth failure comes before those three, from deciding what is unmigrated by listing the folder. A root `standards/` can hold the project's own docs and nothing the toolkit ever installed, and a listing cannot tell the two apart, so the skill proposes moving project files under `.claude/` where a sync walks them. The drift report already answers this, counting only files whose basename the toolkit ships, and it is the same report `toolkit-operator` reads to route here.

Taking detection from a command opens a failure the listing never had. A CLI predating the field exits zero with a well-formed report that never mentions it, so a skill treating an absent key as an empty answer tells a project whose every domain sits at the root that it has nothing to relocate. That is the population this skill exists for, and a silent false negative there costs more than the unfiltered count reading the folder would have produced.

Three failures follow from acting without looking first. A move onto an existing `.claude/standards/` copy overwrites the files already installed there, which is the case the relocation was supposed to be unnecessary for. A `git mv` on a dirty tree lands the relocation in the same commit as unrelated work, so neither can be reviewed or reverted alone. And a session that rewrites every inbound reference spends its effort on toolkit-owned rules and skills, which the next sync overwrites, while the author-owned lines that actually break go unmentioned.

## Must

- Take the set of domains to relocate from `aitk sync --check --json`, and report its filtered count rather than a folder listing
- Keep the listing as the fallback for a target where `aitk` is absent, the command fails, or the report carries no `unmigrated` key, and say that its counts are unfiltered
- Detect an existing copy under `.claude/` and skip that folder's move rather than merging into it
- Read the working tree state and require it clean before the moves, since the relocation has to be revertible on its own
- Propose `git mv` so history follows each file
- Report author-owned inbound references as TODO lines the user fixes, and leave the reference itself untouched
- Name the re-sync commands that reinstall toolkit-owned content at the new path, since the move alone leaves the install stale
- Report the already-relocated case as a pass

## Must not

- Run the moves, or edit `CLAUDE.md`, a rule file, or a doc
- Surface references inside toolkit-owned rules and skills, which the next sync rewrites anyway

## Guards

- Neither root `standards/` nor root `snippets/` present stops, since there is nothing to relocate
- A directory that is not a git work tree stops, since `git mv` needs version control and a plain move is the failure the skill exists to prevent

## Out of scope

- Classifying `CLAUDE.md` sections into the three-tier model: `migration-claude-md`
- Relocating `docs/` files by audience: `migration-context`
- Running the re-sync, which the user does after applying the moves
- What each sync command overwrites once it runs: `toolkit-cli`
