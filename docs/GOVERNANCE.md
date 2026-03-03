# Governance System

## Overview

Governance manages the rules and standards that guide AI agents working in projects. Rules sync as `.mdc` files for Cursor. Standards are markdown docs synced directly to target projects.

## Structure

```
.cursor/rules/         ← source rules (.mdc), organized by domain
.cursor/stacks/        ← stack definitions (.toml), declare which rules belong to a stack
standards/             ← source standards (.md)
scripts/
├── install-gov.sh      ← bootstraps rules for a stack into a target project
├── sync-gov.sh         ← syncs existing rules to external projects
├── manage-gov.sh       ← entry point (gdev gov)
└── manage-standards.sh ← entry point (gdev standards)
```

## Key Decisions

Rules flatten on sync. They live in subdirectories by domain (`core/`, `lang/`, `framework/`, `lib/`, `workflow/`) for toolkit organization, then flatten into `.cursor/rules/` on sync because Cursor reads rules flat.

Rules follow a numbering scheme by domain. When adding a rule, pick a number in the appropriate range:

| Range     | Domain                                             |
| --------- | -------------------------------------------------- |
| `000–099` | core (constitution, testing, error handling, etc.) |
| `100–199` | lang (TypeScript, etc.)                            |
| 200–299   | framework (React, Tailwind, Shadcn, etc.)          |
| `300–399` | lib (testing libs, Zod, TanStack, security, etc.)  |
| `900+`    | workflow (Node, tooling, etc.)                     |

**Install vs sync** are separate concerns. `gdev gov install` bootstraps a project with all rules for a given stack — it overwrites. `gdev gov sync` updates rules already present in the target — it never adds new files. Use install once to set up, use sync to keep up to date.

Stacks live in `.cursor/stacks/` as toml files. Each stack declares an optional `extends` chain and a flat `rules` list. The extends chain resolves recursively, so `react` → `node` → `base` and the full deduplicated rule set is installed. This mirrors the same pattern used by tooling manifests.

Standards cover developer workflow conventions, not code style. Current standards: branch, changelog, commit, PR, prose, readme. Code style belongs in rules. Standards are the same across every project, so they sync directly without a compilation step.

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
| `gdev gov install [stack] [path]` | Bootstrap rules for a stack into a target project       |
| `gdev gov sync [path]`            | Update rules already present in target (never adds new) |
| `gdev standards install [path]`   | Copy all standards into a target project (overwrites)   |
| `gdev standards sync [path]`      | Update standards already present in target              |

`gdev gov` with no args shows a picker: `install` or `sync`. Same for `gdev standards`.

## Workflow

To set up a new project:

```bash
gdev gov install react ../my-app
# resolves react → node → base, copies all matching rules

gdev standards install ../my-app
# copies all standards into ../my-app/standards/
```

To sync updates to an existing project:

```bash
gdev gov sync ../my-app
# only diffs rules already present — never adds new files

gdev standards sync ../my-app
# diffs standards already present, proposes new ones too
```

## Adding a New Rule

Create a `.mdc` file anywhere under `.cursor/rules/` using the numbering convention above. It is auto-discovered with no other changes needed. To include it in a stack, add it to the `rules` array in the relevant `.cursor/stacks/*.toml` file.

## Adding a Stack

Create a new `.toml` file in `.cursor/stacks/`. Set `extends` to the parent stack name or leave it empty. List rule names (without `.mdc`) in the `rules` array. No build step needed — install reads stacks directly.

```toml
extends = "node"
rules = ["200-react", "250-tailwind"]
```

## Adding a Standard

Create a `.md` file in `standards/`. No build step needed. Run `gdev standards install` to push to a new project or `gdev standards sync` to update an existing one.

## Notes

- `gdev gov sync` diffs before applying and requires confirmation, so it is safe to run repeatedly.
- `gdev standards install` overwrites all standards intentionally, mirroring `gdev gov install`.
- `gdev standards sync` only updates files already present — never adds new ones.
- Install overwrites existing rules intentionally. Delete rules you don't need after install rather than creating optional/addon complexity in stack definitions.
