---
title: Install and sync
description: What install overwrites and sync leaves alone, the selection flag and its closure, the bundled fan-out and its consumers field, and the sync gotchas
---

# Install and sync

Install and sync are peers over the same flat `standards/` root, and they differ on what they are allowed to add. Everything below follows from that split, including which standards the fan-out reaches instead and why a selective install has to compute a closure.

## The install and sync contract

Install overwrites what it installs on purpose. Sync updates only what is already present and never adds, so a project chooses when to take a new standard, and that property is what lets a selective install stay selective across later syncs. `index.md` is generated from what is actually installed rather than copied, so a target's catalog never lists a standard it does not have.

Sync runs on the shared engine in `src/sync/engine.ts` via `src/standards/adapter.ts`. It is the third adapter and the first to need the engine widened, which is why the engine now carries a per-adapter non-interactive policy, a walk exclusion, and a completion hook.

The headless refusal is a per-adapter policy rather than a branch inside the engine. Gov rules and snippets are toolkit-owned and default to applying. Standards are seeds a project edits, so an unattended overwrite is data loss with no prompt in front of it.

Sync matches by filename against the flat `standards/` root. A standard that only exists in a source subfolder has no flat sibling, so it reads as project-authored and is left alone, which keeps install and sync agreeing on the same set.

## Selecting what installs

`install --only <names>` selects, and the selection expands to the transitive closure of what those standards cite, so a subset cannot land a dangling reference. Warning and shipping anyway was the alternative and leaves a broken target behind a message nobody reads. Closure lives in `src/standards/closure.ts` rather than inside `planInstall`, which keeps the listing verb a lister.

The dependency is parsed from the prose, since a backticked filename is the only place a standard names a sibling. Every candidate resolves case-exactly against the flat root, dropping a fenced example, a target's own `.claude/ARCHITECTURE.md`, and a bundled standard install never copies.

Matching the listing rather than probing the filesystem is load-bearing, since a case-insensitive volume resolves `SKILL.md` onto `skill.md`.

A citation inside the `Does not govern:` list is a handoff rather than a dependency, and the closure stops at it. That entry says the sibling owns a concern this standard does not, so a caller who declined that concern does not need the file. It is reported as an unresolved pointer instead, which is what lets the caller add the name deliberately.

## Citation position and the closure

Citation position is the lever for binding two standards together. Two halves split from one file cite each other outside their scope lists, so the closure follows the link and selecting either name lands both.

Leaving the pair to their `Does not govern:` entries was the alternative and it lets a target install one half whose pointer resolves to nothing. The cost is that neither half can be selected alone, which is correct for a split and wrong for an ordinary sibling.

Splitting the two citation classes is what makes the flag useful. Following both, the mean closure over a single name was 14.1 of 15 and only `slug.md` landed alone, because nearly all the corpus density sits in those scope lists. Following dependencies alone, the mean is 1.4 and the largest is `publish.md` at 3. The same measurement is the reason the corpus needs no de-citing pass.

## The shape of the selection flag

A selection is an option rather than a positional. `install [target]` already ships, so a leading `[selection]` would read `aitk standards install ../app` as a standard name. Snippets took the positional because its category argument came first from the start.

An unknown name fails the run rather than being warned and dropped, unlike `--skip` on `aitk init`. A dropped name silently omits a standard the caller asked for and computes the closure over the wrong set.

## The consumers field

A handwritten reference that lives only in one skill's `references/` omits `consumers:`. The field marks a file as fan-out output, so carrying it on a skill-local file claims a generated origin no script maintains.

`regen-skill-references.sh` walks `standards/bundled/` alone, which leaves the mistake inert there, but the field also gates the standards audit, so a mistaken one silences the audit on that file.

The audit pairs the field with the location, because the fan-out copies frontmatter verbatim and the field alone matches the six sources under `standards/bundled/` as well as the ten copies. Keying on the field alone left a bundled standard audited against nothing, and keying on the folder alone would drop the seven hand-authored references the skill standard governs.

## Standards that moved out of a skill

`standards/groundwork.md` and `standards/intake.md` are the two that went the other way, out of a skill's `references/` and into the flat root. A skill-local reference is right for a file only that skill reads, and both of these govern a folder edited routinely by sessions that never invoked the skill, so the readership test that kept the orchestrator runbooks local sends these two out.

The reference is deleted rather than left beside the standard, since publishing on both surfaces makes two sources for one text. Each skill now cites its standard through the two-route form, the installed path first and the bundled path when the project has no installed standards.

Both govern a gitignored folder no check reaches, which puts them in one class with the plan and memory standards rather than leaving each to find its own answer. `.claude/hooks/standards-audit.sh` exits early on the scratch paths and the audit skill reads changed files from git, which never lists a gitignored one, so all four were enforced by a session reading them and by nothing else.

The precedent extended is `aitk tasks validate`, which reports against the board without writing, and reporting is what makes a verb safe over a folder with no history to recover from. `aitk records validate <kind>` now covers all four, `memory` having landed with its standard rather than as a second command.

## Gotchas

- `aitk standards sync` is file-level. "Apply all" overwrites whole files and destroys local customizations. For projects that customize sections, use the `claude-seed-sync` skill, which diffs the preamble plus each `##` section and preserves customizations by default.
- Under `AITK_NON_INTERACTIVE=1`, sync refuses to auto-apply when drifts are detected rather than silently overwriting.
- A standard authored directly in a target's `.claude/standards/` is project-local and survives sync, which only touches filenames it recognizes from the toolkit source.
- Do not hand-edit `index.md` in a target. Install and sync rewrite it from the frontmatter of whatever is present.
- The catalog refresh runs on every completed sync, including one that found no drift, because a standard the toolkit stopped shipping goes stale in the catalog without changing any file the walk compares. It does not run when the headless refusal fires or the prompt is cancelled, since neither completed.
- A standard missing `title` or `description` makes the regen fail. Sync reports it, finishes, and exits 0, so one malformed file cannot block the rest of the sync. The bash exited 1 here through `set -e`, after the file writes had already landed, so the tree was the same either way and only the exit code differed.
- `bun run check` regenerates both the consumed copy and the skill-reference fan-out, then fails on drift. The failure means the regenerated files are uncommitted, not that the content mismatches.
