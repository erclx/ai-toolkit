---
title: Scripts
description: Bash scripts, lib functions, sandbox hooks
category: Domain references
---

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
    ├── antigravity.ts   ← pass-through to manage-antigravity.sh
    └── indexes.ts       ← pass-through to manage-indexes.sh

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
├── manage-indexes.sh        ← aitk indexes entry point
├── config.sh            ← shared project config (GITHUB_ORG, DEFAULT_GEMINI_MODEL)
├── core/
│   ├── verify.sh        ← runs all checks: format, spell, shell, index drift
│   ├── update.sh        ← interactive dependency update + verify
│   ├── clean.sh         ← wipes node_modules, clears cache, reinstalls
│   ├── snapshot.sh      ← writes PROJECT-SNAPSHOT.md to .claude/.tmp/project/
│   └── regen-indexes.sh ← regenerates prompts/index.md and standards/index.md
├── gov/
│   ├── install.sh       ← bootstraps rules for a stack into a target project, supports --add for extras
│   ├── sync.sh          ← diffs and updates rules already present in target
│   ├── build.sh         ← concatenates installed rules into .cursor/.tmp/gov/rules.md
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
│   ├── sync.sh          ← diffs and updates prompts already present in target
│   └── list.sh          ← emits catalog of prompts with descriptions, supports --json
├── claude/
│   └── prompt.sh        ← generates master prompts from installed rules + context docs
├── wiki/
│   └── init.sh          ← scaffolds wiki/ folder with stub index.md
├── indexes/
│   └── regen.sh         ← regenerates index.md files, supports --dry-run, --json, and positional paths
├── sandbox/             ← scenario scripts, see docs/sandbox.md
└── lib/
    ├── ui.sh            ← logging functions, color palette, select_option
    ├── inject.sh        ← tooling injection helpers: configs, seeds, gitignore, deps
    ├── gov.sh           ← strip_frontmatter, build_rules_payload
    ├── tooling.sh       ← list_tooling_stacks, is_tooling_stack_excluded
    └── index.sh         ← read_frontmatter_field, extract_frontmatter, list_indexes, write_index, walk_and_write_indexes
```

## Core scripts

| Script             | `bun run`  | What it does                                                                                                     |
| ------------------ | ---------- | ---------------------------------------------------------------------------------------------------------------- |
| `verify.sh`        | `check`    | Runs format, format check, spell check, shell check, and index drift check in sequence                           |
| `update.sh`        | `update`   | Interactive dep update via `bun update --interactive`, then verify                                               |
| `clean.sh`         | `clean`    | Wipes `node_modules/`, clears bun cache, reinstalls from lockfile                                                |
| `snapshot.sh`      | `snapshot` | Writes project file tree to `.claude/.tmp/project/PROJECT-SNAPSHOT.md` for Claude chat context                   |
| `regen-indexes.sh` |            | Walks the repo and rewrites every `index.md` from each folder's frontmatter, skipping vendored and scratch paths |

## manage-sync.sh

`aitk sync [target]` runs all installed domain syncs in sequence (standards, snippets, prompts, governance, antigravity, claude), then runs a git workflow step. The git workflow detects which domains changed, shows a preview of the commit and PR body, then prompts with three options: "Commit and open PR" (the default, stages, commits, creates `chore/toolkit-sync`, pushes, opens a PR via `gh`), "Commit only" (stages, commits, creates the branch, stops before push), and "Cancel" (skips the workflow entirely). The PR body lists up to three changed filenames per domain, then a count for the rest.

Claude role sync runs under `AITK_NON_INTERACTIVE=1` so the embedded call does not prompt. The combined PR preview is the single confirmation gate. Role drift lands under a `claude/` domain line when any of `PLANNER.md`, `IMPLEMENTER.md`, or `REVIEWER.md` changed. Seed audits stay a manual step through the `claude-seed-sync` skill. `aitk sync` prints a tip pointing at the skill when `.claude/` is present.

If `.claude/GOV.md` exists in the target after governance sync, it is regenerated automatically by calling `manage-claude.sh gov` with `AITK_NON_INTERACTIVE=1`.

The git workflow step is skipped if the target is not a git root (no `.git/`), `gh` is not installed, or `chore/toolkit-sync` already exists locally or on the remote.

## UI framing across exec boundaries

Every `manage-*.sh` dispatcher calls `open_timeline "aitk <domain>"` and `trap close_timeline EXIT` at the top of `main()`, before any `exec`. Because `exec` replaces the process and drops the parent trap, each subcommand script under `scripts/<domain>/` re-arms `trap close_timeline EXIT` itself, before any early `exit` (including `--json` paths). Subcommand scripts do **not** open their own `┌`. The manager already did. This keeps exactly one frame per invocation on stderr.

- `scripts/manage-tooling.sh` is the reference manager. It opens the frame unconditionally in `main()`.
- `scripts/tooling/{list,ref,sync,create}.sh` set their own EXIT trap and emit section headers via `log_step`, but never emit `┌`.
- Prompts and `log_*` calls assume a frame is open. Opening the frame at the top of the manager prevents dangling `│` output on error paths.

See `docs/agents.md` for the canonical output shape that this framing produces, and `prompts/bash-script.md` for the authoring contract when generating new domain scripts.

## lib

### `ui.sh`

Source this in any script that needs terminal output. `log_*` functions write to stderr so structured output on stdout pipes clean through wrappers. Use `printf` or `echo` without redirection for data meant to be consumed. When `AITK_NON_INTERACTIVE=1` is set, `select_option` auto-selects the first option and `ask` returns the default value without blocking. `select_or_route_scenario` reads `SANDBOX_SCENARIO` and skips the picker when set, letting agents target a specific scenario via `aitk sandbox <cat>:<cmd> <scenario>`. Also provides the color palette. When adding a command that calls `select_option` or `ask`, verify the non-interactive path works with `AITK_NON_INTERACTIVE=1`.

| Function                                                              | What it does                                                                               |
| --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `open_timeline`, `close_timeline`                                     | Open `┌` (with optional banner) and close `└` on stderr. Pair with `trap … EXIT`.          |
| `log_info`, `log_warn`, `log_error`, `log_step`, `log_add`, `log_rem` | Framed log lines on stderr. `log_error` exits 1.                                           |
| `select_option`                                                       | Interactive picker. Sets `SELECTED_OPTION`. Errors with a framed message on non-TTY stdin. |
| `ask`                                                                 | Prompt for a value with a default. Exports the result to a named variable.                 |
| `select_or_route_scenario`                                            | Sandbox-aware picker. Skips when `SANDBOX_SCENARIO` is set.                                |
| `guard_root`                                                          | Rejects the toolkit root as a target.                                                      |
| `require_project_root`                                                | Errors when run outside the repo or inside a sandbox.                                      |

### `inject.sh`

Tooling injection helpers used by `tooling/sync.sh` and sandbox scripts. The key distinction: configs always overwrite, seeds merge-only. `inject_tooling_manifest` is the orchestrator. It ties together missing dep installation, script injection, and gitignore merging in one call.

| Function                   | What it does                                                                               |
| -------------------------- | ------------------------------------------------------------------------------------------ |
| `inject_tooling_manifest`  | Orchestrator. Runs missing-dep install, script injection, and gitignore merge for a stack. |
| `inject_tooling_configs`   | Apply stack configs to target. Always overwrites.                                          |
| `inject_tooling_seeds`     | Apply stack seeds to target. Merges into existing files, never overwrites.                 |
| `inject_tooling_reference` | Copy the stack's `reference.md` into the target's `tooling/` folder.                       |
| `inject_governance`        | Copy governance rules into `.cursor/rules/` and standards into `standards/`.               |
| `inject_dependencies`      | Run `bun install` or `uv sync` based on the detected manifest.                             |

### `gov.sh`

Sourced by both `gov/build.sh` and `claude/prompt.sh`. Both consumers call the same function. Don't duplicate this logic if adding a third.

| Function              | What it does                                                                                                                               |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `build_rules_payload` | Concatenate `.mdc` files into a temp file with frontmatter stripped. Optional space-separated filter narrows to named rules. Returns path. |
| `strip_frontmatter`   | Strip the YAML frontmatter block from a markdown file. Emit the rest to stdout.                                                            |

### `tooling.sh`

Consumed by `scripts/tooling/{list,ref,sync,create}.sh` for discovery and name validation. `TOOLING_STACK_EXCLUDE` is the constant of names to skip (currently `claude`). Excluded names print a redirect error pointing at the correct CLI and exit 1. Any future folder under `tooling/` that is not a real stack routes through the same helper.

| Function                    | What it does                                                     |
| --------------------------- | ---------------------------------------------------------------- |
| `list_tooling_stacks`       | Emit names of every directory under `tooling/`, minus excluded.  |
| `is_tooling_stack_excluded` | Return 0 if the name is in `TOOLING_STACK_EXCLUDE`, 1 otherwise. |

### `index.sh`

Sourced by `scripts/prompts/{install,sync}.sh`, `scripts/manage-standards.sh`, `scripts/standards/list.sh`, `scripts/core/regen-indexes.sh`, `scripts/core/verify.sh`, and `scripts/indexes/regen.sh`. An `index.md` with `auto: false` in its frontmatter is left alone. To exclude a folder, add it to `.gitignore`. Outside a git repo, only `.git` and `node_modules` are pruned.

| Function                 | What it does                                                                                                                      |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| `read_frontmatter_field` | Read a YAML field from a markdown file's frontmatter. Strips wrapping quotes.                                                     |
| `extract_frontmatter`    | Emit the frontmatter block verbatim.                                                                                              |
| `list_indexes`           | Find every `index.md` under a root. Prunes `.git` and `node_modules` directly, defers to `git check-ignore --stdin` for the rest. |
| `compute_index_to`       | Compute the intended `index.md` content into a target file. Fails on missing sibling frontmatter.                                 |
| `write_index`            | Wraps `compute_index_to` with `auto:false` opt-out. Skips the write when content is unchanged.                                    |
| `walk_and_write_indexes` | Run `write_index` across every folder `list_indexes` returns.                                                                     |
| `find_indexed_ancestor`  | Walk up from a path until an `index.md` is found, bounded by a root.                                                              |
| `regen_one`              | CLI-facing. Dry-run aware, emits JSON records. Reports `written`, `would-write`, `unchanged`, `skipped`, `error`.                 |
