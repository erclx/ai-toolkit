---
name: aitk-scripts
description: CLI entry point, bash scripts, sandbox scenarios, and lib functions. Use for src/, manage-*.sh, sandbox hooks, or shared lib/ functions.
---

# Scripts

## TypeScript dispatch layer

- `src/cli.ts` is the `aitk` entry point. It registers subcommands via commander and dispatches each to the corresponding `manage-*.sh` script via execa.
- `src/exec.ts` resolves `PROJECT_ROOT` from `import.meta.dir` and exports `execScript`, the shared spawn helper.
- `src/ui.ts` provides terminal UI primitives (`intro`, `outro`, `select`, `confirm`) matching the `❯` arrow style from `lib/ui.sh`
- `src/commands/*.ts` each export a `register` function. One file per domain. Most are pass-through dispatchers. `sandbox.ts` uses the shared `select` for the interactive picker, then execs bash with the resolved command.
- Use `@/` absolute imports (mapped to `src/` in `tsconfig.json`).

## Bash entry points

- `manage-*.sh` files dispatch to subcommands only. No logic lives in entry points directly.
- Each `manage-*.sh` maps to one domain. Do not cross domains in a single entry point.

## Lib functions

- `lib/` contains shared functions sourced by scripts. Never duplicate logic that already exists there.
- Each lib file owns one concern. Read `docs/scripts.md` for responsibilities before adding or modifying.
- When adding a function to `lib/`, check if any existing script duplicates the logic and consolidate.

## Sandbox pattern

- Each sandbox defines three hooks: `use_config` (flags before provisioning), `use_anchor` (remote repo as base), `stage_setup` (scenario state after provisioning).
- Only `stage_setup` is required. End it with `log_step` describing what to run and what to expect.
- Default behavior: no standards, no gov rules, no Gemini settings, auto-commit on. Declare only the flags you need in `use_config`.

## Sync checklist

When adding a command to any `manage-*.sh`:

- Update the corresponding scenario list in `scripts/sandbox/infra/*.sh`
- Update the CLI table in `README.md`

## Full reference

- `docs/scripts.md`: scripts structure, core scripts, lib responsibilities
- `docs/sandbox.md`: sandbox system, hook pattern, provisioning flow
- `prompts/bash-script.md`: bash style rules
