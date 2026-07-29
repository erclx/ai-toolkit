---
title: CI
description: GitHub Actions workflow triggers and checks
---

# CI

## Overview

Owns the GitHub Actions verification that gates pull requests into `main`. CI runs the same stages as the local gate through one entry point, `bun run check:ci`. The only difference is formatting: the local run writes, CI asserts. `verify.yml` is the only workflow in the repo.

## Layout

- `.github/workflows/` owns the verify workflow and its job definitions

## Decisions

The workflow calls one entry point instead of naming each stage as its own step. Named steps give better failure labels in the GitHub UI, but they had already drifted out of sync with the script once, leaving four stages enforced only by a pre-push hook that `git push --no-verify` skips. A single entry point cannot drift. The failing stage still appears in the step output, one click deeper.

The job name stays `🛡️ Static Checks` even though the job now runs the test suite. Required status checks resolve against the job name, so renaming it would break branch protection until the rule is updated to match.

Mode selection goes through `VERIFY_WRITE` rather than a flag, matching the existing `VERIFY_NESTED` pattern, and CI names the `check:ci` script rather than setting the variable inline. Each mode runs exactly one format stage. The local run formats in place, so the check pass that used to follow it verified prettier and shfmt converged on their own output rather than verifying the repository.

The types stage runs in CI rather than only in the pre-push hook because a missing or wrong import is the failure mode the bash migration produces most, and no other stage catches it. The test suite only catches one where a test happens to cover the caller. In `verify.sh` it sits before the tests for the same reason, since it reports in about a second and the suite does not.

`check:install` stays out of CI. It is the slowest thing available and it is not in the local gate either, so adding it would widen the gate past parity.

`typescript` is a declared devDependency rather than a hoisted peer of `@astrojs/check`. It is pinned to the v5 line those peers expect, so a `bun add -D typescript` that selects v7 would be a compiler upgrade, not a dependency fix.

## Triggers

- Pull requests targeting `main`
- `workflow_dispatch` (manual run from the Actions tab)

## Checks

Defined in `.github/workflows/verify.yml`, which runs one step, `bun run check:ci`. That resolves to `scripts/core/verify.sh` with `VERIFY_WRITE=false`, so the stage list lives in the script rather than the workflow.

| Stage            | Command                                  | What it asserts                                         |
| ---------------- | ---------------------------------------- | ------------------------------------------------------- |
| Format check     | `bun run check:format`                   | prettier and shfmt are clean                            |
| Indexes          | `scripts/core/regen-indexes.sh`          | no `index.md` was committed stale or left untracked     |
| Consumed copies  | `scripts/core/regen-claude-copies.sh`    | `.claude/standards` and `.claude/snippets` match source |
| Skill references | `scripts/core/regen-skill-references.sh` | bundled standards match their consumers                 |
| Spell            | `bun run check:spell`                    | cspell passes against dictionaries                      |
| Shell            | `bun run check:shell`                    | shellcheck passes at warning level                      |
| Types            | `bun run check:types`                    | `tsc --noEmit` passes against `src/`                    |
| Tests            | `bun run test`                           | the vitest suite passes                                 |

The three drift stages regenerate and then assert twice through `assert_no_drift`, once with `git diff --exit-code` for modified tracked files and once with `git ls-files --others --exclude-standard` for new untracked ones. They catch content that was regenerated locally but committed stale, which is the failure a local-only gate lets through.

Regeneration runs in both modes, so `check:ci` writes to the working tree even though it never formats. Only the format stage changes behavior between modes.

## Running CI locally

`bun run check` runs the same stages. It formats in place where CI asserts formatting, so a local pass and a CI pass mean the same thing. If CI fails on format, run `bun run check` locally and commit the diff.
