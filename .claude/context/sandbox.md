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
- `scripts/sandbox/fixtures/` owns file content staged into the sandbox, one tree per scenario arm
- `.sandbox/` owns the provisioned project state at the repo root, recreated per run

| Category   | Covers                                                          |
| ---------- | --------------------------------------------------------------- |
| `tooling/` | Golden configs per stack, plus raw upstream templates           |
| `infra/`   | Domain CLI commands: init, gov, standards, snippets, and others |
| `git/`     | The `git-*` ship-chain skills                                   |
| `claude/`  | The `claude-*` planning, review, and setup skills               |
| `dev/`     | Code-level dev skills                                           |
| `docs/`    | Docs sync scenarios                                             |

Run `aitk sandbox` with no args for the live catalog. Categories and scenarios enumerate dynamically, so nothing here needs updating when one is added. `fixtures/` sits alongside the categories but holds no scenarios, so both pickers filter it out by name.

## Decisions

- Sandboxes are minimal by default: no seeds, no standards, no gov rules, and auto-commit on. A scenario declares only the flags it needs, so the fixture states exactly what it depends on.
- `claude/` scenarios default to `SANDBOX_INJECT_SEEDS="true"` so each models a real post-`aitk init` project. Two documented exceptions: `setup-init.sh` tests `aitk init` itself, and `autoship.sh` wipes the anchor after injection.
- The reset contract belongs to the scenario, not the framework. A scenario that touches a real remote closes its own PRs and force-pushes a fresh main, because only the scenario knows what it created.
- Headless runs pin `--model sonnet` for cost control and assert on structural properties rather than exact wording, since model output varies between runs.
- Headless runs use `--permission-mode bypassPermissions`. Probing on 2026-07-30 found that `acceptEdits` denies writes under `.claude/`, and neither an `--allowedTools` glob nor a `permissions.allow` rule in `settings.json` lifts it. Arms that write planning docs could not run at all under the old mode. The scoping the permission layer used to supply now comes from `write_scope`, asserted after the run instead of enforced during it.
- The checker is TypeScript while provisioning stays bash. The harness was closed as bash on the grounds that what remains is `git` and `gh` orchestration plus copying trees, which is true of provisioning and does not describe a component that parses a declaration, aggregates partial failures, and emits counts. Its stated failure mode is asserting nothing while reporting green, which is invisible at runtime, so it has to be the unit-testable part.
- A run reports pass, fail, or unchecked. Absence of a declaration is `unchecked` rather than a pass, since a scenario that asserts nothing cannot pass, and rather than a failure, since failing every undeclared arm would make the harness unusable while expectations roll out. Only a failure exits non-zero.
- A declaration that exists and declares no mechanical assertion fails. That is the silent-truncation failure `scripts/core/install-check.sh` documents in its own comment, where a domain with no assertion stays green while its output shrinks to nothing. Prose in `manual` does not count towards the total, or an arm could carry five lines a checker cannot read and still report green.
- Git history initializes fresh each run, and a `refs/sandbox/baseline` ref marks the post-setup state so `aitk sandbox reset` restores without provisioning again.

## Gotchas

- Skip `create` scenarios. They require user input with no default and loop on empty input.
- A scenario that adds narrative to a seeded file must append rather than overwrite. Overwriting clobbers the seed and breaks any test depending on seed-driven behavior. In a fixture tree that is the `create/` versus `append/` split. Written inline it is `>` versus `>>`.
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

The JSON envelope carries `is_error`, `result`, `num_turns`, and `total_cost_usd`, plus a `verdict` object holding `state`, `asserted`, `failed`, and `unchecked`. Override the model, allowed tools, turn cap, or permission mode with `AITK_SKILL_TEST_MODEL`, `AITK_SKILL_TEST_TOOLS`, `AITK_SKILL_TEST_MAX_TURNS`, and `AITK_SKILL_TEST_PERMISSION_MODE`.

The envelope alone never decided anything. Two arms on 2026-07-29 returned `error=false` having written nothing and meeting none of their scenario's stated expectations, and a suite scoring on the envelope would have counted both as passes. `run.sh` now snapshots the tree before the session, diffs it after, and hands the result to `aitk sandbox check`, whose exit code becomes the run's outcome.

## Expectations

An arm declares what a correct run leaves behind in `expect.toml`, beside its numbered stage directories. `aitk sandbox check <category>:<command> [arm]` reads it, asserts against `.sandbox/`, and prints a verdict. Run it standalone against an already-provisioned sandbox to iterate without paying for another session.

| Key           | Asserts                                                      |
| ------------- | ------------------------------------------------------------ |
| `paths`       | Files that must exist after the run                          |
| `absent`      | Files that must not exist                                    |
| `content`     | Array of tables, each a `path` and a `pattern` it must match |
| `write_scope` | Globs bounding where the session may write                   |
| `manual`      | Prose the checker cannot assert, reported as unchecked       |
| `max_turns`   | Turn ceiling, above which the run fails                      |

Patterns use TOML literal strings (`'^- \[x\] done'`) so a regex needs no backslash escaping. The split between mechanical and human-judged is per expectation, not per skill: the `claude/docs` `drift` arm produces both kinds in one run, three the checker asserts and two needing a reader.

`src/sandbox/expect.test.ts` builds a tree per assertion kind that violates it and requires a red verdict. A checker exercised only against a correct tree cannot distinguish asserting correctly from asserting nothing, so the negative trees are the point rather than extra coverage.

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

### Fixtures

A scenario's file content lives under `scripts/sandbox/fixtures/<category>/<scenario>/<arm>/<stage>/`, and `stage_fixtures` from `lib/sandbox-fixtures.sh` copies one stage into the sandbox. The scenario keeps its own git operations between the calls, so the script holds logic and the tree holds content.

```bash
stage_fixtures claude docs drift 01-initial
git add . && git commit -m "feat(api): initial task endpoints" --no-verify -q
stage_fixtures claude docs drift 02-postgres
```

The first two segments mirror the scenario's own path at `scripts/sandbox/<category>/<scenario>.sh`. Both are needed, since four scenario basenames repeat across categories (`claude`, `docs`, `review`, and `sync`) and `docs` is a category as well.

Each stage splits into two optional subfolders. `create/` copies files in, making parent directories and overwriting whatever is there. `append/` concatenates onto a file the anchor or the injected seeds already provide, and fails when the target is missing, because an absent target means the upstream shape changed and the scenario's assumption is stale.

Every stored file carries a `.fixture` suffix that the helper strips on copy. The suffix keeps the repository's own checks off the content, since an `index.md.fixture` is not an `index.md`. `aitk indexes regen` leaves it alone, and prettier, `shfmt`, and `shellcheck` skip it too. Without the suffix, a fixture that deliberately drifts from its sibling frontmatter gets normalized by `bun run check` and the state it models disappears.

Stage numbering carries ordering, not identity. A stage exists because a commit or a branch switch has to happen before the next file lands.

### use_config

`use_config` runs before provisioning. Declare it to set sandbox behavior flags.

```bash
use_config() {
  export SANDBOX_SKIP_AUTO_COMMIT="true"  # skip auto-commit after stage_setup
  export SANDBOX_INJECT_SEEDS="true"      # inject tooling/claude/seeds/ into sandbox root
  export SANDBOX_INJECT_STANDARDS="true"  # inject standards into .claude/standards/
  export SANDBOX_INJECT_GOV="true"        # inject .claude/rules/ into sandbox
}
```

`SANDBOX_INJECT_SEEDS` is a raw copy of `tooling/claude/seeds/.` into the sandbox root, not a run of `aitk claude init`. It drops `CLAUDE.md` and `.claude/*` seed files before `stage_setup` runs.

`SANDBOX_INJECT_STANDARDS` writes `.claude/standards/`, matching what `aitk standards install` produces. It copies the flat `standards/` root only, so `bundled/` and `aitk/` stay out, and omits `index.md`, which a real install rebuilds against the files that landed.

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
