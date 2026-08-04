---
title: Governance
description: Path-scoped Claude rules, stacks, install and sync
---

# Governance system

## Overview

Owns the rules that steer AI agents working in a project. Source rules live here as `.md` files under `governance/rules/` and install to `.claude/rules/` in a target, where Claude Code reads them natively. Stacks group rules so one install command provisions a whole toolchain. The rules themselves are content, not code, so the domain is a catalog plus three commands rather than a system with runtime behavior.

## Layout

- `governance/rules/` owns the source rules, organized into one subfolder per numbering band
- `governance/stacks/` owns stack definitions as toml, each declaring an optional extends chain and a rules list whose entries name either a rule or a whole rule folder
- `internal/rules/` owns rules that govern toolkit authoring alone, installed into this repo's copy and shipped to no target
- `internal/governance.toml` records which stack and extras this repo consumes, and `src/gov/consumed.ts` produces the copy from it
- `src/sync/engine.ts` owns the shared sync engine every domain runs on
- `src/gov/` owns the gov half: the adapter that feeds the engine, and the rules payload builder behind `build`
- `src/gov/` owns the stack reader, the rule lookup, the catalog behind `list`, and the install copy

## Decisions

### A stack entry names a rule or a folder

- `expandStackEntry` in `src/gov/stacks.ts` resolves one entry. A name matching a directory under `governance/rules/` yields every rule inside it, and anything else yields itself, so a folder and a slug leave the resolver as one shape. Dedupe runs on the expanded names, which is what lets a stack name a folder while an ancestor names a rule inside it without installing that rule twice.
- `base` takes `core` and `claude` whole. Those two folders were enumerated one rule at a time and the list was always exactly the folder, so adding a rule needed a second edit nothing prompted. Every other stack stays enumerated, because taking three of six rule folders is a selection a folder entry cannot express.
- The consequence is that both folders are now opt-out. A rule authored into `governance/rules/claude/` ships to every `base` consumer by existing, so the decision moved from the stack file to whether the file belongs in that folder.
- The install output is where the flat list is paid back. `runInstall` expands before printing, so the operator still reads every rule name even though the stack file no longer carries them.
- `--add` takes rule names alone and does not expand a folder. The extras flag layers onto a resolved stack rather than defining one, and a folder there has no case behind it yet. An unknown name still warns rather than aborting, so `--add core` is loud rather than silent.

### Rule sources and install

- Source rules carry the Claude shape directly, so install is a passthrough copy rather than a transform. Nothing generates a rule, which keeps the source readable and the install trivial.
- Rules live in subdirectories by domain and install preserves that layout. A flat folder would make the numbering bands the only grouping signal.
- Install, sync, and build are separate concerns rather than flags on one command. Install bootstraps a stack and overwrites. Sync updates only what is already present and never adds. Build concatenates into a paste payload. Collapsing them would mean guessing intent from target state.
- Install overwrites existing rules on purpose. Delete rules you do not want after install rather than adding optional or addon complexity to stack definitions.

### Sync and the shared engine

- Gov is the first domain on the shared sync engine, and it went first because its source lookup is the thinnest of the four. The engine owns target validation, the scan report, the prompt, and the apply loop. The adapter supplies two things only: where a destination file's source lives, and what counts as a change beyond a content diff.
- Sync matches an installed rule to its source by rule name rather than by relative path. A rule that moves between bands in the toolkit still syncs into the subdirectory the target already uses, so a reorganization here does not strand installed copies.

### Rules that route to a standard

- `510-context` carries a write-time policy alongside its read-time one, so editing a domain leaves its context entry conforming. It ships in `base.toml` to every consumer, so each write-time bullet states an outcome of the edit rather than a backlog to drain, which is the only phrasing that also reads correctly in a project with no entries yet.
- `556-groundwork` and `557-intake` route the two track folders, added to `base` beside `555-tasks` so the three workflow surfaces sit on one roster. Both folders are gitignored and both were governed only by a `references/folder-format.md` inside their skill, which loads when the skill does and never when a promotion pass or a returning session opens the folder directly. Each rule carries the two directives that ship silently when violated, the answer contract for intake and the re-measure floor for groundwork, and points at its standard for the rest. What the rule cannot carry is the write scope, since a misrouted write lands on a path the glob never matches, so that floor stays in the skill body.
- Every standard that governs a file path carries a rule routing to it, so an edit loads the standard without the matching skill being invoked. `595-tooling-reference` is toolkit-local and is authored under `internal/rules/claude/`, because `internal/standards/tooling-reference.md` governs a surface a target never authors and shipping the route would point at a path no install creates. It sits in `internal/` rather than `governance/rules/` so location enforces the boundary, the same way the internal standards and snippets do. It globs `manifest.toml` alongside `reference.md`, because a rule protecting a symmetry has to fire from either side and the manifest is the side that moves first.

### Rules as the floor under skills

A rule fires on a path match with no decision from the session and a skill fires on invocation or a description match, so the rule is the floor and the skill is the depth. `standards/rule.md` and `standards/skill.md` each carry the checkpoint pointing at the other, and both ship to targets. Nothing checks either one, which is accepted, since the checkpoint is a judgment prompt rather than an invariant.

The two-part test decides what crosses. Does the invariant fire when a specific path is edited, and does violating it ship silently? Run over the 75 `## Gotchas` bullets, the six domain skill bodies, and `CLAUDE.md`'s behavior list, it promoted four rules and widened one, which is the filter working rather than failing. Most of the pool is orientation and fails the first half, and a second group fails the second half because `bun run check` already gates it.

A rejection is recorded by which half failed rather than by judgment. The init gate's asserted-path requirement fails the first half, since the trigger is adding a domain and no glob matches that. The husky re-drop on a monorepo subtree fails it for the same reason, firing when a command runs rather than when a path is edited. The stale-copy failure on a widened source rule fails the second half, since that gate is closed and loud.

One candidate passes both halves and is deferred. A child folder carrying no `index.md` drops out of every catalog silently, and closing it means widening `510-context`, which ships to every `base` consumer and would carry an invariant about a system a target may not run. It needs a shipped rule and a stack decision, which is the deferral `claude/skills/` already took.

### This repository's own rules

- The toolkit's own `.claude/rules/` is produced from `internal/governance.toml` rather than copied by hand. The record names one stack and its extras, `aitk gov regen` resolves it through the same stack machinery an install uses, and anything under `internal/rules/` installs alongside. Recording the subset stops the producer from reading its own output to decide what that output should be.
- Registering a new rule for this repository means naming it somewhere the record resolves, not writing it into `.claude/rules/`. Add it to a stack in `governance/stacks/`, to the `add` list in `internal/governance.toml`, or to `internal/rules/` when it governs toolkit authoring alone. A rule with a source that no stack names never installs, and the drift assertion still passes because the copy matches what the record resolves to. A file written into `.claude/rules/` by hand is deleted on the next `bun run check`.

### Rules reached by something other than a glob

- `standards/versioning.md` is deliberately unrouted. It governs commit subjects, PR titles and bodies, review comments, issues, and git tags, none of which are files, so a path-scoped rule has nothing to match and would never fire. `git-commit` and `git-pr` reach that surface by instruction instead, and what catches a leak there is a check rather than a route. The check is `publish.md`, which reads the label rule from `versioning.md` beside it, so the six skills that publish to a remote inherit it from the citation they already carry.
- `090-code-comments` owns the degradation term list rather than `src/comments/`, because `src/comments/vocabulary.ts` reads the terms out of whichever rule publishes a `## Degradation vocabulary` heading. Editing the backticked terms there changes what `aitk comments scan` sweeps for here and in every target on `base`. Discovery anchors on the heading rather than the filename, so a renumber cannot silently empty the list.

### Numbering bands

- Rules follow a numbering scheme by band, so a new rule's number states its domain without opening it.
- `internal/rules/` takes the top of a band and `governance/rules/` takes the gaps between the tens, so two sources numbering into one folder cannot collide silently. The core band is already full at every ten, which is what forces the split rather than leaving it to convention. `standards/rule.md` states the division as a rule an authoring session reads, since a target project splitting its own rules against an installed set faces the same collision. Nothing checks it in either place.
- The leading digit restates the folder in every rule, so what the number uniquely supplies is read order rather than routing. Nothing precedence-orders rules at load, which is why the band-to-folder mapping was left alone when folder entries landed: renumbering would reach every installed target and buy nothing.

| Range     | Domain                                                                                                                                           |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `000–099` | core (constitution, testing, error handling, planning, etc.)                                                                                     |
| `100–199` | lang (TypeScript, Python, etc.)                                                                                                                  |
| `200–299` | framework (React, Tailwind, FastAPI, etc.)                                                                                                       |
| `300–399` | lib (testing libs, Zod, Pydantic, security, etc.)                                                                                                |
| `400–499` | ui (UI copy, accessibility, forms, UX completeness)                                                                                              |
| `500–599` | claude (markdown prose, markdown mechanics, .claude/ context, wireframe, canonical-doc, task-board, skill, readme, rule, and standard authoring) |

## Gotchas

- `aitk gov sync` diffs before applying and requires confirmation, so it is safe to run repeatedly.
- `aitk gov install` and `aitk gov sync` refuse to run against the toolkit root, because a target's rules are the operator's to edit. `aitk gov regen` runs against it on purpose, since the destination there is produced output rather than someone's working copy. Editing `.claude/rules/` by hand is pointless either way, as the next `bun run check` overwrites it from the source.
- A widened source rule now fails `bun run check` until the copy is committed, which is the miss that shipped a stale copy to a release. The regen propagates the change and the drift assertion turns the resulting diff into a failure. A rule matching nothing still does not error, so the gate catches the stale copy rather than the dead glob.
- `--add` extras are deduped against the stack's resolved rules. Rules already in the stack are no-ops. Unknown rule names warn but do not abort install.
- The `Unreferenced rules` stage in `scripts/core/verify.sh` reports rules no stack reaches and never fails. Its two standing findings, `260-shadcn` and `320-tanstack-query`, are opt-in libraries this repository ships on purpose, so a gate there would fail every push over the deliberate case. `GOV_EXPECTED_UNREFERENCED` in that script holds the pair, and a third rule arriving reads as new against it. Reconsider failing once a third appears and the pattern is either a library set or an accident.
- A rule authored under `governance/rules/` in a folder no stack names installs for nobody. Folder entries close that for `core` and `claude` alone, since the other four folders are still enumerated per stack.
- `scripts/lib/gov.sh` is narrowed to `rule_subdir` alone. It is called once per rule file inside a loop, so routing it through the CLI would cost a process per file, and it stays permanently because four of its five callers are sandbox scripts. The payload builder moved to `src/gov/payload.ts` and frontmatter stripping to `src/frontmatter.ts`, which `docs` shares.
- The degradation sweep matches on comment text, so a comment naming a term as an example reads as a hit. The matcher's own doc comment in `src/comments/scan.ts` is the standing case. Read a hit before treating it as a defect.
- Projects that previously installed `.cursor/rules/` from this toolkit retain those files. Sync no longer touches them. Run `rm -rf .cursor/rules/` to clean up if Cursor is no longer in use.

## Install path

Rules install per-file at `.claude/rules/<subdir>/<rule>.md` with subdirectories preserved (`core/`, `lang/`, `framework/`, `lib/`, `ui/`, `claude/`).

## Stacks

Each stack declares an optional `extends` chain and a `rules` list. An entry names a rule or a whole rule folder. The chain resolves recursively, so `react` resolves through `node` to `base` and the full deduplicated set installs.

| Stack            | Extends | Rules                                                                                                                            |
| ---------------- | ------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `base`           | -       | the `core/` and `claude/` folders whole, which is every core rule plus every claude authoring rule                               |
| `node`           | base    | 100-typescript                                                                                                                   |
| `react`          | node    | 200-react, 230-nextjs, 250-tailwind, 300-testing-ts, 310-zod, 350-security-web, 400-ui, 410-a11y, 420-forms, 430-ux-completeness |
| `astro`          | node    | 210-astro, 350-security-web, 400-ui, 410-a11y, 430-ux-completeness                                                               |
| `python`         | base    | 110-python, 330-testing-py, 340-pydantic                                                                                         |
| `python-fastapi` | python  | 220-fastapi                                                                                                                      |

## CLI

| Command            | What it does                                                      |
| ------------------ | ----------------------------------------------------------------- |
| `aitk gov install` | Bootstrap rules for a stack into `.claude/rules/`                 |
| `aitk gov sync`    | Update installed rules in target, clean up stale `.claude/GOV.md` |
| `aitk gov build`   | Concatenate installed rules into `.claude/.tmp/gov/rules.md`      |
| `aitk gov regen`   | Rebuild this repo's own `.claude/rules/` from its record          |
| `aitk gov list`    | Emit catalog of stacks, rules, and rules no stack reaches         |

Flags, arguments, and JSON shapes live in `docs/agents/index.md`. Every verb is TypeScript and carries a real commander option surface, so a mistyped flag fails with a suggestion. `list` migrated when folder entries landed: its bash matched a rules array against `"[0-9]{3}-[a-z0-9-]+"`, so a folder entry matched nothing and `base` would have reported zero rules to `setup-gov`, which dedupes `--add` extras against that list. Expanding in bash beside the resolver would have put the same rule in two languages. Commands that write files require confirmation before running, and `AITK_NON_INTERACTIVE=1` resolves each confirm prompt to its first option. The stack picker is the exception and refuses headlessly, since defaulting there chose a whole stack for the caller.

`gov list --json` carries `unreferenced` alongside `stacks` and `rules`, on every invocation rather than behind a flag. The verify stage and a session asking what a stack leaves out read one call, and the key is additive, so a consumer reading either of the other two is untouched.

## Workflow

To set up a new project:

```bash
aitk gov install react ../my-app
# resolves react → node → base, copies each rule to .claude/rules/<subdir>/<rule>.md
```

To layer extra rules on top of a stack without creating a new stack definition:

```bash
aitk gov install astro --add 200-react,260-shadcn,300-testing-ts ../my-app
# installs astro stack rules plus the three extras, deduped
```

To sync updates to an existing project:

```bash
aitk gov sync ../my-app
# diffs rules already present, removes any stale .claude/GOV.md
```

To generate a concatenated paste-payload:

```bash
aitk gov build
# strips frontmatter, concatenates rules
# writes .claude/.tmp/gov/rules.md, paste into any AI chat
```

## Frontmatter contract

Source rules carry the Claude shape directly. Path-scoped rules emit a `paths:` list, one entry per glob:

```yaml
---
description: Enforce strict Python type hints, casing, and import patterns
paths:
  - '**/*.py'
---
```

Always-on rules (core persona, testing, error handling) emit with no `paths:` key. Claude Code treats those as always-on. The legacy Cursor schema (`globs`, `alwaysApply`, `priority`) is not consumed and must not appear in source.

## How Claude Code loads rules

`.claude/rules/*.md` discovers recursively at session start. Rules without a `paths:` field always apply, with the same priority as `CLAUDE.md`. Rules with `paths:` apply when Claude reads files matching the glob. See `wiki/claude/claude-memory.md` for the loading-time details.

## Adding a new rule

Create a `.md` file anywhere under `governance/rules/` using the numbering convention above. It is auto-discovered with no other changes needed.

A rule added to `core/` or `claude/` reaches every `base` consumer with no stack edit, because `base` names both folders whole. A rule in any other folder needs its name in the `rules` array of the relevant `governance/stacks/*.toml`, and the `Unreferenced rules` stage reports it until that happens.

## Project-local rules

Target projects author their own rules that the toolkit does not ship. The `create-rule` plugin skill scaffolds one into `.claude/rules/<subdir>/<n>-<slug>.md` with the Claude frontmatter shape, picking a free number in the band that collides with neither the project nor the toolkit catalog. These rules live only in the target. `aitk gov sync` skips any rule with no toolkit source match, classified as `orphaned` by `planSync` in `src/sync/engine.ts`, so project-authored rules survive sync untouched. Numbering bands are shared with toolkit rules, so a project rule and a toolkit rule must not share a number within the same subdir.

## Adding a stack

Create a new `.toml` file in `governance/stacks/`. Set `extends` to the parent stack name or leave it empty. List rule names (without `.md`) in the `rules` array, or a folder name under `governance/rules/` to take that folder whole. No build step needed.

```toml
extends = "node"
rules = ["200-react", "250-tailwind"]
```

Take a folder whole only when the stack wants every rule in it now and every rule added to it later. A stack selecting some of a folder stays enumerated, since the list is what records that the omission was a decision.

```toml
extends = ""
rules = ["core", "claude"]
```
