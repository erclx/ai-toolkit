---
title: Governance
description: Path-scoped Claude rules, stacks, install and sync
---

# Governance system

## Overview

Owns the rules that steer AI agents working in a project. Source rules live here as `.md` files under `governance/rules/` and install to `.claude/rules/` in a target, where Claude Code reads them natively. Stacks group rules so one install command provisions a whole toolchain. The rules themselves are content, not code, so the domain is a catalog plus three commands rather than a system with runtime behavior.

## Layout

- `governance/rules/` owns the source rules, organized into one subfolder per numbering band
- `governance/stacks/` owns stack definitions as toml, each declaring an optional extends chain and a flat rules list
- `internal/rules/` owns rules that govern toolkit authoring alone, installed into this repo's copy and shipped to no target
- `internal/governance.toml` records which stack and extras this repo consumes, and `src/gov/consumed.ts` produces the copy from it
- `src/sync/engine.ts` owns the shared sync engine every domain runs on
- `src/gov/` owns the gov half: the adapter that feeds the engine, and the rules payload builder behind `build`
- `scripts/gov/` owns the list entry point, the one verb still on bash
- `src/gov/` owns the stack reader, the rule lookup, and the install copy

## Decisions

- Source rules carry the Claude shape directly, so install is a passthrough copy rather than a transform. Nothing generates a rule, which keeps the source readable and the install trivial.
- Rules live in subdirectories by domain and install preserves that layout. A flat folder would make the numbering bands the only grouping signal.
- Install, sync, and build are separate concerns rather than flags on one command. Install bootstraps a stack and overwrites. Sync updates only what is already present and never adds. Build concatenates into a paste payload. Collapsing them would mean guessing intent from target state.
- Install overwrites existing rules on purpose. Delete rules you do not want after install rather than adding optional or addon complexity to stack definitions.
- Gov is the first domain on the shared sync engine, and it went first because its source lookup is the thinnest of the four. The engine owns target validation, the scan report, the prompt, and the apply loop. The adapter supplies two things only: where a destination file's source lives, and what counts as a change beyond a content diff.
- Sync matches an installed rule to its source by rule name rather than by relative path. A rule that moves between bands in the toolkit still syncs into the subdirectory the target already uses, so a reorganization here does not strand installed copies.
- `510-context` carries a write-time policy alongside its read-time one, so editing a domain leaves its context entry conforming. It ships in `base.toml` to every consumer, so the bullet states an outcome of the edit rather than a backlog to drain, which is the only phrasing that also reads correctly in a project with no entries yet.
- Every standard that governs a file path carries a rule routing to it, so an edit loads the standard without the matching skill being invoked. `595-tooling-reference` is toolkit-local and is authored under `internal/rules/claude/`, because `internal/standards/tooling-reference.md` governs a surface a target never authors and shipping the route would point at a path no install creates. It sits in `internal/` rather than `governance/rules/` so location enforces the boundary, the same way the internal standards and snippets do.
- The toolkit's own `.claude/rules/` is produced from `internal/governance.toml` rather than copied by hand. The record names one stack and its extras, `aitk gov regen` resolves it through the same stack machinery an install uses, and anything under `internal/rules/` installs alongside. Recording the subset stops the producer from reading its own output to decide what that output should be.
- Registering a new rule for this repository means naming it somewhere the record resolves, not writing it into `.claude/rules/`. Add it to a stack in `governance/stacks/`, to the `add` list in `internal/governance.toml`, or to `internal/rules/` when it governs toolkit authoring alone. A rule with a source that no stack names never installs, and the drift assertion still passes because the copy matches what the record resolves to. A file written into `.claude/rules/` by hand is deleted on the next `bun run check`.
- `standards/versioning.md` is deliberately unrouted. It governs commit subjects, PR titles, and git tags, none of which are files, so a path-scoped rule has nothing to match and would never fire. `git-commit` and `git-pr` reach that surface by instruction instead, and what catches a leak there is a check rather than a route.
- Rules follow a numbering scheme by band, so a new rule's number states its domain without opening it.

| Range     | Domain                                                                                                                       |
| --------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `000–099` | core (constitution, testing, error handling, planning, etc.)                                                                 |
| `100–199` | lang (TypeScript, Python, etc.)                                                                                              |
| `200–299` | framework (React, Tailwind, FastAPI, etc.)                                                                                   |
| `300–399` | lib (testing libs, Zod, Pydantic, security, etc.)                                                                            |
| `400–499` | ui (UI copy, accessibility, forms, UX completeness)                                                                          |
| `500–599` | claude (markdown prose, .claude/ context, wireframe, canonical-doc, task-board, skill, readme, rule, and standard authoring) |

## Gotchas

- `aitk gov sync` diffs before applying and requires confirmation, so it is safe to run repeatedly.
- `aitk gov install` and `aitk gov sync` refuse to run against the toolkit root, because a target's rules are the operator's to edit. `aitk gov regen` runs against it on purpose, since the destination there is produced output rather than someone's working copy. Editing `.claude/rules/` by hand is pointless either way, as the next `bun run check` overwrites it from the source.
- A widened source rule now fails `bun run check` until the copy is committed, which is the miss that cost `v33.1`. The regen propagates the change and the drift assertion turns the resulting diff into a failure. A rule matching nothing still does not error, so the gate catches the stale copy rather than the dead glob.
- `--add` extras are deduped against the stack's resolved rules. Rules already in the stack are no-ops. Unknown rule names warn but do not abort install.
- `scripts/lib/gov.sh` is narrowed to `rule_subdir` alone. It is called once per rule file inside a loop, so routing it through the CLI would cost a process per file, and it stays permanently because four of its five callers are sandbox scripts. The payload builder moved to `src/gov/payload.ts` and frontmatter stripping to `src/frontmatter.ts`, which `docs` shares.
- `aitk gov sync` and `aitk gov build` no longer offer a `Review diffs` branch. It was the last path that shelled out to `code --diff`, which hangs a headless agent, and the tooling sync dropped it one step earlier.
- Projects that previously installed `.cursor/rules/` from this toolkit retain those files. Sync no longer touches them. Run `rm -rf .cursor/rules/` to clean up if Cursor is no longer in use.

## Install path

Rules install per-file at `.claude/rules/<subdir>/<rule>.md` with subdirectories preserved (`core/`, `lang/`, `framework/`, `lib/`, `ui/`, `claude/`).

## Stacks

Each stack declares an optional `extends` chain and a flat `rules` list. The chain resolves recursively, so `react` resolves through `node` to `base` and the full deduplicated set installs.

| Stack            | Extends | Rules                                                                                                                                         |
| ---------------- | ------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `base`           | -       | 000–080 core rules, 500–591 claude authoring (prose, context, wireframes, canonical docs, tasks, skills, readme, rule and standard authoring) |
| `node`           | base    | 100-typescript                                                                                                                                |
| `react`          | node    | 200-react, 230-nextjs, 250-tailwind, 300-testing-ts, 310-zod, 350-security-web, 400-ui, 410-a11y, 420-forms, 430-ux-completeness              |
| `astro`          | node    | 210-astro, 350-security-web, 400-ui, 410-a11y, 430-ux-completeness                                                                            |
| `python`         | base    | 110-python, 330-testing-py, 340-pydantic                                                                                                      |
| `python-fastapi` | python  | 220-fastapi                                                                                                                                   |

## CLI

| Command            | What it does                                                      |
| ------------------ | ----------------------------------------------------------------- |
| `aitk gov install` | Bootstrap rules for a stack into `.claude/rules/`                 |
| `aitk gov sync`    | Update installed rules in target, clean up stale `.claude/GOV.md` |
| `aitk gov build`   | Concatenate installed rules into `.claude/.tmp/gov/rules.md`      |
| `aitk gov regen`   | Rebuild this repo's own `.claude/rules/` from its record          |
| `aitk gov list`    | Emit catalog of stacks and rules                                  |

Flags, arguments, and JSON shapes live in `docs/agents.md`. `install`, `sync`, and `build` are TypeScript and carry real commander option surfaces, so a mistyped flag fails with a suggestion. `list` still execs bash. Commands that write files require confirmation before running, and `AITK_NON_INTERACTIVE=1` resolves each confirm prompt to its first option. The stack picker is the exception and refuses headlessly, since defaulting there chose a whole stack for the caller.

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

`.claude/rules/*.md` discovers recursively at session start. Rules without a `paths:` field always apply, with the same priority as `CLAUDE.md`. Rules with `paths:` apply when Claude reads files matching the glob. See `wiki/claude-memory.md` for the loading-time details.

## Adding a new rule

Create a `.md` file anywhere under `governance/rules/` using the numbering convention above. It is auto-discovered with no other changes needed. To include it in a stack, add it to the `rules` array in the relevant `governance/stacks/*.toml` file.

## Project-local rules

Target projects author their own rules that the toolkit does not ship. The `create-rule` plugin skill scaffolds one into `.claude/rules/<subdir>/<n>-<slug>.md` with the Claude frontmatter shape, picking a free number in the band that collides with neither the project nor the toolkit catalog. These rules live only in the target. `aitk gov sync` skips any rule with no toolkit source match, classified as `orphaned` by `planSync` in `src/sync/engine.ts`, so project-authored rules survive sync untouched. Numbering bands are shared with toolkit rules, so a project rule and a toolkit rule must not share a number within the same subdir.

## Adding a stack

Create a new `.toml` file in `governance/stacks/`. Set `extends` to the parent stack name or leave it empty. List rule names (without `.md`) in the `rules` array. No build step needed.

```toml
extends = "node"
rules = ["200-react", "250-tailwind"]
```
