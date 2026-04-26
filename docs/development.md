---
title: Development
description: Local dev workflow, scripts, and husky hooks
category: Infrastructure
---

# Development

Local dev workflow for the toolkit.

## Setup

- Install [Bun](https://bun.sh): `curl -fsSL https://bun.sh/install | bash`
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

## Shell scripts

All `.sh` files live under `scripts/`. Do not place shell scripts outside `scripts/`.

## Husky hooks

- `pre-commit` runs `lint-staged` (prettier, cspell, shfmt, shellcheck on staged files).
- `commit-msg` runs `commitlint` against the conventional commit format.
- `pre-push` runs `bun run check`. After pushing, run `git status`. If files changed, commit the diff as `style(<scope>):` and push again.
