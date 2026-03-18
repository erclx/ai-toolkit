# Scripts reference

## Overview

`scripts/` contains all CLI entry points, core maintenance scripts, sandbox provisioning, and shared library functions. Entry points delegate to subcommands; lib functions are sourced, never executed directly.

## Structure

```plaintext
scripts/
├── manage-aitk.sh       ← top-level aitk dispatcher
├── manage-gov.sh        ← aitk gov entry point
├── manage-standards.sh  ← aitk standards entry point
├── manage-claude.sh     ← aitk claude entry point
├── manage-sandbox.sh    ← aitk sandbox entry point
├── manage-tooling.sh    ← aitk tooling entry point
├── config.sh            ← shared project config (GITHUB_ORG, DEFAULT_GEMINI_MODEL)
├── core/
│   ├── verify.sh        ← runs all checks: format, spell, shell
│   ├── update.sh        ← interactive dependency update + verify
│   ├── clean.sh         ← wipes node_modules, clears cache, reinstalls
│   └── snapshot.sh      ← writes PROJECT-SNAPSHOT.md to .claude/.tmp/project/
├── gov/
│   ├── install.sh       ← bootstraps rules for a stack into a target project
│   ├── sync.sh          ← diffs and updates rules already present in target
│   └── build.sh         ← concatenates installed rules into .cursor/.tmp/rules.md
├── tooling/
│   ├── sync.sh          ← full tooling sync: configs, seeds, deps, scripts, gitignore
│   ├── ref.sh           ← drops reference docs only
│   └── create.sh        ← creates new stack stub
├── claude/
│   └── prompt.sh        ← generates master prompts from installed rules + context docs
├── sandbox/             ← scenario scripts, see docs/sandbox.md
└── lib/
    ├── ui.sh            ← logging functions, color palette, select_option
    ├── inject.sh        ← tooling injection helpers: configs, seeds, gitignore, deps
    └── gov.sh           ← strip_frontmatter, build_rules_payload
```

## Core scripts

| Script        | `bun run`  | What it does                                                                                   |
| ------------- | ---------- | ---------------------------------------------------------------------------------------------- |
| `verify.sh`   | `check`    | Runs format, format check, spell check, shell check in sequence                                |
| `update.sh`   | `update`   | Interactive dep update via `bun update --interactive`, then verify                             |
| `clean.sh`    | `clean`    | Wipes `node_modules/`, clears bun cache, reinstalls from lockfile                              |
| `snapshot.sh` | `snapshot` | Writes project file tree to `.claude/.tmp/project/PROJECT-SNAPSHOT.md` for Claude chat context |

## lib

**`ui.sh`**: source this in any script that needs terminal output. Provides the color palette, all `log_*` functions, interactive prompts (`select_option`, `ask`), and `require_project_root`.

**`inject.sh`**: tooling injection helpers used by `tooling/sync.sh` and sandbox scripts. The key distinction: configs always overwrite, seeds merge-only. `inject_tooling_manifest` is the orchestrator; it ties together missing dep installation, script injection, and gitignore merging in one call.

**`gov.sh`**: sourced by both `gov/build.sh` and `claude/prompt.sh`. Contains `build_rules_payload`, which strips frontmatter and concatenates `.mdc` files into a temp file. Both consumers call the same function. Don't duplicate this logic if adding a third.
