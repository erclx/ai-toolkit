---
name: migration-superseded
description: Why a retired file's split ships as a proposal read from the destination standard, and why detection stops rather than falling back to a listing
---

# Migration superseded requirement

## Gap

Without this skill, a target holding a retired `.claude/` file is told what replaced it and nothing else. The drift report names both halves and no command touches either, so the user hand-splits one file into a folder answering to a standard they have not read. The destination files land with frontmatter fields missing and filenames that sort out of order, which is the step the toolkit exists to remove.

A second failure comes from the ordering nobody gets right unaided. A retired file committed before its ignore entry was written is tracked and ignored at once, and removing the entry first leaves the file tracked with nothing naming it. No report catches that state, so the mistake is discovered by whoever next wonders why a gitignored path keeps appearing in diffs.

Two more follow from where a session looks when the report is thin. An uppercase stem under `.claude/` is not the test for a superseded file, so a session substituting a folder listing reaches `ARCHITECTURE.md`, `REQUIREMENTS.md`, and `DESIGN.md`, each a single file the layout intends to stay one, and proposes shredding three documents. A session falling back to the plugin's own copy of the destination standard proposes a shape the project never adopted, against content only the user can place.

The last is the two-speed release skew arriving as a confident wrong answer. `superseded` reached a release in `0.46.0`, and an older CLI exits zero with a well-formed report that never mentions the field. A session reading that absent key as an empty array reports a clean layout to exactly the population holding the retired files.

## Must

- Take detection from the report's `superseded` array alone, and stop when the key is absent rather than treating it as empty
- Resolve the governing standard by matching the replacement folder against the `appliesTo` the standards catalog declares, so a seed folder added later resolves without an edit to the body
- Read the destination shape with `canon standards <name>`, report the root it answered from, and propose nothing for a folder the catalog names no standard for
- Separate a folder no standard governs from one whose governing standard could not be read, since the catalog derives `appliesTo` from prose and answers an unparsed scope statement with an empty array
- Name the untrack command ahead of the ignore entry whenever a retired file is both tracked and ignored, and say when the check could not run
- Report what the destination standard leaves open, such as a phase label the retired file never recorded, rather than supplying a value for it
- Report the measured empty case as a pass, since the guard is what proves the section ran

## Must not

- Write, move, or delete the retired file or its replacement, or create the destination folder
- Run `git rm --cached` or edit the file carrying the ignore entry
- Substitute a folder listing for the `superseded` array
- Read the plugin's own copy of the destination standard when the target lacks that file

## Guards

- A directory with no `.claude/` stops, since nothing there was superseded and the report's sections would not be measured

## Out of scope

- Classifying `CLAUDE.md` sections into the three-tier model: `migration-claude-md`
- Relocating `docs/` files by audience: `migration-context`
- Reconciling a seed file against its source section by section, which diffs two files rather than splitting one into a folder: `seed-sync`
- Applying the split and running the untrack, which the user does after reviewing
