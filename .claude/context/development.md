---
title: Development
description: Local dev workflow, scripts, and husky hooks
---

# Development

## Overview

Owns the local development loop: toolchain setup, the run commands, and the git hooks that gate commits and pushes. CI runs the same stages through `bun run check:ci`, covered in `ci.md`. Domain behavior for what each script does lives in the entry for that domain.

## Layout

- `scripts/` owns every shell script in the repo, grouped into a folder per domain
- `.husky/` owns the git hooks

## Setup

- Install [Bun](https://bun.sh): `curl -fsSL https://bun.sh/install | bash`
- Install bash 4+ on macOS: `brew install bash`.
- Install dependencies: `bun install`

## Scripts

| Command                 | Purpose                                                                                 |
| ----------------------- | --------------------------------------------------------------------------------------- |
| `bun run check`         | Full verification. Auto-formats, regenerates indexes, asserts clean.                    |
| `bun run check:ci`      | Same stages as `check`, asserting formatting instead of applying it. Still regenerates. |
| `bun run check:format`  | Read-only prettier and shfmt format check.                                              |
| `bun run check:spell`   | Read-only cspell check against project dictionaries.                                    |
| `bun run check:shell`   | Read-only shellcheck against `scripts/` and `tooling/`.                                 |
| `bun run check:types`   | Read-only `tsc --noEmit` against `src/`.                                                |
| `bun run check:install` | Clones the repo to tmp and asserts `aitk init` lands a fresh scaffold.                  |
| `bun run format`        | Auto-fix prettier and shfmt formatting.                                                 |
| `bun run clean`         | Wipe `node_modules/`, clear bun cache, reinstall.                                       |
| `bun run update`        | Interactive `bun update` followed by verification.                                      |
| `bun run snapshot`      | Snapshot project state for diffs.                                                       |

## Gotchas

- `bun run check:install` runs `git clone` on the project root, so it verifies the last commit and never the working tree. An uncommitted fix, or an uncommitted regression, is invisible to it. Commit first or the result describes code you are not shipping.
- That gate's assert loop is the only thing between a silently truncated install and a green run, because `runDomains` in `src/init/run.ts` catches a failed domain and lets init report the ones that worked. Every domain init installs needs at least one asserted path, or that domain can install nothing while the gate stays green.
- The gate runs `aitk init --stack base` rather than a bare `init`. Governance only runs when `--stack` is passed, so without it no assertion could cover that domain. A domain that installs conditionally needs its condition met in the gate invocation, not just a path in the loop.
- Nothing typechecked until `check:types` was added, so a dropped import shipped green through format, spell, shell, and the test suite. The suite catches one only where a test covers the caller, and the migration keeps adding untested call sites. Declare `typescript` in `devDependencies` rather than relying on it hoisting from an astro peer, or the gate resolves by accident.

## Shell scripts

All `.sh` files live under `scripts/`. Do not place shell scripts outside `scripts/`.

## Husky hooks

- `pre-commit` runs `lint-staged` (prettier, cspell, shfmt, shellcheck on staged files).
- `commit-msg` runs `commitlint` against the conventional commit format.
- `pre-push` runs `bun run check`. After pushing, run `git status`. If files changed, commit the diff as `style(<scope>):` and push again.

## Session scratch

`.claude/plans/`, `.claude/review/`, `.claude/memory/`, and `.claude/TASKS.md` are gitignored and live at the main worktree root. A linked worktree resolves them there rather than writing its own copy.

A plan that ships moves to `.claude/.tmp/plans-archive/` under its original name, swept there by `claude-docs`. Deletion was the earlier policy and cost a shipped plan outright, because `.claude/plans/` is gitignored and nothing backs it up. A re-shipped slug overwrites the earlier file, which keeps the folder holding intact plans under the names they were written with.
