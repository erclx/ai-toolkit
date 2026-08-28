---
name: migration-standards-drop
description: Why the standards-tree drop ships as an ordered proposal, what the two pre-delete reads catch, and why one citation form serves every surface inside a target
---

# Migration standards drop requirement

## Gap

Without this skill, nothing names the tree. The sync engine registers governance alone and the unmigrated scan carries an empty root-layout set, both by decision rather than by omission, so a target holding 21 installed standards files reports clean and the drop runs off whoever remembers to look. The census that found the population walked one folder on one machine and moved the count from four to seven.

The order is the second failure and it has two halves. A session that deletes before syncing lands the installed rules citing a path it removed, and one that sweeps before syncing repoints citations the sync then rewrites.

The delete otherwise runs blind in two directions. Two of the five targets measured on 2026-08-28 carried a runtime reader, one a hook hand-parsing a standard for its banned-word set, and a hook whose input is gone audits nothing while reporting a clean run. In the other direction, nothing separates a file the project wrote from a toolkit copy by name, and the corpus had moved on from all 20 files at one target, so a content diff sorts every file as changed and a session reading that diff either keeps everything or loses the one file no corpus carries.

The repoint form is the fourth. A session applying the citation rule it knows from a shipped skill writes `${CLAUDE_SKILL_DIR}/../../standards/<name>.md`, which from a project-local skill at `.claude/skills/<name>/` resolves back into the tree the same pass deleted, and reports the sweep finished.

The last is the name map. `prose` split into `markdown.md` plus the `write-human` skill and resolves as no standard, so a mechanical one-to-one repoint produces a citation to nothing and every check on it passes.

## Must

- Detect from a read of `.claude/standards/` itself, since no report names the tree and a session waiting for one waits forever
- Report the state a binary behind the published version puts the sync in, before naming a sync a stale binary would run
- Split the tree against `aitk standards list --json` three ways, separating an unchanged toolkit copy from a drifted one and from a name that resolves to no standard
- Name every runtime reader ahead of any delete, splitting a reader from a citation by whether the file is markdown, and say when the search could not run
- Give every citation inside a target one target form, `aitk standards <name>`, and say why the plugin-root form fails there
- Order the proposal sync, drop, sweep, and state that the sweep re-reads after the sync rather than before it
- Report an unmatched name as the user's to place, naming the `prose` split as the recorded instance
- Report the measured empty case as a pass, since the guard is what proves the read ran

## Must not

- Run the sync, delete or move a file under the tree, or rewrite a citation
- Sort a drifted file as project-authored or as toolkit-owned on a content diff alone
- Propose the plugin-root citation form for a surface inside a target
- Relocate the install stamp. One visit per target is cheaper than two and a skill is not a visit, so the stamp rides with whatever else reaches the target.
- Stay in the catalog on the author typing its name alone. Nothing can answer that before the skill has run, so read the census back once it has and retire it if the answer is nobody.

## Guards

- A directory with no `.claude/` stops, since nothing there installed a tree
- A `.claude/standards/` holding no markdown is the pass rather than a refusal
- No `aitk` on `PATH` stops, since every citation this move writes names a verb the target has to run

## Out of scope

- Classifying `CLAUDE.md` sections into the three-tier model: `migration-claude-md`
- Relocating `docs/` files by audience: `migration-context`
- Splitting a retired `.claude/` file into the folder that replaced it, which pairs one file against one folder rather than dropping a corpus: `migration-superseded`
- Reconciling a seed file against its source section by section: `claude-seed-sync`
- Applying the drop and the sweep, which the user does after reviewing

## Why it ships while its consumer row is parked

The one task performing this move is parked on the operator declining outside-repository work, so the skill arrives with three known consumers and no live instance. It ships anyway, because the parked row is about who is authorized to visit a target rather than about the move being wrong, and the skill is what makes the move repeatable by whoever is authorized. The evidence behind it comes from the census rather than from a run, which is the weaker of the two and is recorded here as such.
