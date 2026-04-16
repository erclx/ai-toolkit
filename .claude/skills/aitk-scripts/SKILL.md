---
name: aitk-scripts
description: CLI entry point, bash scripts, sandbox scenarios, and lib functions. Use for src/, manage-*.sh, sandbox hooks, or shared lib/ functions.
---

# Scripts

Read `docs/scripts.md` for structure, file inventory, and lib responsibilities before editing.

## Before editing

- Read `.claude/GOV.md` before writing or editing code in `src/` or `scripts/`.

## Lib rules

- Each lib file owns one concern. Read `docs/scripts.md` for responsibilities before adding or modifying.
- Never duplicate logic that already exists in `lib/`. When adding a function, check if any existing script duplicates the logic and consolidate.

## Sandbox pattern

- Each sandbox defines three hooks: `use_config` (flags before provisioning), `use_anchor` (remote repo as base), `stage_setup` (scenario state after provisioning).
- Only `stage_setup` is required. End it with `log_step` describing what to run and what to expect.
- Default behavior: no standards, no gov rules, no Gemini settings, auto-commit on. Declare only the flags you need in `use_config`.
- For multi-scenario scripts, call `select_or_route_scenario "Which scenario?" "a" "b"` instead of `select_option`. It reads `SANDBOX_SCENARIO` to skip the picker when set by `aitk sandbox <cat>:<cmd> <scenario>`. End every scenario `case` with a `*) log_error "Unknown scenario: $SELECTED_OPTION" ;;` arm. Use slug-style scenario names (no spaces) so agents can pass them without quoting.

## Sync checklist

When adding a command to any `manage-*.sh`:

- Update the corresponding scenario list in `scripts/sandbox/infra/*.sh`
- Update the CLI table in `README.md`

After editing scripts in a domain that has a sandbox scenario:

- Run `aitk sandbox infra:{domain} install` and `aitk sandbox infra:{domain} sync` to verify
- Skip `create` scenarios. They require interactive input and will loop on empty input.

## Reference

- `docs/scripts.md`: structure, file inventory, core scripts, lib responsibilities
- `docs/sandbox.md`: sandbox system, hook pattern, provisioning flow, scenario catalog
- `prompts/bash-script.md`: bash style rules
