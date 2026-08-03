---
name: migration-standards
description: Why the root-to-.claude relocation ships as git mv commands the user runs, and which inbound references are worth fixing
---

# Migration standards requirement

## Gap

Without this skill, a project whose rules cite `.claude/standards/` while the files sit at the root gets fixed by hand, and the hand fix loses what version control was holding. A plain `mv` breaks the rename chain, so every relocated standard reads as a delete beside an unrelated add and its history stops at the move.

Three failures follow from acting without looking first. A move onto an existing `.claude/standards/` copy overwrites the files already installed there, which is the case the relocation was supposed to be unnecessary for. A `git mv` on a dirty tree lands the relocation in the same commit as unrelated work, so neither can be reviewed or reverted alone. And a session that rewrites every inbound reference spends its effort on toolkit-owned rules and skills, which the next sync overwrites, while the author-owned lines that actually break go unmentioned.

## Must

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
