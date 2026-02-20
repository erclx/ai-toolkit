# Governance System

## Overview

Governance manages the rules and standards that guide AI agents (Cursor, Gemini) working in projects. Rules compile into `.toml` artifacts for Gemini and sync as `.mdc` files for Cursor. Standards are markdown docs injected as context.

## Structure

```
.cursor/rules/         ← source rules (.mdc), organized by domain
standards/             ← source standards (.md)
gemini/commands/gov/
├── rules.toml         ← compiled artifact, do not edit directly
└── standards.toml     ← compiled artifact, do not edit directly
scripts/
├── build-gov.sh       ← compiles sources into .toml artifacts
├── sync-gov.sh        ← syncs rules/standards to external projects
└── manage-gov.sh      ← entry point (gdev gov)
```

## Key Decisions

**Rules flatten on sync.** Rules live in subdirectories by domain (`core/`, `lang/`, `framework/`, `lib/`, `workflow/`) for toolkit organization. On sync, they flatten into `.cursor/rules/` because Cursor reads rules flat.

**Rules follow a numbering scheme by domain.** When adding a rule, pick a number in the appropriate range:

| Range     | Domain                                             |
| --------- | -------------------------------------------------- |
| `000–099` | core (constitution, testing, error handling, etc.) |
| `100–199` | lang (TypeScript, etc.)                            |
| `200–299` | framework (React, Tailwind, etc.)                  |
| `300–399` | lib (testing libs, Zod, TanStack, security, etc.)  |
| `900+`    | workflow (Node, tooling, etc.)                     |

**Standards cover developer workflow conventions**, not code style. Current standards: branch, changelog, commit, PR, prose, readme. Code style belongs in rules.

**Compiled artifacts are committed.** `rules.toml` and `standards.toml` are generated but committed so Gemini commands work without a build step on first use.

**Build detects changes via git.** `build-gov.sh` diffs source files against the last build commit. It recompiles only when sources or templates change, then auto-commits the updated artifacts.

## CLI

| Command                | What it does                                          |
| ---------------------- | ----------------------------------------------------- |
| `gdev gov build`       | Scan for changes, recompile `.toml` artifacts, commit |
| `gdev gov sync [path]` | Push rules and/or standards to a target project       |

`gdev gov` with no args shows a picker: `build` or `sync`.

## Workflow

Typical rule update cycle: edit or add a `.mdc` file in `.cursor/rules/`, run `gdev gov build`, then `gdev gov sync ../my-app` to push to target projects.

To sync to a new project:

```bash
gdev gov sync ../my-app
# pick scope: Rules + Standards / Rules only / Standards only
```

## Adding a New Rule or Standard

**Rule:** Add a `.mdc` file anywhere under `.cursor/rules/` using the numbering convention above. Run `gdev gov build`. It's auto-discovered, no other changes needed.

**Standard:** Add a `.md` file to `standards/` and run `gdev gov build`.

## Notes

- `gemini/commands/gov/rules.toml` and `standards.toml` are overwritten on every build. Never edit them directly
- Adding a new compilable target type is one line in the `BUILD_TARGETS` array in `build-gov.sh`
- `gdev gov sync` diffs before applying and requires confirmation, so it's safe to run repeatedly
