---
title: CI
description: GitHub Actions workflow triggers and checks
---

# CI

## Overview

Owns the GitHub Actions verification that gates pull requests into `main`. CI runs a subset of `bun run check`: formatting, spelling, and shell. The index, consumed-copy, skill-reference, and test stages run only in the local pre-push hook. `verify.yml` is the only workflow in the repo.

## Layout

- `.github/workflows/` owns the verify workflow and its job definitions

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

`bun run check` runs these three plus index, consumed-copy, and skill-reference drift checks and the test suite, and auto-formats before asserting. Passing it locally is stricter than passing CI. If CI fails on format, run `bun run check` locally and commit the diff.
