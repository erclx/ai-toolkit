---
title: CLI
description: TypeScript entry point, the exec boundary to bash, and the TS-native command domains
---

# CLI

## Overview

`src/` is the TypeScript CLI entry point. It uses commander to register subcommands and execa to dispatch most of them to the corresponding `manage-*.sh` script in `scripts/`. Domains are being migrated off bash one at a time. Use `@/` absolute imports (mapped to `src/` in `tsconfig.json`).

The layer boundary: TypeScript owns argument parsing plus every migrated domain, and bash owns what has not moved yet. See `.claude/context/scripts.md` for the bash side.

## Layout

- `src/` owns the entry point (`cli.ts`), the exec helper that resolves `PROJECT_ROOT` and spawns bash (`exec.ts`), the shared terminal UI matching `lib/ui.sh` style (`ui.ts`), the cross-domain file helpers (`copy.ts`, `frontmatter.ts`), and GitHub helpers
- `src/commands/` owns one file per `aitk` subcommand, each one not yet migrated a thin pass-through to a `manage-*.sh` script
- `src/design/`, `src/slides/`, `src/transcripts/` own the domains built TS-first, documented as feature entries in `.claude/context/design.md`, `.claude/context/slides.md`, and `.claude/context/transcripts.md`
- `src/indexes/` owns the index engine, the first domain migrated off bash, documented in `.claude/context/indexes.md`
- `src/tooling/` owns the tooling inject and scan engine, documented in `.claude/context/tooling.md`
- `src/sync/` owns the domain sync engine shared across gov, snippets, and standards, with the per-domain adapters in `src/gov/`, `src/snippets/`, and `src/standards/`. It also owns the `aitk sync` git workflow in `target.ts`, `git.ts`, and `workflow.ts`, the install stamp in `stamp.ts`, and the drift report in `check.ts`
- `src/init/` owns the `aitk init` flag plan and the partial-failure domain runner
- `src/docs/` and `src/wiki/` own the two read-only domains, which reach for no shared engine because neither syncs into a target
- `src/claude/` owns seed planning, the gitignore preview, and the user settings merge, the three pieces the `claude` dispatcher held before it was deleted

## Decisions

- A migrated command defines its real option surface in commander rather than forwarding argv. `indexes` is the first, so a mistyped subcommand now fails with a suggestion instead of reaching a shell script. Every command still on bash carries `allowUnknownOption()` and parses nothing.
- Commands still on bash stay thin. A command file parses arguments and execs, so behavior changes land in the bash script rather than in two places.
- A domain migrates one verb at a time rather than all at once. `tooling`, `gov`, and `snippets` register their migrated verbs natively and name each remaining verb as an explicit pass-through, which is what let each dispatcher be deleted before every verb had moved. Naming them, rather than falling back to `allowUnknownOption()` on the whole domain, keeps `--help` honest for the verbs that did move.
- The pass-through registration lives in `src/commands/pass-through.ts` and takes the domain name, since the loop is identical for every domain and only the banner and script path vary. Gov, snippets, and standards all call it. A verb whose script sits somewhere other than `scripts/<domain>/<verb>.sh` registers by hand instead, which is the reason `claude seeds` carried hand-rolled routing until its verb migrated.
- The dispatcher used to open the timeline frame for every verb under it. When a dispatcher is deleted, whichever layer runs first has to open the frame instead, or the bash verb emits a closing `└` with nothing above it. Each pass-through calls `intro` before it execs for exactly this reason.
- A pass-through verb sets `helpOption(false)`. Commander resolves `--help` before the action runs, so leaving the built-in option on prints a one-line stub and hides the flag surface the bash script documents. Disabling it lets the flag reach the script, which owns that surface until the verb migrates.
- A helper lifts to the `src/` root once a second domain needs it. `stripFrontmatter` moved out of `src/gov/payload.ts` into `src/frontmatter.ts` when `docs` arrived, rather than having `docs` import from `gov` and carry a dependency it has no reason to. `copyPreservingMode`, `resolveTarget`, and `cliRun` were lifted the same way.
- A command whose stdout is the product writes the document with `process.stdout.write` and everything else with the `log_*` helpers, which are stderr-only. `aitk docs <topic>` is the one command a caller captures with `$(...)`, so a single frame character on stdout would corrupt the document silently rather than failing.
- Anything that writes a file into a target routes through `copyPreservingMode` in `src/copy.ts`. `copyFile` imposes the source's mode on an existing destination, so a target file deliberately at 600, or one an earlier layer made executable, comes back at the source's mode. The bash `cp` it replaces left an existing mode alone.
- Declining a prompt exits 0. A cancel is a deliberate choice rather than a failure, and `runDomains` in `src/init/run.ts` reports any non-zero domain as `Failed, run manually`, so exiting 1 made `aitk init` announce a broken install for work the operator chose to skip. `wiki init`, `claude init`, and `claude sync` all moved off the bash `exit 1`. Apply it to any prompt a port carries over.
- A verb that writes outside a target takes its destination as an argument. `aitk claude setup` defaults to `$HOME/.claude` but accepts a path, which is the only way to cover the settings merge without pointing a test at the operator's real config. The sandbox scenario passes a sandbox-local path for the same reason.
- A preview and the apply it precedes run the same function. `planGitignore` dry-runs `mergeSections`, the function the apply calls, so the two cannot disagree. The bash re-parsed the manifest with a line regex that only matched a single-line array, which meant the preview and the write read the source differently.
- Behavior shared across domains lands in `src/sync/` rather than in the first domain that needs it. Gov is the first consumer of the sync engine, and burying it under `src/gov/` would force a move as soon as snippets arrives.
- An adapter supplies only a source lookup and, optionally, surfaces the file walk cannot see. Snippets landed against the engine with no change to it, which is the evidence that `SyncAdapter` generalizes rather than describing gov. Treat a required engine change in a later adapter as a finding, and prefer widening the adapter interface over branching inside the engine.
- Standards is the adapter that needed the engine widened, and it took three optional fields rather than a branch on the domain name: `nonInteractive`, `isExcluded`, and `onComplete`. Each defaults to the behavior gov and snippets already had, so a widening cannot silently change an existing adapter.
- The non-interactive policy is a discriminated union rather than a boolean. A headless run applies for a toolkit-owned domain and refuses for one whose files a project edits, and the refusing variant carries its own message and hint so the engine never holds domain copy.
- The refusal is now per-file rather than per-domain. `refuse` stood in for a fact nobody could compute, so standards went unattended-hostile because one file among twelve might be customized. With a stamp the engine refuses only when a file it cannot prove untouched would be overwritten, and a purely mechanical update applies headlessly.
- A content hash answers whether a file changed. Only a record written at install time answers who changed it, and those two need opposite actions. That is the whole reason `.claude/aitk.json` exists rather than recomputing against the source, which is what `planSync` already did.
- The stamp's path list is a second input to the walk, not a lookup keyed by the current path. A relocated file is never walked, so a lookup would never consult its entry and the stamp would buy nothing a recomputed hash does not. Folding stamped paths into the walk is what makes a move visible.
- `orphaned` and `stranded` are separate states because they need opposite treatment. A project-authored rule is orphaned and never converges, so counting it as drift left `--exit-code` failing forever with no remedy. A stamped file at a root the toolkit abandoned is stranded, which is a relocation waiting on a decision.
- The stamp writes after the copies land, so a partial apply that throws leaves the previous stamp rather than a claim the target does not meet. A stamp that lies is worse than no stamp, because the next report calls updated files stale.
- A missing or corrupt stamp degrades to the unattributed report rather than failing. Every existing target is unstamped, so that path is the only path on day one and stays the common one for a while.
- Tooling is outside the stamp and says so through a `covers` field rather than by omission, so a reader can tell an uncovered domain from a clean one. `src/tooling/` runs its own inject and manifest machinery and never calls `planSync`.
- The root program sets `helpOption(false)` for its own hand-rolled help, and subcommands inherit it. A migrated command re-enables help explicitly at each level or `--help` returns an unknown-option error.
- Tests run under `bun --bun vitest` rather than plain vitest. Migrated code uses `Bun.YAML`, `Bun.Glob`, and `Bun.$`, which do not exist in the Node runtime vitest defaults to.
- Bash that still needs a migrated capability shells into the CLI by path (`bun "$PROJECT_ROOT/src/cli.ts" ...`) rather than via the global `aitk`, so a linked worktree exercises its own code.
- `sandbox.ts` is the exception that carries interactive select prompts before the exec, because the scenario picker needs the TS prompt surface.
- A headless run refuses to write to a git remote. `select_option` resolved to its first option under `AITK_NON_INTERACTIVE=1`, and `Commit and open PR` was first whenever `gh` was installed, so an agent following the documented non-interactive path pushed a branch and opened a pull request on someone's repository with no confirmation. The four domain syncs still apply, so headless keeps everything but the push. This is the same judgment the standards refusal made, applied to an action that reaches further outward than a local overwrite.
- The sync commit stages the paths the syncs actually changed rather than `git add -A`. The workflow already reads those paths to classify each domain, so the commit matches its own message. `check_clean_tree` stays regardless, since it is what makes any staging choice survivable.
- A picker standing in for a required argument refuses headlessly rather than defaulting to its first option. `aitk gov install` with no stack installed 26 astro rules into an empty directory, and `aitk snippets install` with no category installed every category, both because `select_option` returned `options[0]`. Confirm-then-apply prompts keep `nonInteractiveDefault`, since the caller already named what to apply. The distinction is whether the prompt is choosing what to do or confirming what was asked for.
- Machine-readable output goes through `JSON.stringify` rather than a `printf` template. Two list verbs interpolated names straight into a JSON string literal, so any name carrying a quote emitted output a consuming skill could not parse. Both were inert on the current corpus, which is why the shape held until someone named a snippet with a quote in it.
- A branch gated behind a prompt takes an optional decision seam so a test can reach it. `select` exits without a TTY, which left the `aitk sync` staging and commit branches reachable only by driving a PTY by hand. `WorkflowDeps.choose` defaults to the real prompt, so the command layer omits it and production behavior is unchanged, while the tests assert the exact staged set. Prefer this over asserting on the logic that feeds a prompt and calling the branch behind it covered.
- Feature entries stay separate from this one. They document a user-facing artifact such as the `SLIDES.md` source shape or the design token schema, which is worth reading without the CLI plumbing.

## Gotchas

- Set `process.exitCode` in a command action. Calling `process.exit()` ends the process before an async stdout write drains, which silently truncates piped output at the 64K pipe buffer while still reporting the right exit code. Redirecting to a file hides it, so this only shows up through a pipe.
- Diagnostics belong on stderr in every mode, including `--json`. A JSON record carries an action and a reason, not the file and field that failed, so an error is invisible to an operator unless stderr also gets it.
- `Bun.Glob` has no exclude option. A walker that must skip vendored trees filters scanned paths by segment, and forgetting to leaves the skip silently absent wherever `git check-ignore` is unavailable.
- A bare positional and a subcommand coexist on one command: `aitk docs list` resolves to the subcommand and `aitk docs agents` falls through to the positional. This is what preserves the bash shorthand where any non-verb argument means `get`. A doc named after a verb would be shadowed, which the bash `case` did too.
- Porting a guard means porting its side effects. The bash `guard_root` ran `cd "$target"`, which validated the target existed as a by-product of resolving it. A port that reproduces only the stated purpose drops that check, and `mkdir -p` downstream then scaffolds a typo'd path into a new tree.
- Writing a file through `mktemp` then `mv` replaces it rather than editing it, so the destination inherits the temp file's mode. `merge_user_setting` did this to `~/.claude/settings.json` and silently tightened a 644 file to 600 on every run. Editing a file the operator owns means reading its mode first and restoring it after the write, which is what `writeSettings` does.
- Rewriting a config an operator hand-maintains at a different indent width is a diff they did not ask for. The four `jq` passes normalized tab-indented settings to two spaces. `detectIndent` reads the existing width and `serializeSettings` writes it back, so only the changed keys show up in the diff.
- `import.meta.dir` is undefined under vitest, so `src/exec.ts` throws on import there. Engine modules take the toolkit root as a parameter rather than importing `PROJECT_ROOT`, which keeps them testable and leaves root resolution in the command layer. Tests build fixtures with `mkdtempSync(join(tmpdir(), 'aitk-<domain>-'))`.

## aitk sync

`aitk sync [target]` runs every installed domain sync in sequence (standards, snippets, governance, claude), then runs a git workflow step. The workflow detects which domains changed, previews the commit and pull request body, then prompts with three options: "Commit and open PR" creates `chore/toolkit-sync-YYYYMMDD-HHMM`, commits, pushes, and opens a pull request via `gh`. "Commit only" commits onto the current branch when on a feature branch, or creates the timestamped branch first when on `main` or `master`. "Cancel" skips the workflow. The pull request body lists up to three changed filenames per domain, then a count for the rest.

Claude sync runs under `AITK_NON_INTERACTIVE=1` so the embedded call does not prompt. The three other domain syncs inherit stdin and prompt for their own changes. The combined pull request preview is the confirmation gate for the workflow alone. `aitk claude sync` writes only `.gitignore`, so the changed-file tracking watches that path and a gitignore-only change still reports under a `claude/` domain line. Seed audits stay a manual step through the `claude-seed-sync` skill, and `aitk sync` prints a tip pointing at it when `.claude/` is present.

Governance is the one domain whose sync condition differs from its detection condition. It reports as absent without `.claude/rules/`, yet still syncs when only the retired `.claude/GOV.md` remains, so that the sync can delete it.

The workflow is skipped when the target is not a git root. When `gh` is missing the pull request option is hidden and "Commit only" still works. The timestamped branch name normally avoids collisions, and the workflow stops with a warning when the name already exists locally or on the remote. Two runs inside one minute collide by design.

## Freshness

`aitk sync --check` reports drift and writes nothing. It reads the same `planSync` a sync would apply, so the report cannot disagree with the action it predicts. Drift between syncs is normal, so the check exits 0 by default and CI opts into failing with `--exit-code`.

Every install and sync writes `.claude/aitk.json`, recording the toolkit commit, a timestamp, the domains covered, and a content hash per installed file. The hash is what splits a difference by cause: matching the stamp means the file is untouched since install and the toolkit moved, so the update is mechanical. Anything else is a local edit and a decision. A file no stamp covers stays `drifted`, which is the unattributed verdict every target had before the stamp existed.

The report bounds its upstream read by the stamped commit, so the range is exactly what landed since the last sync and never the whole log. A target synced yesterday reads a few commits and one untouched for months reads many, once. Plugin skills under `claude/` are never copied into a target and load live, so they cannot go stale. New ones appear in a separate read-only section, since nothing about them shows up in a file comparison.

Tooling is not stamped. It runs its own inject and manifest machinery rather than the sync engine, so the stamp names the domains it covers rather than implying it covers everything the toolkit placed.

## CLI

The command surface and its flags live in `docs/agents.md`. That file is the canonical invocation contract for agents.
