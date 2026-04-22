---
name: aitk-scripts
description: CLI entry point, bash scripts, sandbox scenarios, and lib functions. Use for `src/`, `manage-*.sh`, sandbox hooks, or shared `lib/` functions.
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
- For `claude/` scenarios, default to `SANDBOX_INJECT_SEEDS="true"`. See the rule and its two exceptions in `docs/sandbox.md`.
- For multi-scenario scripts, call `select_or_route_scenario "Which scenario?" "a" "b"` instead of `select_option`. It reads `SANDBOX_SCENARIO` to skip the picker when set by `aitk sandbox <cat>:<cmd> <scenario>`. End every scenario `case` with a `*) log_error "Unknown scenario: $SELECTED_OPTION" ;;` arm. Use slug-style scenario names (no spaces) so agents can pass them without quoting.
- One sandbox file per skill. Before adding a new scenario, check if `scripts/sandbox/<cat>/<skill>.sh` exists. If so, extend it with a `select_or_route_scenario` call and a new `case` arm. Do not create sibling files.
- Sandbox scenarios mirror realistic use of the skill. Pick a happy-path shape that succeeds end-to-end. Put adversarial cases in a separate named scenario arm (e.g. `conflict`, `degraded`, `empty`) so pass/fail reads as a property of the skill, not the fixture.
- When testing a skill that has a sandbox scenario, run `aitk sandbox <cat>:<cmd>` yourself before handing off. Tell the user the exact skill invocation and what to expect.
- When testing uncommitted script edits from a linked worktree, invoke the script via its worktree-local path like `./scripts/manage-sandbox.sh <cat>:<cmd>`. Global `aitk` resolves to the main repo's scripts and cannot see worktree changes until they land on main.
- After refactoring a sandbox scenario, do not claim verified from a green run alone. Diff `.sandbox/` contents, file list, and `git log` against the pre-refactor behavior or spec, and report the comparison in the done message.

## Sync checklist

When adding a command to any `manage-*.sh`:

- Update the corresponding scenario list in `scripts/sandbox/infra/*.sh`
- Update the CLI table in `README.md`

After editing scripts in a domain that has a sandbox scenario:

- Run `aitk sandbox infra:{domain} install` and `aitk sandbox infra:{domain} sync` to verify
- Skip `create` scenarios. They require interactive input and will loop on empty input.

## Reference

- `docs/scripts.md`: structure, file inventory, core scripts, lib responsibilities
- `docs/agents.md`: output shape and stream contract for every CLI command
- `docs/sandbox.md`: sandbox system, hook pattern, provisioning flow, scenario catalog
- `prompts/bash-script.md`: bash style rules
