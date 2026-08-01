---
title: CI
description: GitHub Actions workflow triggers and checks
---

# CI

## Overview

Owns the GitHub Actions verification that gates pull requests into `main`, and the release automation that runs after one merges. CI runs every stage through one entry point, `bun run check:ci`. Two things differ from the local gate. Formatting is the first: the local run writes, CI asserts. Scope is the second: the local run gates shell, types, and tests on the changed-file set, while CI passes `--all` and runs them unconditionally. Two workflows exist, `verify.yml` and `release-please.yml`.

## Layout

- `.github/workflows/` owns both workflows and their job definitions

## Decisions

The workflow calls one entry point instead of naming each stage as its own step. Named steps give better failure labels in the GitHub UI, but they had already drifted out of sync with the script once, leaving four stages enforced only by a pre-push hook that `git push --no-verify` skips. A single entry point cannot drift. The failing stage still appears in the step output, one click deeper.

The job name stays `🛡️ Static Checks` even though the job now runs the test suite. Required status checks resolve against the job name, so renaming it would break branch protection until the rule is updated to match.

Mode selection goes through `VERIFY_WRITE` rather than a flag, matching the existing `VERIFY_NESTED` pattern, and CI names the `check:ci` script rather than setting the variable inline. Each mode runs exactly one format stage. The local run formats in place, so the check pass that used to follow it verified prettier and shfmt converged on their own output rather than verifying the repository.

Scope selection goes through an `--all` argument rather than a third environment variable, because it describes what to run rather than which mode to run in. An unknown argument exits 1 and `--help` prints the argument list, so the surface stays discoverable without reading the script.

CI is what makes a scoped local gate safe, and it is worth naming the path that holds on. `verify.yml` triggers on `pull_request` and `workflow_dispatch` and never on push, so the backstop covers the pull request path alone. A wrong scoping decision costs a red pull request rather than a regression reaching `main`. Work lands on `main` through a squash merge of a reviewed pull request, which is why the uncovered direct-push path is theoretical rather than routine. Scoping still baselines on `origin/main` so that path is gated too.

The types stage runs in CI rather than only in the pre-push hook because a missing or wrong import is the failure mode the bash migration produces most, and no other stage catches it. The test suite only catches one where a test happens to cover the caller. In `verify.sh` it sits before the tests for the same reason, since it reports in about a second and the suite does not.

`check:install` stays out of CI. It is the slowest thing available and it is not in the local gate either, so adding it would widen the gate past parity.

`typescript` is a declared devDependency rather than a hoisted peer of `@astrojs/check`. It is pinned to the v5 line those peers expect, so a `bun add -D typescript` that selects v7 would be a compiler upgrade, not a dependency fix.

## Releases

`release-please.yml` runs on every push to `main` and keeps a release pull request open, rewriting it as commits land. Merging that pull request is what cuts a tag and writes `CHANGELOG.md`, so a release is a merge rather than a hand-run command. `standards/versioning.md` specified both surfaces long before either existed.

Two files configure it. `release-please-config.json` holds the release type and the extra-files wiring, and `.release-please-manifest.json` holds the current version and is the file the tool rewrites. Tags read `v<major>.<minor>.<patch>` because `include-component-in-tag` is false, which matches what the versioning standard specifies. The default would prefix the package name.

The plugin manifest version is written through `extra-files` rather than by hand. `plugin.json` overrides the enclosing marketplace entry for both name and version, and `claude plugin tag` refuses to tag when the two disagree, so a version the release tool does not own is a version that goes stale on the first release nobody is watching.

`bootstrap-sha` pins the starting commit to the head this work branched from, and the manifest anchors at `0.1.0` to match what `package.json` already claimed. Without both, a first run computes a version from 633 untagged commits and picks one nobody chose.

The workflow authenticates with the default `GITHUB_TOKEN`, so the release pull request it opens does not trigger `verify.yml`. That is acceptable while the release commit only touches generated version and changelog files. Swap in a personal access token if the release pull request ever needs the gate.

The Plugin manifests stage is guarded on the plugin CLI being present and CI does not install it, so that stage is a no-op on a runner and an author-side gate in practice.

## Triggers

- `verify.yml` on pull requests targeting `main`, and on `workflow_dispatch`
- `release-please.yml` on pushes to `main`, and on `workflow_dispatch`

## Checks

Defined in `.github/workflows/verify.yml`, which runs one step, `bun run check:ci`. That resolves to `scripts/core/verify.sh` with `VERIFY_WRITE=false` and `--all`, so the stage list lives in the script rather than the workflow and every stage runs regardless of what the branch touched.

| Stage            | Command                                  | What it asserts                                         |
| ---------------- | ---------------------------------------- | ------------------------------------------------------- |
| Format check     | `bun run check:format`                   | prettier and shfmt are clean                            |
| Indexes          | `scripts/core/regen-indexes.sh`          | no `index.md` was committed stale or left untracked     |
| Consumed copies  | `scripts/core/regen-claude-copies.sh`    | `.claude/standards` and `.claude/snippets` match source |
| Skill references | `scripts/core/regen-skill-references.sh` | bundled standards match their consumers                 |
| Plugin manifests | `claude plugin validate --strict`        | every plugin and marketplace manifest is well-formed    |
| Spell            | `bun run check:spell`                    | cspell passes against dictionaries                      |
| Shell            | `bun run check:shell`                    | shellcheck passes at warning level                      |
| Types            | `bun run check:types`                    | `tsc --noEmit` passes against `src/`                    |
| Tests            | `bun run test`                           | the vitest suite passes                                 |

The three drift stages regenerate and then assert twice through `assert_no_drift`, once with `git diff --exit-code` for modified tracked files and once with `git ls-files --others --exclude-standard` for new untracked ones. They catch content that was regenerated locally but committed stale, which is the failure a local-only gate lets through.

Regeneration runs in both modes, so `check:ci` writes to the working tree even though it never formats. Only the format stage changes behavior between modes.

## Running CI locally

`bun run check` formats in place where CI asserts formatting. It also scopes shell, types, and tests to the changed-file set, so a local pass is weaker than a CI pass and the two no longer mean the same thing. Run `bun run check:ci` to reproduce what CI does, or `bun run check --all` to keep the local write-mode format stage while running every check. If CI fails on format, run `bun run check` locally and commit the diff.
