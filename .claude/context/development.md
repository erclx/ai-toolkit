---
title: Development
description: Local dev workflow, scripts, and husky hooks
---

# Development

## Overview

Owns the local development loop: toolchain setup, the run commands, and the git hooks that gate commits and pushes. The same checks run in CI, covered in `ci.md`. Domain behavior for what each script does lives in the entry for that domain.

## Layout

- `scripts/` owns every shell script in the repo, grouped into a folder per domain
- `.husky/` owns the git hooks

## Setup

- Install [Bun](https://bun.sh): `curl -fsSL https://bun.sh/install | bash`
- Install bash 4+ on macOS: `brew install bash`.
- Install dependencies: `bun install`

## Scripts

| Command                 | Purpose                                                                |
| ----------------------- | ---------------------------------------------------------------------- |
| `bun run check`         | Full verification. Auto-formats, regenerates indexes, asserts clean.   |
| `bun run check:format`  | Read-only prettier and shfmt format check.                             |
| `bun run check:spell`   | Read-only cspell check against project dictionaries.                   |
| `bun run check:shell`   | Read-only shellcheck against `scripts/` and `tooling/`.                |
| `bun run check:install` | Clones the repo to tmp and asserts `aitk init` lands a fresh scaffold. |
| `bun run format`        | Auto-fix prettier and shfmt formatting.                                |
| `bun run clean`         | Wipe `node_modules/`, clear bun cache, reinstall.                      |
| `bun run update`        | Interactive `bun update` followed by verification.                     |
| `bun run snapshot`      | Snapshot project state for diffs.                                      |

## Gotchas

- `bun run check:install` runs `git clone` on the project root, so it verifies the last commit and never the working tree. An uncommitted fix, or an uncommitted regression, is invisible to it. Commit first or the result describes code you are not shipping.
- That gate's assert loop is the only thing between a silently truncated install and a green run, because `run_domain` in `scripts/manage-init.sh` catches a failed domain and lets init exit 0 anyway. Every domain init installs needs at least one asserted path, or that domain can install nothing while the gate stays green.

## Shell scripts

All `.sh` files live under `scripts/`. Do not place shell scripts outside `scripts/`.

## Husky hooks

- `pre-commit` runs `lint-staged` (prettier, cspell, shfmt, shellcheck on staged files).
- `commit-msg` runs `commitlint` against the conventional commit format.
- `pre-push` runs `bun run check`. After pushing, run `git status`. If files changed, commit the diff as `style(<scope>):` and push again.
