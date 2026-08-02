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

The tool writes four files, and prettier disagrees with its serialization of two. `.prettierignore` carries `**/.claude-plugin/*.json` and `/CHANGELOG.md`, which leaves the generator as their only formatter. Both prefixes are deliberate, since a pattern with an interior slash anchors to the ignore file's directory and one with none matches at any depth, so the manifest entry needs widening and the changelog entry needs pinning to the root. `.release-please-manifest.json` and `package.json` need no entry, since `prettier --check` accepts what the tool writes for both, and an ignore over a file the formatter already agrees with would hide real drift later. Treat the four as the unit when this comes up again, because covering only the file that happened to fail is what turned this into two passes.

A `publish` job on the same workflow ships the package to the registry as `@erclx/aitk`. It is gated on the `release_created` output rather than on the push, so it fires once per release rather than on every commit that lands on `main`, and it checks out `tag_name` so the tarball matches the tag rather than whatever `main` moved to afterward. It publishes with `--ignore-scripts`, because `npm publish` runs `prepare` before packing and `prepare` is `husky`, which a job that installs nothing cannot resolve. The registry credential is an `NPM_TOKEN` repository secret, the one piece of the release path that is not in version control.

A preflight step gates the release job on that credential before release-please runs, so a tag is never cut that cannot be published. It calls the registry's `whoami` endpoint with the token rather than testing the variable is non-empty, which is what catches an expired or revoked token as well as a missing one. The cost is that every push to `main` fails while the secret is absent or stale, including pushes that would cut no release. That is the intended trade, since the alternative reports the same fault after the tag and the GitHub release already exist, where the only repair is publishing the tag by hand.

The workflow authenticates with the default `GITHUB_TOKEN`, which does not stop `verify.yml` from running on the release pull request. The checks land queued in `action_required` under the repository's workflow-approval setting, because the release bot counts as a first-time contributor, so `gh pr checks` reports none until a human approves the run. The gate then runs, and it is what caught the changelog format failure on the first release branch before it merged. Read a bare "no checks" on a release pull request as pending approval rather than as a branch nothing gates.

## Triggers

- `verify.yml` on pull requests targeting `main`, and on `workflow_dispatch`
- `release-please.yml` on pushes to `main`, and on `workflow_dispatch`

## Checks

Defined in `.github/workflows/verify.yml`, which runs one step, `bun run check:ci`. That resolves to `scripts/core/verify.sh` with `VERIFY_WRITE=false` and `--all`, so the stage list lives in the script rather than the workflow and every stage runs regardless of what the branch touched. One stage is the exception, and the table marks it.

| Stage            | Command                                  | What it asserts                                         |
| ---------------- | ---------------------------------------- | ------------------------------------------------------- |
| Format check     | `bun run check:format`                   | prettier and shfmt are clean                            |
| Indexes          | `scripts/core/regen-indexes.sh`          | no `index.md` was committed stale or left untracked     |
| Consumed copies  | `scripts/core/regen-claude-copies.sh`    | `.claude/standards` and `.claude/snippets` match source |
| Skill references | `scripts/core/regen-skill-references.sh` | bundled standards match their consumers                 |
| Plugin manifests | `claude plugin validate --strict`        | every manifest is well-formed, author-side only         |
| Spell            | `bun run check:spell`                    | cspell passes against dictionaries                      |
| Shell            | `bun run check:shell`                    | shellcheck passes at warning level                      |
| Types            | `bun run check:types`                    | `tsc --noEmit` passes against `src/`                    |
| Tests            | `bun run test`                           | the vitest suite passes                                 |

Plugin manifests is the one row CI does not enforce. It guards on the plugin CLI resolving on `PATH`, and the runner installs the JavaScript runtime and two shell tools and nothing else, so it reports a skip there and gates on the author's machine alone. Without the qualifier the table reads as the merge gate and credits CI with a check it never runs.

The three drift stages regenerate and then assert twice through `assert_no_drift`, once with `git diff --exit-code` for modified tracked files and once with `git ls-files --others --exclude-standard` for new untracked ones. They catch content that was regenerated locally but committed stale, which is the failure a local-only gate lets through.

Regeneration runs in both modes, so `check:ci` writes to the working tree even though it never formats. Only the format stage changes behavior between modes.

## Running CI locally

`bun run check` formats in place where CI asserts formatting. It also scopes shell, types, and tests to the changed-file set, so a local pass is weaker than a CI pass and the two no longer mean the same thing. Run `bun run check:ci` to reproduce what CI does, or `bun run check --all` to keep the local write-mode format stage while running every check. If CI fails on format, run `bun run check` locally and commit the diff.
