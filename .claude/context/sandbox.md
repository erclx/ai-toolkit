---
title: Sandbox
description: Sandbox scenarios for verifying domain flows
---

# Sandbox system

## Overview

Owns the scenarios that provision isolated project states for testing scripts, configs, and skills. Each scenario defines a known starting state plus instructions for what to run and what to expect. The scripts live under `scripts/sandbox/` but the authoring contract is its own thing, which is why this entry is separate from `scripts.md`.

## Layout

- `scripts/sandbox/` owns the scenario scripts, one folder per category
- `scripts/sandbox/<category>/` owns one file per command, each holding one or more named scenarios
- `.sandbox/` owns the provisioned project state at the repo root, recreated per run

| Category   | Covers                                                          |
| ---------- | --------------------------------------------------------------- |
| `tooling/` | Golden configs per stack, plus raw upstream templates           |
| `infra/`   | Domain CLI commands: init, gov, standards, snippets, and others |
| `git/`     | The `git-*` ship-chain skills                                   |
| `claude/`  | The `claude-*` planning, review, and setup skills               |
| `dev/`     | Code-level dev skills                                           |
| `docs/`    | Docs sync scenarios                                             |

Run `aitk sandbox` with no args for the live catalog. Categories and scenarios enumerate dynamically, so nothing here needs updating when one is added.

## Decisions

- Sandboxes are minimal by default: no seeds, no standards, no gov rules, and auto-commit on. A scenario declares only the flags it needs, so the fixture states exactly what it depends on.
- `claude/` scenarios default to `SANDBOX_INJECT_SEEDS="true"` so each models a real post-`aitk init` project. Two documented exceptions: `setup-init.sh` tests `aitk init` itself, and `autoship.sh` wipes the anchor after injection.
- The reset contract belongs to the scenario, not the framework. A scenario that touches a real remote closes its own PRs and force-pushes a fresh main, because only the scenario knows what it created.
- Headless runs pin `--model sonnet` and `--permission-mode acceptEdits` for autonomy and cost control, and assert on structural properties rather than exact wording, since model output varies between runs.
- Git history initializes fresh each run, and a `refs/sandbox/baseline` ref marks the post-setup state so `aitk sandbox reset` restores without provisioning again.

## Gotchas

- Skip `create` scenarios. They require user input with no default and loop on empty input.
- Scenarios that add narrative to a seeded file must append with `>>`. Overwriting with `>` clobbers the seed and breaks any test depending on seed-driven behavior. Reserve `>` for fixtures that deliberately model a clean state.
- Passing a scenario name that matches no option aborts with an `Unknown scenario` error.
- After provisioning, your terminal cwd may need a refresh. Add a wrapper to `.zshrc` or `.bashrc`:

```bash
aitk() {
  command aitk "$@"
  cd .
}
```

- On Windows, back-to-back headless runs can briefly fail to wipe `.sandbox` with a busy-lock. Re-run or `aitk sandbox clean` first.
- An autonomous sonnet run costs roughly $0.10 to $0.25, so drive one skill on demand rather than sweeping the catalog.
- Skills whose body forbids probing project surfaces, such as `toolkit-feedback`, have no fixture to anchor and stay out of scope.

## Running

```bash
aitk sandbox                        # interactive category + command picker
aitk sandbox infra:gov install      # run a specific scenario non-interactively
aitk sandbox reset                  # restore sandbox to baseline
aitk sandbox clean                  # wipe sandbox entirely
```

When a scenario argument is passed, `manage-sandbox.sh` sets `SANDBOX_SCENARIO` and `AITK_NON_INTERACTIVE=1` automatically. Multi-scenario scripts call `select_or_route_scenario` from `lib/ui.sh`, which reads `SANDBOX_SCENARIO` and skips the picker when set.

The `aitk-sandbox-check` skill maps changed plugin skills and changed `scripts/` files on a feature branch to their matching scenarios, so an e2e gap on a script edit surfaces the same way it does on a skill edit.

## Headless skill testing

`scripts/sandbox/run.sh` drives a skill through `claude -p` non-interactively, so a session can test a skill without a human opening an interactive sandbox. It provisions a scenario, invokes the skill from `.sandbox/`, and prints the run envelope as JSON on stdout with a framed summary on stderr.

```bash
scripts/sandbox/run.sh <cat:cmd> "<prompt>" [scenario]
scripts/sandbox/run.sh git:commit "/toolkit:git-commit"
scripts/sandbox/run.sh claude:feature "/toolkit:claude-feature add a widget" small
```

The prompt is the explicit skill invocation. Use the `/toolkit:<skill>` form so `--plugin-dir` resolves the skill whether or not the branch changed it. A bare `/<skill>` only resolves for skills the sandbox injects, which is the subset changed on the current branch.

The JSON envelope carries `is_error`, `result`, `num_turns`, and `total_cost_usd`. Override the model, allowed tools, or turn cap with `AITK_SKILL_TEST_MODEL`, `AITK_SKILL_TEST_TOOLS`, and `AITK_SKILL_TEST_MAX_TURNS`.

## Writing a sandbox

Each sandbox is a `.sh` file with two optional hook functions and a required `stage_setup` function.

### stage_setup

`stage_setup` sets up scenario-specific state. It runs inside `.sandbox/` after provisioning and asset injection are complete. Commit messages inside `stage_setup` must follow `standards/bundled/commit.md` conventions.

```bash
stage_setup() {
  # scaffold scenario state
  # end with scenario ready instructions
  log_step "Scenario ready: ..."
  log_info "Action:  what to run"
  log_info "Expect:  what should happen"
}
```

Multi-scenario files list options before calling `select_or_route_scenario`. Use `: ` as the separator between option name and description, per `.claude/standards/prose.md`. Pad option names so the `:` separators align vertically across the list.

```bash
log_info "install/ : clean target, no rules present"
log_info "sync/    : stale .claude/rules/ present"
log_info "list     : read-only catalog dump, no target needed"
```

### use_config

`use_config` runs before provisioning. Declare it to set sandbox behavior flags.

```bash
use_config() {
  export SANDBOX_SKIP_AUTO_COMMIT="true"  # skip auto-commit after stage_setup
  export SANDBOX_INJECT_SEEDS="true"      # inject tooling/claude/seeds/ into sandbox root
  export SANDBOX_INJECT_STANDARDS="true"  # inject standards/ into sandbox
  export SANDBOX_INJECT_GOV="true"        # inject .claude/rules/ into sandbox
}
```

`SANDBOX_INJECT_SEEDS` is a raw copy of `tooling/claude/seeds/.` into the sandbox root, not a run of `aitk claude init`. It drops `CLAUDE.md` and `.claude/*` seed files before `stage_setup` runs.

### use_anchor

`use_anchor` clones a remote repo as the sandbox base instead of starting empty.

```bash
use_anchor() {
  export ANCHOR_REPO="vite-react-template"
}
```

`manage-sandbox.sh` handles provisioning, asset injection, skill injection, git setup, and baseline tagging. The hook functions configure behavior before that pipeline runs.

After `stage_setup` completes, `manage-sandbox.sh` unions the `claude/skills/**/SKILL.md` diff against `main` with any untracked new skill folders and copies each into `.sandbox/.claude/skills/<name>/SKILL.md`. This covers dev skills authored in the current branch whether or not they are committed yet. Project-scoped skills take priority over the installed plugin, so invoking `/<skill-name>` in the sandbox session exercises the dev version without `--plugin-dir` or `--bare`.

### Disposable GitHub remote (`toolkit-sandbox`)

Set `ANCHOR_REPO="toolkit-sandbox"` when a scenario needs a real GitHub remote for `gh` calls (open PRs, push branches, merge, edit PR bodies). The repo at `${GITHUB_ORG}/toolkit-sandbox` exists for this purpose and is treated as fully disposable. Any scenario for a `gh`-dependent skill should default to this pattern.

Each scenario owns its own reset:

1. Closes any open PRs it will recreate (`gh pr close <branch> 2>/dev/null || true`)
2. Deletes any remote branches it will recreate (`git push origin --delete <branch> -q 2>/dev/null || true`)
3. Force-pushes a fresh main (`git push --force origin HEAD:main`)
4. Recreates branches and opens PRs

Wrap each cleanup call with `2>/dev/null || true` so a missing branch or PR from the prior run does not abort the scenario.
