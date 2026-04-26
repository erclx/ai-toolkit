---
title: Governance
description: Path-scoped Claude rules, optional Cursor adapter, stacks, install and sync
category: Domain references
---

# Governance system

## Overview

Governance manages the rules that guide AI agents working in projects. Source rules live in the toolkit as `.mdc` files. On install they are written to one or both of two surfaces: `.claude/rules/` for Claude Code (default) and `.cursor/rules/` for Cursor (opt-in).

## Structure

```plaintext
governance/rules/      ← source rules (.mdc), organized by domain
governance/stacks/     ← stack definitions (.toml), declare which rules belong to a stack
scripts/
├── gov/
│   ├── install.sh      ← bootstraps rules for a stack into a target project
│   ├── sync.sh         ← syncs existing rules and removes stale .claude/GOV.md
│   └── build.sh        ← concatenates installed rules into .claude/.tmp/gov/rules.md
├── lib/
│   └── gov.sh          ← shared functions: strip_frontmatter, build_rules_payload, transform_to_claude_rule, rule_subdir
└── manage-gov.sh       ← entry point (aitk gov)
```

## Targets

The toolkit installs to two surfaces. Default is Claude only.

- **Claude (`.claude/rules/`)**: rules install per-file at `.claude/rules/<subdir>/<rule>.md` with subdirectories preserved (`core/`, `lang/`, `framework/`, `lib/`, `ui/`). Frontmatter is transformed on install: source `globs:` becomes Claude's `paths:` list, `alwaysApply: true` emits with no `paths:` key (always-on), and the `.mdc` extension flips to `.md`. Claude Code reads these natively.
- **Cursor (`.cursor/rules/`)**: rules flatten into a single directory, file extension stays `.mdc`, frontmatter passes through unchanged. Cursor reads rules flat.

Pick the target with `--target claude|cursor|both`. Default is `claude`.

## Key decisions

Source rules live in subdirectories by domain (`core/`, `lang/`, `framework/`, `lib/`, `ui/`) under `governance/rules/`. The Claude target preserves that layout. The Cursor target flattens.

Rules follow a numbering scheme by domain. When adding a rule, pick a number in the appropriate range:

| Range     | Domain                                                       |
| --------- | ------------------------------------------------------------ |
| `000–099` | core (constitution, testing, error handling, planning, etc.) |
| `100–199` | lang (TypeScript, Python, etc.)                              |
| `200–299` | framework (React, Tailwind, FastAPI, etc.)                   |
| `300–399` | lib (testing libs, Zod, Pydantic, security, etc.)            |
| `400–499` | ui (UI copy, accessibility, forms, UX completeness)          |

**Install vs sync vs build** are separate concerns. `aitk gov install` bootstraps a project with all rules for a given stack (it overwrites). `aitk gov sync` updates rules already present in the target and removes any stale `.claude/GOV.md` left from the retired build. It never adds new files. `aitk gov build` concatenates installed rules into a single clean file at `.claude/.tmp/gov/rules.md`, stripping frontmatter. Useful for pasting rules into any AI chat directly. Use install once to set up, sync to keep up to date, build to generate the paste payload.

Stacks live in `governance/stacks/` as toml files. Each stack declares an optional `extends` chain and a flat `rules` list. The extends chain resolves recursively, so `react` → `node` → `base` and the full deduplicated rule set is installed.

## Stacks

| Stack            | Extends | Rules                                                                                                                |
| ---------------- | ------- | -------------------------------------------------------------------------------------------------------------------- |
| `base`           | -       | 000–070 core rules                                                                                                   |
| `node`           | base    | 100-typescript                                                                                                       |
| `react`          | node    | 200-react, 250-tailwind, 300-testing-ts, 310-zod, 350-security-web, 400-ui, 410-a11y, 420-forms, 430-ux-completeness |
| `astro`          | node    | 210-astro, 350-security-web, 400-ui, 410-a11y, 430-ux-completeness                                                   |
| `python`         | base    | 110-python, 330-testing-py, 340-pydantic                                                                             |
| `python-fastapi` | python  | 220-fastapi                                                                                                          |
| `planner`        | -       | 400-ui, used by `aitk claude prompt` to inject UI copy rules into PLANNER.md. Not installed into projects            |

## CLI

| Command                                                      | What it does                                                                 |
| ------------------------------------------------------------ | ---------------------------------------------------------------------------- |
| `aitk gov install [stack] [--add rules] [--target T] [path]` | Bootstrap rules for a stack. `--target` is claude (default), cursor, or both |
| `aitk gov sync [path]`                                       | Update installed rules in target, clean up stale `.claude/GOV.md`            |
| `aitk gov build [path]`                                      | Concatenate installed rules into `.claude/.tmp/gov/rules.md`                 |
| `aitk gov list [--stacks\|--rules] [--json]`                 | Emit catalog of stacks and rules                                             |

`aitk gov` with no args shows an interactive picker for `install`, `sync`, `build`, or `list`. Commands that write files require confirmation before running.

## Workflow

To set up a new project:

```bash
aitk gov install react ../my-app
# resolves react → node → base, transforms each rule, writes to .claude/rules/<subdir>/<rule>.md
```

To install both Claude and Cursor surfaces in one call:

```bash
aitk gov install react --target both ../my-app
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

To inspect available stacks and rules:

```bash
aitk gov list                       # formatted catalog
aitk gov list --json                # machine-readable, for skills and scripts
aitk gov list --stacks              # stacks only
```

`aitk claude prompt` uses the same underlying logic from `scripts/lib/gov.sh` to inject rules into IMPLEMENTER.md.

## Frontmatter contract

Source `.mdc` rules carry Cursor-shaped frontmatter:

```yaml
---
description: Enforce strict Python type hints, casing, and import patterns
globs: '**/*.py'
alwaysApply: false
priority: 110
---
```

`transform_to_claude_rule` rewrites it for the Claude target:

```yaml
---
description: Enforce strict Python type hints, casing, and import patterns
paths:
  - '**/*.py'
---
```

Rules with `alwaysApply: true` emit with no `paths:` key, which Claude Code treats as always-on. `priority` is dropped because Claude Code does not use it.

## How Claude Code loads rules

`.claude/rules/*.md` discovers recursively at session start. Rules without a `paths:` field always apply, with the same priority as `CLAUDE.md`. Rules with `paths:` apply when Claude reads files matching the glob. See `wiki/claude-memory.md` for the loading-time details.

## Adding a new rule

Create a `.mdc` file anywhere under `governance/rules/` using the numbering convention above. It is auto-discovered with no other changes needed. To include it in a stack, add it to the `rules` array in the relevant `governance/stacks/*.toml` file.

## Adding a stack

Create a new `.toml` file in `governance/stacks/`. Set `extends` to the parent stack name or leave it empty. List rule names (without `.mdc`) in the `rules` array. No build step needed.

```toml
extends = "node"
rules = ["200-react", "250-tailwind"]
```

## Notes

- `aitk gov sync` diffs before applying and requires confirmation, so it is safe to run repeatedly.
- Install overwrites existing rules intentionally. Delete rules you don't need after install rather than creating optional or addon complexity in stack definitions.
- `--add` extras are deduped against the stack's resolved rules. Rules already in the stack are no-ops. Unknown rule names warn but do not abort install.
- `strip_frontmatter`, `build_rules_payload`, `transform_to_claude_rule`, and `rule_subdir` live in `scripts/lib/gov.sh`. `build_rules_payload` accepts an optional space-separated filter of rule names and an extension pattern (`*.mdc` or `*.md`).
