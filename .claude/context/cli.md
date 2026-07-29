---
title: CLI
description: TypeScript entry point, the exec boundary to bash, and the TS-native command domains
---

# CLI

## Overview

`src/` is the TypeScript CLI entry point. It uses commander to register subcommands and execa to dispatch most of them to the corresponding `manage-*.sh` script in `scripts/`. Domains are being migrated off bash one at a time. Use `@/` absolute imports (mapped to `src/` in `tsconfig.json`).

The layer boundary: TypeScript owns argument parsing plus every migrated domain, and bash owns what has not moved yet. See `.claude/context/scripts.md` for the bash side.

## Layout

- `src/` owns the entry point (`cli.ts`), the exec helper that resolves `PROJECT_ROOT` and spawns bash (`exec.ts`), the shared terminal UI matching `lib/ui.sh` style (`ui.ts`), and GitHub helpers
- `src/commands/` owns one file per `aitk` subcommand, each one not yet migrated a thin pass-through to a `manage-*.sh` script
- `src/design/`, `src/slides/`, `src/transcripts/` own the domains built TS-first, documented as feature entries in `.claude/context/design.md`, `.claude/context/slides.md`, and `.claude/context/transcripts.md`
- `src/indexes/` owns the index engine, the first domain migrated off bash, documented in `.claude/context/indexes.md`
- `src/tooling/` owns the tooling inject and scan engine, documented in `.claude/context/tooling.md`
- `src/sync/` owns the domain sync engine shared across gov, snippets, and standards, with the gov half in `src/gov/`

## Decisions

- A migrated command defines its real option surface in commander rather than forwarding argv. `indexes` is the first, so a mistyped subcommand now fails with a suggestion instead of reaching a shell script. Every command still on bash carries `allowUnknownOption()` and parses nothing.
- Commands still on bash stay thin. A command file parses arguments and execs, so behavior changes land in the bash script rather than in two places.
- A domain migrates one verb at a time rather than all at once. `tooling` and `gov` register their migrated verbs natively and name each remaining verb as an explicit pass-through, which is what let each dispatcher be deleted before every verb had moved. Naming them, rather than falling back to `allowUnknownOption()` on the whole domain, keeps `--help` honest for the verbs that did move.
- The dispatcher used to open the timeline frame for every verb under it. When a dispatcher is deleted, whichever layer runs first has to open the frame instead, or the bash verb emits a closing `└` with nothing above it. Each gov pass-through calls `intro` before it execs for exactly this reason.
- Behavior shared across domains lands in `src/sync/` rather than in the first domain that needs it. Gov is the first consumer of the sync engine, and burying it under `src/gov/` would force a move as soon as snippets arrives.
- The root program sets `helpOption(false)` for its own hand-rolled help, and subcommands inherit it. A migrated command re-enables help explicitly at each level or `--help` returns an unknown-option error.
- Tests run under `bun --bun vitest` rather than plain vitest. Migrated code uses `Bun.YAML`, `Bun.Glob`, and `Bun.$`, which do not exist in the Node runtime vitest defaults to.
- Bash that still needs a migrated capability shells into the CLI by path (`bun "$PROJECT_ROOT/src/cli.ts" ...`) rather than via the global `aitk`, so a linked worktree exercises its own code.
- `sandbox.ts` is the exception that carries interactive select prompts before the exec, because the scenario picker needs the TS prompt surface.
- Feature entries stay separate from this one. They document a user-facing artifact such as the `SLIDES.md` source shape or the design token schema, which is worth reading without the CLI plumbing.

## Gotchas

- Set `process.exitCode` in a command action. Calling `process.exit()` ends the process before an async stdout write drains, which silently truncates piped output at the 64K pipe buffer while still reporting the right exit code. Redirecting to a file hides it, so this only shows up through a pipe.
- Diagnostics belong on stderr in every mode, including `--json`. A JSON record carries an action and a reason, not the file and field that failed, so an error is invisible to an operator unless stderr also gets it.
- `Bun.Glob` has no exclude option. A walker that must skip vendored trees filters scanned paths by segment, and forgetting to leaves the skip silently absent wherever `git check-ignore` is unavailable.
- `import.meta.dir` is undefined under vitest, so `src/exec.ts` throws on import there. Engine modules take the toolkit root as a parameter rather than importing `PROJECT_ROOT`, which keeps them testable and leaves root resolution in the command layer. Tests build fixtures with `mkdtempSync(join(tmpdir(), 'aitk-<domain>-'))`.

## CLI

The command surface and its flags live in `docs/agents.md`. That file is the canonical invocation contract for agents.
