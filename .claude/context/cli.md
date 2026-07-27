---
title: CLI
description: TypeScript entry point, the exec boundary to bash, and the TS-native command domains
---

# CLI

## Overview

`src/` is the TypeScript CLI entry point. It uses commander to register subcommands and execa to dispatch each one to the corresponding `manage-*.sh` script in `scripts/`. All domain logic remains in bash. Use `@/` absolute imports (mapped to `src/` in `tsconfig.json`).

The layer boundary: TypeScript owns argument parsing plus the domains built TS-first, and bash owns the domain scripts. See `.claude/context/scripts.md` for the bash side.

## Layout

- `src/` owns the entry point (`cli.ts`), the exec helper that resolves `PROJECT_ROOT` and spawns bash (`exec.ts`), the shared terminal UI matching `lib/ui.sh` style (`ui.ts`), and GitHub helpers
- `src/commands/` owns one file per `aitk` subcommand, most of them a thin pass-through to a `manage-*.sh` script
- `src/design/`, `src/slides/`, `src/transcripts/` own the TS-native domains that never reach bash, documented as feature entries in `.claude/context/design.md`, `.claude/context/slides.md`, and `.claude/context/transcripts.md`

## Decisions

- Subcommands stay thin. A command file parses arguments and execs, so behavior changes land in the bash script rather than in two places.
- `sandbox.ts` is the exception that carries interactive select prompts before the exec, because the scenario picker needs the TS prompt surface.
- Feature entries stay separate from this one. They document a user-facing artifact such as the `SLIDES.md` source shape or the design token schema, which is worth reading without the CLI plumbing.

## CLI

The command surface and its flags live in `docs/agents.md`. That file is the canonical invocation contract for agents.
