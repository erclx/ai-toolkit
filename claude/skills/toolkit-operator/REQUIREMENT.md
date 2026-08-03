---
name: toolkit-operator
description: Why the toolkit has one front door, what orienting on live catalogs prevents, and where it hands off
---

# Toolkit operator requirement

## Gap

Without this skill, using the toolkit means knowing which skill to pick, and the user who most needs it is the one who cannot. A plain-language intent has no obvious owner among a dozen setup and sync skills, so the session guesses a command instead of resolving one, and a wrong guess installs into a project rather than reporting a mismatch.

Two failures come from acting on memory. A session that names a stack, rule, or snippet from what it remembers rather than from the live catalog runs against an entry that has been renamed or removed. And a session that edits a managed file by hand produces a change the next sync overwrites, which reads as the toolkit undoing work rather than as the edit having been made in the wrong place.

The last failure is duplication. A front door that answers everything itself reimplements first-time detection and seed diffing inline, badly, beside the skills that already do both. The value of a router is that it stops at the handoff.

## Must

- Orient on the toolkit's own docs and the live catalogs before acting
- Map the stated intent to one lifecycle phase, then either run the simplest command that satisfies it or hand off
- Resolve every stack, rule, snippet, and standard name from a catalog at runtime
- Run the CLI non-interactively and report the command run, what changed, and the full path of anything written

## Must not

- Edit a managed file by hand instead of running the CLI that owns it
- Reimplement a flow another skill owns
- Hardcode a catalog name
- Auto-trigger. It is a door the user opens, and a router that fires on its own routes requests nobody made.

## Guards

- An intent matching a deep flow hands off rather than running a shallow version of it, since a partial scaffold is harder to recover from than none

## Out of scope

- First-time scaffold of a fresh project: `setup-init`
- Seed and preamble drift in installed files: `claude-seed-sync`
- Governance rule install and index bootstrap: `setup-gov` and `setup-indexes`
- What a given sync overwrites once it runs: `toolkit-cli`
