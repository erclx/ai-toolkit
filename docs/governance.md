# Governance system

## Overview

Governance manages the rules that guide AI agents working in projects. Rules sync as `.mdc` files for Cursor, organized by domain and installed per stack.

## Structure

```plaintext
.cursor/rules/         ← source rules (.mdc), organized by domain
.cursor/stacks/        ← stack definitions (.toml), declare which rules belong to a stack
scripts/
├── gov/
│   ├── install.sh      ← bootstraps rules for a stack into a target project
│   └── sync.sh         ← syncs existing rules to external projects
└── manage-gov.sh       ← entry point (aitk gov)
```

## Key decisions

Rules flatten on sync. They live in subdirectories by domain (`core/`, `lang/`, `framework/`, `lib/`, `workflow/`) for toolkit organization, then flatten into `.cursor/rules/` on sync because Cursor reads rules flat.

Rules follow a numbering scheme by domain. When adding a rule, pick a number in the appropriate range:

| Range     | Domain                                             |
| --------- | -------------------------------------------------- |
| `000–099` | core (constitution, testing, error handling, etc.) |
| `100–199` | lang (TypeScript, etc.)                            |
| `200–299` | framework (React, Tailwind, Shadcn, etc.)          |
| `300–399` | lib (testing libs, Zod, TanStack, security, etc.)  |
| `900+`    | workflow (Node, tooling, etc.)                     |

**Install vs sync** are separate concerns. `aitk gov install` bootstraps a project with all rules for a given stack — it overwrites. `aitk gov sync` updates rules already present in the target — it never adds new files. Use install once to set up, use sync to keep up to date.

Stacks live in `.cursor/stacks/` as toml files. Each stack declares an optional `extends` chain and a flat `rules` list. The extends chain resolves recursively, so `react` → `node` → `base` and the full deduplicated rule set is installed.

## Stacks

| Stack    | Extends | Rules                                                                                  |
| -------- | ------- | -------------------------------------------------------------------------------------- |
| `base`   | —       | 000–060 core rules                                                                     |
| `node`   | base    | 100-typescript, 900-node                                                               |
| `react`  | node    | 200-react, 250-tailwind, 300-testing-ts, 310-zod, 320-tanstack-query, 350-security-web |
| `python` | base    | stub — add python rules when available                                                 |

## CLI

| Command                           | What it does                                            |
| --------------------------------- | ------------------------------------------------------- |
| `aitk gov install [stack] [path]` | Bootstrap rules for a stack into a target project       |
| `aitk gov sync [path]`            | Update rules already present in target (never adds new) |

`aitk gov` with no args shows a picker: `install` or `sync`.

## Workflow

To set up a new project:

```bash
aitk gov install react ../my-app
# resolves react → node → base, copies all matching rules
```

To sync updates to an existing project:

```bash
aitk gov sync ../my-app
# only diffs rules already present — never adds new files
```

## Adding a new rule

Create a `.mdc` file anywhere under `.cursor/rules/` using the numbering convention above. It is auto-discovered with no other changes needed. To include it in a stack, add it to the `rules` array in the relevant `.cursor/stacks/*.toml` file.

## Adding a stack

Create a new `.toml` file in `.cursor/stacks/`. Set `extends` to the parent stack name or leave it empty. List rule names (without `.mdc`) in the `rules` array. No build step needed.

```toml
extends = "node"
rules = ["200-react", "250-tailwind"]
```

## Notes

- `aitk gov sync` diffs before applying and requires confirmation, so it is safe to run repeatedly.
- Install overwrites existing rules intentionally. Delete rules you don't need after install rather than creating optional/addon complexity in stack definitions.
