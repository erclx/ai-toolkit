---
title: Governance
description: Cursor rules, stacks, install and sync
category: Domain references
---

# Governance system

## Overview

Governance manages the rules that guide AI agents working in projects. Rules sync as `.mdc` files for Cursor, organized by domain and installed per stack.

## Structure

```plaintext
governance/rules/      ← source rules (.mdc), organized by domain
governance/stacks/     ← stack definitions (.toml), declare which rules belong to a stack
scripts/
├── gov/
│   ├── install.sh      ← bootstraps rules for a stack into a target project
│   ├── sync.sh         ← syncs existing rules to external projects
│   └── build.sh        ← concatenates installed rules into .cursor/.tmp/gov/rules.md
├── lib/
│   └── gov.sh          ← shared functions: strip_frontmatter, build_rules_payload (sourced by gov/build.sh and claude/prompt.sh)
└── manage-gov.sh       ← entry point (aitk gov)
```

## Key decisions

Rules flatten on sync. They live in subdirectories by domain (`core/`, `lang/`, `framework/`, `lib/`, `ui/`) under `governance/rules/` for toolkit organization, then flatten into `.cursor/rules/` on sync because Cursor reads rules flat.

Rules follow a numbering scheme by domain. When adding a rule, pick a number in the appropriate range:

| Range     | Domain                                                       |
| --------- | ------------------------------------------------------------ |
| `000–099` | core (constitution, testing, error handling, planning, etc.) |
| `100–199` | lang (TypeScript, etc.)                                      |
| `200–299` | framework (React, Tailwind, shadcn, etc.)                    |
| `300–399` | lib (testing libs, Zod, TanStack, security, etc.)            |
| `400–499` | ui (UI copy, accessibility, forms, UX completeness)          |

**Install vs sync vs build** are separate concerns. `aitk gov install` bootstraps a project with all rules for a given stack (it overwrites). `aitk gov sync` updates rules already present in the target. It never adds new files. `aitk gov build` concatenates installed rules into a single clean file at `.cursor/.tmp/gov/rules.md`, stripping frontmatter. This is useful for pasting rules into any AI chat directly. Use install once to set up, sync to keep up to date, build to generate the rules payload.

Stacks live in `governance/stacks/` as toml files. Each stack declares an optional `extends` chain and a flat `rules` list. The extends chain resolves recursively, so `react` → `node` → `base` and the full deduplicated rule set is installed.

## Stacks

| Stack     | Extends | Rules                                                                                                                |
| --------- | ------- | -------------------------------------------------------------------------------------------------------------------- |
| `base`    | -       | 000–070 core rules                                                                                                   |
| `node`    | base    | 100-typescript                                                                                                       |
| `react`   | node    | 200-react, 250-tailwind, 300-testing-ts, 310-zod, 350-security-web, 400-ui, 410-a11y, 420-forms, 430-ux-completeness |
| `astro`   | node    | 210-astro, 350-security-web, 400-ui, 410-a11y, 430-ux-completeness                                                   |
| `planner` | -       | 400-ui, used by `aitk claude prompt` to inject UI copy rules into PLANNER.md. Not installed into projects            |

## CLI

| Command                                         | What it does                                               |
| ----------------------------------------------- | ---------------------------------------------------------- |
| `aitk gov install [stack] [--add rules] [path]` | Bootstrap rules for a stack into a target project          |
| `aitk gov sync [path]`                          | Update rules already present in target (never adds new)    |
| `aitk gov build [path]`                         | Concatenate installed rules into .cursor/.tmp/gov/rules.md |
| `aitk gov list [--stacks\|--rules] [--json]`    | Emit catalog of stacks and rules                           |

`aitk gov` with no args shows an interactive picker for `install`, `sync`, `build`, or `list`. Commands that write files require confirmation before running.

## Workflow

To set up a new project:

```bash
aitk gov install react ../my-app
# resolves react → node → base, copies all matching rules
```

To layer extra rules on top of a stack without creating a new stack definition:

```bash
aitk gov install astro --add 200-react,260-shadcn,300-testing-ts ../my-app
# installs astro stack rules plus the three extras, deduped
```

To sync updates to an existing project:

```bash
aitk gov sync ../my-app
# only diffs rules already present, never adds new files
```

To generate a concatenated rules file:

```bash
aitk gov build
# strips frontmatter, concatenates all .mdc files
# writes .cursor/.tmp/gov/rules.md, paste into any AI chat
```

To inspect available stacks and rules:

```bash
aitk gov list                       # formatted catalog
aitk gov list --json                # machine-readable, for skills and scripts
aitk gov list --stacks              # stacks only
```

`aitk claude prompt` uses the same underlying logic from `scripts/lib/gov.sh` to inject rules into IMPLEMENTER.md.

`aitk claude gov` also uses `scripts/lib/gov.sh` to build `.claude/GOV.md`, a file loaded automatically by Claude Code to provide session-level governance context. This differs from `aitk gov build`, which is for generating a single-use rules payload for pasting into other AI chat environments.

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
- Install overwrites existing rules intentionally. Delete rules you don't need after install rather than creating optional/addon complexity in stack definitions.
- `--add` extras are deduped against the stack's resolved rules. Rules already in the stack are no-ops. Unknown rule names warn but do not abort install.
- `strip_frontmatter` and `build_rules_payload` live in `scripts/lib/gov.sh` and are sourced by both `gov/build.sh` and `claude/prompt.sh`. `build_rules_payload` accepts an optional space-separated filter of rule names. When provided, only those rules are included in the payload.
