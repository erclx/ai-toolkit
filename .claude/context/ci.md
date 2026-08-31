---
title: CI
description: GitHub Actions workflow triggers and checks
---

# CI

## Overview

Owns the GitHub Actions verification that gates pull requests into `main`, and the release automation that runs after one merges. CI runs every stage through one entry point, `bun run check:ci`. Three workflows exist, `verify.yml`, `phase-label-gate.yml`, and `release-please.yml`.

Three things differ from the local gate:

- Formatting: the local run writes and CI asserts
- Scope: the local run gates shell, types, and tests on the changed-file set, while CI passes `--all` and runs them unconditionally
- The plugin manifest stage, skipping on a machine without the CLI and failing on a runner that should have installed it

## Layout

- `.github/workflows/` owns every workflow and their job definitions

## Decisions

### The workflow surface

The workflow calls one entry point instead of naming each stage as its own step. Named steps give better failure labels in the GitHub UI, but they had already drifted out of sync with the script once, leaving four stages enforced only by a pre-push hook that `git push --no-verify` skips. A single entry point cannot drift. The failing stage still appears in the step output, one click deeper.

One job runs all of it, which is the carve-out `ci-workflow` states rather than an exemption this repository took. Recent runs land between 49 and 68 seconds, and each extra job would repay checkout, `bun install --frozen-lockfile`, and an apt install before reaching a stage, so a split buys three or four minutes of setup and no earlier signal. The skill conditions the carve-out on a gate under roughly two minutes, so this workflow splits when its own run log says to.

The job name stays `🛡️ Static Checks` even though the job now runs the test suite. Required status checks resolve against the job name, so renaming it would break branch protection until the rule is updated to match.

Mode selection goes through `--no-write` and CI names the `check:ci` script rather than setting anything inline. It was an environment variable, `VERIFY_WRITE`, while the gate was a shell script, and the flag replaced it when the sequencing moved into a command: the two questions a caller answers are what to run and whether to write, and splitting one across a flag and the other across the environment left the surface half discoverable. Each mode runs exactly one format stage. The local run formats in place, so the check pass that used to follow it verified prettier and shfmt converged on their own output rather than verifying the repository.

Scope selection goes through an `--all` argument, because it describes what to run rather than which mode to run in. An unknown argument exits 1 and `--help` prints the flags, the exit codes, and what an unmeasured stage means, so the surface stays discoverable without reading the table.

### Triggers and stage selection

CI is what makes a scoped local gate safe, and it is worth naming the path that holds on. `verify.yml` triggers on `pull_request`, on pushes to `main`, and on `workflow_dispatch`, so the backstop covers the merge as well as the pull request that preceded it. A wrong scoping decision costs a red pull request rather than a regression reaching `main`. Scoping still baselines on `origin/main`, so a branch is gated against what it will merge into rather than against its own tip.

The `Checkout` step passes `fetch-depth: 0` for the same reason. `actions/checkout@v4` defaults to a shallow, single-ref fetch on a `pull_request` event, so `origin/main` never resolves and every stage reading a merge base refuses. The Standard success criteria stage was the first to reach that read, since every earlier stage scans the whole tree rather than a diff. Measured against run `33089443464`, which failed on `✗ No merge base against main resolved.` before the flag was added.

The push trigger exists to give the README's CI badge a default-branch run to report. A badge filtered to `main` reads `no status` while the workflow runs on pull requests alone, and an unfiltered one reports whichever branch happened to run last. The second cost is the useful one: a squash merge now runs the full gate against the merged result, which no pull request run observes.

The types stage runs in CI rather than only in the pre-push hook because a missing or wrong import is the failure mode the bash migration produces most, and no other stage catches it. The test suite only catches one where a test happens to cover the caller. In the stage table it sits before the tests for the same reason, since it reports in about a second and the suite does not.

`phase-label-gate.yml` runs `aitk labels scan` against `$GITHUB_EVENT_PATH`, since a pull request body is the one thing no stage in `bun run check` can see. It sits outside `verify.yml` rather than as a second job there, and the split turns on `types:` rather than on cost: this check exists to catch a title or body edited with no new commit, which needs `edited` on the trigger, and adding that to the shared trigger would re-run the whole Static Checks job on every such edit.

It tells a release-please pull request apart from an ordinary one by two fixed signals rather than a label: the head branch prefix `release-please--branches--main` and the title prefix `chore(main): release `. Either alone is a string an ordinary pull request could reproduce to slip a leaked phase label past the check, so both have to hold together.

The scan reads a title and a body with every fenced block dropped and every inline code span blanked first, the same two exclusions `aitk markdown audit` takes from its own ban scan over the same kind of text. A link destination stays unmasked, unlike the ban scan's reading, because a release-please body's real semver reference sits inside its generated compare link and masking it would empty the record on the one pull request the check exists to pass.

`#1208` is the corpus case that forced the code-span exclusion: a backticked span quoting a test fixture's own version-shaped name, found by driving the scan against all 48 merged feature pull requests rather than reading them.

The runner installs the plugin CLI so the manifest stage gates rather than skips. The plugin is the toolkit's second delivery path, and while the binary was absent from the runner every manifest was validated on the author's machine alone, so a malformed one reached a marketplace install with no check between.

`bun install -g @anthropic-ai/claude-code@2.1.236` lands the binary in the directory `setup-bun` already put on `PATH` and cost 1.08 seconds against a 49-second gate on its first run. The version is pinned exactly rather than to a major, because `2.1.237` installed one package and no platform-native dependency and left a wrapper on `PATH` that could not run. Three pull requests failed the manifest stage inside six minutes on 2026-08-20 and none of them had touched it. Whether a later release repairs the install on its own is unmeasured, so raising the pin is a move someone makes and reads the run for, rather than one the registry makes overnight.

The release itself is not what broke. `2.1.237` sitting on the authoring machine answers `claude --version` in 0.068 seconds and passes `claude plugin validate --strict` on both manifests, so the failure is a condition of `bun install -g` against that release on a fresh runner rather than a defect in the published package. Raising the pin therefore has to be tested on a runner and cannot be cleared by running the new version locally.

The published tarball is what settles why the health guard fires rather than the presence test alone. `bin/claude.exe` as shipped is a shell stub that prints the native-binary error and exits 1 on any invocation, and the postinstall replaces that stub with the real binary. A global install landing the wrapper alone therefore leaves a name that resolves and a command that fails, which is exactly what `claude --version` tests. Confirmed on 2026-08-20 by unpacking `2.1.237` and running the stub with `--version` for exit 1.

Validation needs no credential, confirmed by running it under `env -i` with a fresh `HOME`, so this is an install step rather than a secret. The stage still skips on a machine where the CLI is absent or cannot run, and fails instead when `CI` is set, because a silent skip on the runner would report the pass the stage exists to withhold.

`check:install` stays out of CI. It is the slowest thing available and it is not in the local gate either, so adding it would widen the gate past parity.

`typescript` is a declared devDependency rather than a hoisted peer of `@astrojs/check`. It is pinned to the v5 line those peers expect, so a `bun add -D typescript` that selects v7 would be a compiler upgrade, not a dependency fix.

## Gotchas

Read `no checks reported on the '<branch>' branch` as a possible merge conflict rather than as CI lag. A `pull_request` workflow runs against a merge ref GitHub computes from the head and the base, and a conflicting branch has no such ref, so the run is never queued and nothing reports why. One pull request sat with no run for several minutes while siblings from the same afternoon showed green Verify runs, and `gh pr view --json mergeable,mergeStateStatus` returned `CONFLICTING` and `DIRTY` because `main` had advanced two commits, one of which edited the file the branch deleted. Rebasing and force-pushing queued the run within a minute. Autoship's CI watch has no timeout distinguishing the two, so a conflicting branch polls until the operator intervenes.

A shields.io badge URL returns HTTP 200 whether or not the query resolves, so verifying a badge by status code alone passes one that renders `no status`. `verify.yml` triggers on `pull_request` and `workflow_dispatch` only, so the CI badge written as `?branch=main` had no run to report and rendered `build: no status` behind a 200, and dropping the branch filter gave `build: passing`. Curl the URL and grep the rendered `<title>` for the value it reports, since a branch-filtered workflow-status badge needs the workflow to actually trigger on that branch.

An exit-code flag may count only states some documented action can drive to zero, since a permanent condition makes the gate unpassable rather than informative. `aitk sync --check --exit-code` counted `orphaned`, so a single local rule in `.claude/rules/` returned 1 on every run with no remedy, verified against a fresh install. For each state a gate counts, name the action that clears it, and where there is none, exclude it and report it separately.

The runner installs no browser binary, so a test needing one skips rather than fails and a green pipeline is not evidence that test ran. `src/demo/drive.e2e.test.ts` is the first test in this shape and guards itself with a launch probe, reporting the skip in its own header. Adding the install would slow every run for one suite, so the gap is recorded rather than closed, and a change to the demo driver is verified locally. The plugin CLI install above is the precedent for closing it if the count of such tests grows.

## Releases

### The release pull request

`release-please.yml` runs on every push to `main` and keeps a release pull request open, rewriting it as commits land. Merging that pull request is what cuts a tag and writes `CHANGELOG.md`, so a release is a merge rather than a hand-run command. `standards/versioning.md` specified both surfaces long before either existed.

The `release-please` job carries its own `concurrency` group, scoped to that job rather than to the workflow, and cancels an in-progress instance when a newer push arrives rather than queuing behind it. A queued run still computes against the commit that triggered it, and two pushes landing close together let that commit stop being the branch head before the run finishes. Only the newest commit on the branch is worth releasing, so the older instance cancels rather than writes a pull request, a branch, or a version computed against a commit main has already moved past.

Two files configure it. `release-please-config.json` holds the release type and the extra-files wiring, and `.release-please-manifest.json` holds the current version and is the file the tool rewrites. Tags read `v<major>.<minor>.<patch>` because `include-component-in-tag` is false, which matches what the versioning standard specifies. The default would prefix the package name.

The plugin manifest version is written through `extra-files` rather than by hand. `plugin.json` overrides the enclosing marketplace entry for both name and version, and `claude plugin tag` refuses to tag when the two disagree, so a version the release tool does not own is a version that goes stale on the first release nobody is watching.

`bootstrap-sha` pins the starting commit to the head this work branched from, and the manifest anchors at `0.1.0` to match what `package.json` already claimed. Without both, a first run computes a version from 633 untagged commits and picks one nobody chose.

The tool writes four files, and prettier disagrees with its serialization of two. `.prettierignore` carries `**/.claude-plugin/*.json` and `/CHANGELOG.md`, which leaves the generator as their only formatter. Both prefixes are deliberate, since a pattern with an interior slash anchors to the ignore file's directory and one with none matches at any depth, so the manifest entry needs widening and the changelog entry needs pinning to the root.

`.release-please-manifest.json` and `package.json` need no entry, since `prettier --check` accepts what the tool writes for both, and an ignore over a file the formatter already agrees with would hide real drift later. Treat the four as the unit when this comes up again, because covering only the file that happened to fail is what turned this into two passes.

### The publish job

A `publish` job on the same workflow ships the package to the registry as `@erclx/aitk`. It is gated on the `release_created` output rather than on the push, so it fires once per release rather than on every commit that lands on `main`, and it checks out `tag_name` so the tarball matches the tag rather than whatever `main` moved to afterward. It publishes with `--ignore-scripts`, because `npm publish` runs `prepare` before packing and `prepare` is `husky`, which a job that installs nothing cannot resolve. The registry credential is an `NPM_TOKEN` repository secret, the one piece of the release path that is not in version control.

This job carries no `concurrency` group of its own. A push landing while it is mid-`npm publish` must never cancel it, since a cancelled publish leaves a tag and a GitHub release with no package behind them, so the cancel above stops at `release-please` and never reaches here.

`--ignore-scripts` is honored by npm 11 and ignored by npm 10, measured against a clean clone. Under `npm@10.9.9` the flag does nothing and `prepare` runs anyway, which is `husky`, absent in a job that installs nothing, so publish exits 127. `npm@11.7.0` honors it.

The env form `NPM_CONFIG_IGNORE_SCRIPTS=true` fails the same way, and so does `npm@10 pack --ignore-scripts`, so the flag is ignored for the whole pack lifecycle rather than for publish alone and a two-step pack and publish is not a route around it. `node-version: 22` resolves a runtime that bundles npm 10, so the job installs `npm@11` in its own step before publishing. The trade is a pin that nothing reports as stale, taken over rewriting `prepare` to tolerate a missing husky, which would hide a broken hook install on the machine where hooks matter.

A preflight step gates the release job on that credential before release-please runs, so a tag is never cut that cannot be published. It calls the registry's `whoami` endpoint with the token rather than testing the variable is non-empty, which is what catches an expired or revoked token as well as a missing one. The cost is that every push to `main` fails while the secret is absent or stale, including pushes that would cut no release. That is the intended trade, since the alternative reports the same fault after the tag and the GitHub release already exist, where the only repair is publishing the tag by hand.

### Authentication and manual dispatch

The release step authenticates with a `RELEASE_PLEASE_TOKEN` repository secret rather than the default `GITHUB_TOKEN`. Under the default token the release pull request is authored by `app/github-actions`, which GitHub counts as a first-time contributor, so `verify.yml` queued in `action_required` and reported no checks until a maintainer approved the run on every release. A pull request authored by the token owner runs its checks unattended.

The cost is that automated release commits are attributed to a person in the history rather than to the bot, which is the trade rather than a side effect worth hiding. If a release pull request ever reports a bare "no checks" again, read it as pending approval rather than as a branch nothing gates, and check which token the step is passing.

A `workflow_dispatch` input publishes a tag on its own. Supplying `tag` skips the release-please job entirely and checks that ref out for publish, so a tag that exists with nothing on the registry can be shipped without a local publish. Leaving it empty runs the ordinary path.

Both gates name the event rather than testing the input alone. On a push the `inputs` context is empty, so a bare `inputs.tag == ''` holds only because GitHub casts a null and an empty string to the same number before comparing. That is correct today, and it is the whole release path resting on a coercion rule nothing in the repository states.

Naming `github.event_name` writes the intent instead, which matters more here than elsewhere because the publish job cannot be exercised before it merges, so a wrong reading would surface as releases quietly stopping rather than as a failing check.

The dispatch path also skips the credential preflight, which sits in the skipped job, and that is acceptable because the tag already exists by then, so the ordering the preflight protects no longer applies and a bad token fails the publish step directly. This is the recovery path for the tag and the registry disagreeing, not a guard against them disagreeing. Nothing guards that, because the publish job runs after the release step by construction, and closing the gap means restructuring the workflow rather than repairing it.

## Triggers

- `verify.yml` on pull requests targeting `main`, on pushes to `main`, and on `workflow_dispatch`
- `phase-label-gate.yml` on a pull request targeting `main` opened, edited, reopened, or synchronized, and on `workflow_dispatch`
- `release-please.yml` on pushes to `main`, and on `workflow_dispatch` with an optional `tag` that publishes that tag alone

## Checks

Defined in `.github/workflows/verify.yml`, which runs one step, `bun run check:ci`. That resolves to `aitk gate run --all --no-write`, so the stage list lives in `src/gate/stages.ts` rather than in the workflow and every stage runs regardless of what the branch touched. Three rows can still report something other than a pass, and the table marks each.

| Stage                     | Command                                                  | What it asserts                                                                             |
| ------------------------- | -------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Format check              | `bun run check:format`                                   | prettier and shfmt are clean                                                                |
| Indexes                   | `scripts/core/regen-indexes.sh`                          | no `index.md` was committed stale or left untracked                                         |
| Consumed copies           | `scripts/core/regen-claude-copies.sh`                    | `.claude/rules` matches source                                                              |
| Hero                      | `scripts/core/regen-hero.sh`                             | `assets/hero.html` carries current counts and both stamp digests match the pair beside them |
| Tooling paths             | `scripts/core/regen-tooling-paths.sh`                    | the shipped overwrite contract names what the stacks hold                                   |
| Ignore parity             | `scripts/core/check-ignore-parity.sh`                    | the ignore set a target receives matches this repository's own                              |
| Skill paths               | `scripts/core/check-skill-paths.sh`                      | no shipped skill cites a repo-local path                                                    |
| Plugin boundary           | `scripts/core/check-plugin-boundary.sh`                  | nothing the plugin ships resolves under `internal/`                                         |
| Seed independence         | `scripts/core/check-seed-independence.sh`                | no seed prose names the toolkit CLI                                                         |
| Unreferenced rules        | `bun src/cli.ts gov list --json`                         | reports rules no stack reaches, and fails on none of them                                   |
| Context citations         | `bun src/cli.ts context audit --citations-only`          | every cited context path resolves                                                           |
| Rule citations            | `bun src/cli.ts gov citations`                           | every path a rule cites and every internal frontmatter glob resolves                        |
| Markdown bans             | `bun src/cli.ts markdown audit --json`                   | no markdown carries a banned character, word, or spelling                                   |
| Seed standards            | `bun src/cli.ts context audit --gate` per root           | no seed breaks the standard governing the folder it seeds                                   |
| Skill requirements        | `bun src/cli.ts claude skills audit --requirements-only` | every skill folder carries a `REQUIREMENT.md`                                               |
| Standard success criteria | `bun src/cli.ts standards audit --arrivals-only`         | a standard new to the branch carries a `## Success criterion` section                       |
| Sandbox coverage          | `bun src/cli.ts sandbox coverage --json`                 | undeclared scenarios stay at or under the ceiling `src/gate/measures.ts` pins               |
| Audit set                 | `bun src/cli.ts audits run --json`                       | reports the judgment half of every audit and its growth, and fails on none of it            |
| Plugin manifests          | `claude plugin validate --strict`                        | every plugin and marketplace manifest is well-formed                                        |
| Spelling                  | `bun run check:spell`                                    | cspell passes against dictionaries                                                          |
| Shell                     | `bun run check:shell`                                    | shellcheck passes at warning level                                                          |
| Types                     | `bun run check:types`                                    | `tsc --noEmit` passes against `src/`                                                        |
| Tests                     | `bun run test`                                           | the vitest suite passes                                                                     |

Two rows report rather than gate on their own reading, Unreferenced rules and Audit set, because every finding either carries is a judgment and a push failing on one teaches a contributor to route around the stage. Both still print what they found.

The third qualification is a stage that could not read its input at all, which is a state any row can reach and none used to report. Under `check:ci` that fails the run, since an absent tool on a runner is a broken workflow step. On a contributor's machine it warns and the run stays green, and the closing line names how many stages measured nothing rather than printing an unqualified pass. Shell, types, and tests skip on the changed-file set locally and never in CI, which is what `--all` buys.

Rebuild this table from `STAGES` in `src/gate/stages.ts` rather than editing rows, since it once named half the stages and editing preserves whatever produced that. Both format stages are entries in that table now, so the rebuild reaches them the way it reaches every other row, and the hand-added row the old rebuild needed is gone. This table names the check side, since `check:ci` passes `--no-write` and the write side heads its output `Formatting` instead. Nothing compares the table to the table it describes, so the next stage added leaves it wrong again.

### The regeneration stages

The four drift stages, Indexes, Consumed copies, Hero, and Tooling paths, regenerate and then assert twice through the `drift` check in `src/gate/sequencer.ts`, once with `git diff --exit-code` for modified tracked files and once with `git ls-files --others --exclude-standard` for new untracked ones. They catch content that was regenerated locally but committed stale, which is the failure a local-only gate lets through.

Regeneration runs in both modes, so `check:ci` writes to the working tree even though it never formats. Only the format stage changes behavior between modes.

## Running CI locally

`bun run check` formats in place where CI asserts formatting. It also scopes shell, types, and tests to the changed-file set, so a local pass is weaker than a CI pass and the two no longer mean the same thing. Run `bun run check:ci` to reproduce what CI does, or `bun run check --all` to keep the local write-mode format stage while running every check. If CI fails on format, run `bun run check` locally and commit the diff.
