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
- `src/sync/` owns the domain sync engine shared across gov, snippets, and standards, with the per-domain adapters in `src/gov/`, `src/snippets/`, and `src/standards/`
- `src/docs/` and `src/wiki/` own the two read-only domains, which reach for no shared engine because neither syncs into a target
- `src/claude/` owns seed planning, the gitignore preview, and the user settings merge, the three pieces the `claude` dispatcher held before it was deleted

## Decisions

- A migrated command defines its real option surface in commander rather than forwarding argv. `indexes` is the first, so a mistyped subcommand now fails with a suggestion instead of reaching a shell script. Every command still on bash carries `allowUnknownOption()` and parses nothing.
- Commands still on bash stay thin. A command file parses arguments and execs, so behavior changes land in the bash script rather than in two places.
- A domain migrates one verb at a time rather than all at once. `tooling`, `gov`, and `snippets` register their migrated verbs natively and name each remaining verb as an explicit pass-through, which is what let each dispatcher be deleted before every verb had moved. Naming them, rather than falling back to `allowUnknownOption()` on the whole domain, keeps `--help` honest for the verbs that did move.
- The pass-through registration lives in `src/commands/pass-through.ts` and takes the domain name, since the loop is identical for every domain and only the banner and script path vary. Gov, snippets, and standards all call it. A verb whose script sits somewhere other than `scripts/<domain>/<verb>.sh` registers by hand instead, which is why `standards install` still names the dispatcher.
- The dispatcher used to open the timeline frame for every verb under it. When a dispatcher is deleted, whichever layer runs first has to open the frame instead, or the bash verb emits a closing `└` with nothing above it. Each pass-through calls `intro` before it execs for exactly this reason.
- A pass-through verb sets `helpOption(false)`. Commander resolves `--help` before the action runs, so leaving the built-in option on prints a one-line stub and hides the flag surface the bash script documents. Disabling it lets the flag reach the script, which owns that surface until the verb migrates.
- A helper lifts to the `src/` root once a second domain needs it. `stripFrontmatter` moved out of `src/gov/payload.ts` into `src/frontmatter.ts` when `docs` arrived, rather than having `docs` import from `gov` and carry a dependency it has no reason to. `copyPreservingMode` was lifted the same way.
- A command whose stdout is the product writes the document with `process.stdout.write` and everything else with the `log_*` helpers, which are stderr-only. `aitk docs <topic>` is the one command a caller captures with `$(...)`, so a single frame character on stdout would corrupt the document silently rather than failing.
- Anything that writes a file into a target routes through `copyPreservingMode` in `src/copy.ts`. `copyFile` imposes the source's mode on an existing destination, so a target file deliberately at 600, or one an earlier layer made executable, comes back at the source's mode. The bash `cp` it replaces left an existing mode alone.
- A verb that writes outside a target takes its destination as an argument. `aitk claude setup` defaults to `$HOME/.claude` but accepts a path, which is the only way to cover the settings merge without pointing a test at the operator's real config. The sandbox scenario passes a sandbox-local path for the same reason.
- A preview and the apply it precedes run the same function. `planGitignore` dry-runs `mergeSections`, the function the apply calls, so the two cannot disagree. The bash re-parsed the manifest with a line regex that only matched a single-line array, which meant the preview and the write read the source differently.
- Behavior shared across domains lands in `src/sync/` rather than in the first domain that needs it. Gov is the first consumer of the sync engine, and burying it under `src/gov/` would force a move as soon as snippets arrives.
- An adapter supplies only a source lookup and, optionally, surfaces the file walk cannot see. Snippets landed against the engine with no change to it, which is the evidence that `SyncAdapter` generalizes rather than describing gov. Treat a required engine change in a later adapter as a finding, and prefer widening the adapter interface over branching inside the engine.
- Standards is the adapter that needed the engine widened, and it took three optional fields rather than a branch on the domain name: `nonInteractive`, `isExcluded`, and `onComplete`. Each defaults to the behavior gov and snippets already had, so a widening cannot silently change an existing adapter.
- The non-interactive policy is a discriminated union rather than a boolean. A headless run applies for a toolkit-owned domain and refuses for one whose files a project edits, and the refusing variant carries its own message and hint so the engine never holds domain copy.
- The root program sets `helpOption(false)` for its own hand-rolled help, and subcommands inherit it. A migrated command re-enables help explicitly at each level or `--help` returns an unknown-option error.
- Tests run under `bun --bun vitest` rather than plain vitest. Migrated code uses `Bun.YAML`, `Bun.Glob`, and `Bun.$`, which do not exist in the Node runtime vitest defaults to.
- Bash that still needs a migrated capability shells into the CLI by path (`bun "$PROJECT_ROOT/src/cli.ts" ...`) rather than via the global `aitk`, so a linked worktree exercises its own code.
- `sandbox.ts` is the exception that carries interactive select prompts before the exec, because the scenario picker needs the TS prompt surface.
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

## CLI

The command surface and its flags live in `docs/agents.md`. That file is the canonical invocation contract for agents.
