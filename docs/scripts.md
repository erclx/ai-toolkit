# Scripts reference

## Overview

`src/` is the TypeScript CLI entry point. It uses commander to register subcommands and execa to dispatch each one to the corresponding `manage-*.sh` script in `scripts/`. All domain logic remains in bash. Use `@/` absolute imports (mapped to `src/` in `tsconfig.json`).

`scripts/` contains core maintenance scripts, sandbox provisioning, domain entry points, and shared library functions. Lib functions are sourced, never executed directly. Each `manage-*.sh` dispatches to subcommands only: no domain logic lives in entry points directly.

## Structure

```plaintext
src/
├── cli.ts               ← aitk entry point (bun shebang, commander)
├── exec.ts              ← shared helper: resolve PROJECT_ROOT, spawn bash via execa
├── ui.ts                ← shared terminal UI: intro, outro, select, confirm (matches lib/ui.sh style)
└── commands/
    ├── sandbox.ts       ← interactive select prompts, then execs manage-sandbox.sh
    ├── sync.ts          ← pass-through to manage-sync.sh
    ├── gov.ts           ← pass-through to manage-gov.sh
    ├── standards.ts     ← pass-through to manage-standards.sh
    ├── snippets.ts      ← pass-through to manage-snippets.sh
    ├── prompts.ts       ← pass-through to manage-prompts.sh
    ├── tooling.ts       ← pass-through to manage-tooling.sh
    ├── claude.ts        ← pass-through to manage-claude.sh
    ├── wiki.ts          ← pass-through to manage-wiki.sh
    └── antigravity.ts   ← pass-through to manage-antigravity.sh

scripts/
├── manage-sync.sh       ← aitk sync entry point
├── manage-gov.sh        ← aitk gov entry point
├── manage-standards.sh  ← aitk standards entry point
├── manage-claude.sh     ← aitk claude entry point
├── manage-sandbox.sh    ← aitk sandbox entry point
├── manage-tooling.sh    ← aitk tooling entry point
├── manage-snippets.sh       ← aitk snippets entry point
├── manage-prompts.sh        ← aitk prompts entry point
├── manage-antigravity.sh    ← aitk antigravity entry point
├── manage-wiki.sh           ← aitk wiki entry point
├── config.sh            ← shared project config (GITHUB_ORG, DEFAULT_GEMINI_MODEL)
├── core/
│   ├── verify.sh        ← runs all checks: format, spell, shell
│   ├── update.sh        ← interactive dependency update + verify
│   ├── clean.sh         ← wipes node_modules, clears cache, reinstalls
│   └── snapshot.sh      ← writes PROJECT-SNAPSHOT.md to .claude/.tmp/project/
├── gov/
│   ├── install.sh       ← bootstraps rules for a stack into a target project, supports --add for extras
│   ├── sync.sh          ← diffs and updates rules already present in target
│   ├── build.sh         ← concatenates installed rules into .cursor/.tmp/rules.md
│   └── list.sh          ← emits catalog of stacks and rules, supports --json for skills
├── tooling/
│   ├── sync.sh          ← full tooling sync: configs, seeds, deps, scripts, gitignore
│   ├── ref.sh           ← drops reference docs only
│   ├── create.sh        ← creates new stack stub
│   └── list.sh          ← emits catalog of stacks with extends chain and dep summary, supports --json
├── snippets/
│   ├── install.sh       ← copies snippets for a category into a target project, preserving folder structure
│   ├── sync.sh          ← diffs and updates snippets already present in target
│   ├── create.sh        ← creates a new snippet file in the correct category folder
│   └── list.sh          ← emits catalog of categories and entries, supports --json
├── standards/
│   └── list.sh          ← emits catalog of standards with descriptions, supports --json
├── prompts/
│   ├── install.sh       ← copies prompts for a category into a target project
│   └── sync.sh          ← diffs and updates prompts already present in target
├── claude/
│   └── prompt.sh        ← generates master prompts from installed rules + context docs
├── wiki/
│   └── init.sh          ← scaffolds wiki/ folder with stub index.md
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

## manage-sync.sh

`aitk sync [target]` runs all installed domain syncs in sequence (standards, snippets, prompts, governance, antigravity, claude), then runs a git workflow step. The git workflow detects which domains changed, shows a preview of the commit and PR body, prompts for confirmation, then stages everything, commits with `chore(sync): update <domains> from toolkit`, creates `chore/toolkit-sync`, pushes, and opens a PR via `gh`. The PR body lists up to three changed filenames per domain, then a count for the rest.

Claude role sync runs under `AITK_NON_INTERACTIVE=1` so the embedded call does not prompt. The combined PR preview is the single confirmation gate. Role drift lands under a `claude/` domain line when any of `PLANNER.md`, `IMPLEMENTER.md`, or `REVIEWER.md` changed. Seed audits stay a manual step through the `claude-seed-sync` skill. `aitk sync` prints a tip pointing at the skill when `.claude/` is present.

If `.claude/GOV.md` exists in the target after governance sync, it is regenerated automatically by calling `manage-claude.sh gov` with `AITK_NON_INTERACTIVE=1`.

The git workflow step is skipped if the target is not a git root (no `.git/`), `gh` is not installed, or `chore/toolkit-sync` already exists locally or on the remote.

## UI framing across exec boundaries

`manage-*.sh` dispatchers that hand off via `exec` lose any trap set in the parent, so a parent-opened `┌` block never closes. Each subcommand script under `scripts/<domain>/` owns its own frame: open `┌` and print a title line at the top of `main()`, before any `select_option` or `ask` call. Only open the parent frame in the dispatcher when the picker is needed to resolve the subcommand name, then close it with `└` before `exec`.

- `scripts/manage-tooling.sh` is the reference for conditional parent framing
- `scripts/tooling/{list,ref,sync,create}.sh` each open `┌` and print `│ aitk tooling <subcommand>` at the top of `main()`
- Prompts and `log_*` calls assume a frame is open. Opening the frame early prevents dangling `│` output on error paths.

## lib

**`ui.sh`**: source this in any script that needs terminal output. Provides the color palette, all `log_*` functions, `select_option` and `ask` for user prompts, `select_or_route_scenario` for sandbox scenario routing, `guard_root` (rejects toolkit root as a target), and `require_project_root`. When `AITK_NON_INTERACTIVE=1` is set, `select_option` auto-selects the first option and `ask` returns the default value without blocking. `select_or_route_scenario` reads `SANDBOX_SCENARIO` and skips the picker when set, letting agents target a specific scenario via `aitk sandbox <cat>:<cmd> <scenario>`.

**`inject.sh`**: tooling injection helpers used by `tooling/sync.sh` and sandbox scripts. The key distinction: configs always overwrite, seeds merge-only. `inject_tooling_manifest` is the orchestrator. It ties together missing dep installation, script injection, and gitignore merging in one call.

**`gov.sh`**: sourced by both `gov/build.sh` and `claude/prompt.sh`. Contains `build_rules_payload`, which strips frontmatter and concatenates `.mdc` files into a temp file. Accepts an optional space-separated filter of rule names. When provided, only those rules are included. Both consumers call the same function. Don't duplicate this logic if adding a third.

**`tooling.sh`**: defines `TOOLING_STACK_EXCLUDE` and exposes `list_tooling_stacks` and `is_tooling_stack_excluded`. Consumed by `scripts/tooling/{list,ref,sync,create}.sh` for discovery and name validation. Excluded names print a redirect error pointing at the correct CLI and exit 1. Any future folder under `tooling/` that is not a real stack routes through the same helper.
