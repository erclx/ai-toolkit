---
title: CI
description: GitHub Actions workflow triggers and checks
---

# CI

GitHub Actions workflow for this project.

## Triggers

- Pull requests targeting `main`
- `workflow_dispatch` (manual run from the Actions tab)

## Checks

Defined in `.github/workflows/verify.yml`. All jobs must pass before merge.

| Check  | Command                | What it asserts                    |
| ------ | ---------------------- | ---------------------------------- |
| Format | `bun run check:format` | prettier and shfmt are clean       |
| Spell  | `bun run check:spell`  | cspell passes against dictionaries |
| Shell  | `bun run check:shell`  | shellcheck passes at warning level |

## Running CI locally

`bun run check` runs the same three asserts plus auto-formats first. If CI fails on format, run `bun run check` locally and commit the diff.
