# Governance System

## Overview

Governance manages the rules and standards that guide AI agents working in projects. Rules compile into a `.toml` artifact for Gemini and sync as `.mdc` files for Cursor. Standards are markdown docs synced directly to target projects.

## Structure

```
.cursor/rules/         ← source rules (.mdc), organized by domain
standards/             ← source standards (.md)
gemini/commands/gov/
└── rules.toml         ← compiled artifact, do not edit directly
scripts/
├── build-gov.sh       ← compiles rules into .toml artifact
├── sync-gov.sh        ← syncs rules/standards to external projects
└── manage-gov.sh      ← entry point (gdev gov)
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

Standards cover developer workflow conventions, not code style. Current standards: branch, changelog, commit, PR, prose, readme. Code style belongs in rules. Standards are the same across every project, so they sync directly without a compilation step.

`rules.toml` is generated but committed so Gemini commands work without a build step on first use. `build-gov.sh` diffs source files against the last build commit, recompiles only when sources or the template change, then auto-commits the updated artifact.

## CLI

| Command                | What it does                                     |
| ---------------------- | ------------------------------------------------ |
| `gdev gov build`       | Scan for changes, recompile `rules.toml`, commit |
| `gdev gov sync [path]` | Push rules and/or standards to a target project  |

`gdev gov` with no args shows a picker: `build` or `sync`.

## Workflow

Typical rule update cycle: edit or add a `.mdc` file in `.cursor/rules/`, run `gdev gov build`, then `gdev gov sync ../my-app` to push to target projects.

To sync to a new project:

```bash
gdev gov sync ../my-app
# pick scope: Rules + Standards / Rules only / Standards only
```

## Adding a New Rule or Standard

To add a rule, create a `.mdc` file anywhere under `.cursor/rules/` using the numbering convention above, then run `gdev gov build`. It is auto-discovered with no other changes needed.

To add a standard, create a `.md` file in `standards/`. No build step needed. Standards sync directly.

## Notes

- `gemini/commands/gov/rules.toml` is overwritten on every build. Never edit it directly.
- Adding a new compilable target type is one line in the `BUILD_TARGETS` array in `build-gov.sh`.
- `gdev gov sync` diffs before applying and requires confirmation, so it is safe to run repeatedly.
