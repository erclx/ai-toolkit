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

## Decisions

- A migrated command defines its real option surface in commander rather than forwarding argv. `indexes` is the first, so a mistyped subcommand now fails with a suggestion instead of reaching a shell script. Every command still on bash carries `allowUnknownOption()` and parses nothing.
- Commands still on bash stay thin. A command file parses arguments and execs, so behavior changes land in the bash script rather than in two places.
- The root program sets `helpOption(false)` for its own hand-rolled help, and subcommands inherit it. A migrated command re-enables help explicitly at each level or `--help` returns an unknown-option error.
- Tests run under `bun --bun vitest` rather than plain vitest. Migrated code uses `Bun.YAML`, `Bun.Glob`, and `Bun.$`, which do not exist in the Node runtime vitest defaults to.
- Bash that still needs a migrated capability shells into the CLI by path (`bun "$PROJECT_ROOT/src/cli.ts" ...`) rather than via the global `aitk`, so a linked worktree exercises its own code.
- `sandbox.ts` is the exception that carries interactive select prompts before the exec, because the scenario picker needs the TS prompt surface.
- Feature entries stay separate from this one. They document a user-facing artifact such as the `SLIDES.md` source shape or the design token schema, which is worth reading without the CLI plumbing.

## CLI

The command surface and its flags live in `docs/agents.md`. That file is the canonical invocation contract for agents.
