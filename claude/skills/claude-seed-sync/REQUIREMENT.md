---
name: claude-seed-sync
description: Scope boundary for section-granular seed reconciliation against the bulk install and sync commands
---

# Claude seed sync requirement

## Gap

Without this skill, a project that edited an installed seed or standard has two ways to take an upstream change and both lose something. `aitk standards install` overwrites every file, so the edits are gone with no record of what they were. `aitk standards sync` updates only files it already finds and adds none, so a standard written after the project installed never arrives at all. Neither can deliver one upstream section into a file the project has customized, which is the case a grown project is always in.

A whole-file diff does not close it either. It cannot separate a section the user rewrote on purpose from a section the toolkit moved on without them, so the choice reaches the user as accept everything or lose everything, and the safe answer is always to skip.

Two failures belong to the audit rather than to the diff. A decision taken in chat dies with the session, so an audit half applied cannot be resumed and the second run starts over. And a file the toolkit generates rather than ships, such as an index rebuilt from sibling frontmatter, is absent from every source catalog by design, so a naive comparison reports it as a local addition and invites the user to reconcile something nothing owns.

## Must

- Read seed and standard content from the CLI rather than holding a copy, so the audit and the install cannot disagree
- Diff per section, treating the preamble as a section of its own
- Separate a customized section from a stale one, and default the customized one to no action
- Persist the proposal and every decision to a review file that stays the source of truth across re-pings
- Apply one section at a time, never by rewriting a file

## Must not

- Propose removing a section present only in the target. Those are the customizations the skill exists to preserve.
- Write a target file before a decision is recorded against the item
- Read an empty decision slot as consent

## Guards

- No `aitk` on PATH, or no `.claude/` directory at the project root, stops before any read

## Out of scope

- Bulk install and sync of a whole domain, which `aitk <domain> install` and `aitk <domain> sync` own and `toolkit-cli` documents. Reach for this skill when the target holds edits worth keeping, and for those commands when it does not.
- Golden configs, which overwrite by design and carry no section structure to diff
- Governance rules: `aitk gov sync`
- First-time scaffold of a project that has installed nothing yet: `setup-init`
- Public `README.md` and `docs/` prose: `docs-sync`
