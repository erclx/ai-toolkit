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
- `write_scope` is a report, not a block. It names where a run reached after the fact, so a skill that writes somewhere it should not still wrote there. The manifest diff covers creates, modifications, and deletions, which is what makes it comparable to the permission check rather than a subset of it. What it cannot do is prevent the write, and it cannot see a write outside `.sandbox/` at all. `scripts.md` holds that blind spot as one finding across both harnesses, since the eval fixture snapshot has the same shape.
- An assertion kind whose input the caller did not supply reports as unchecked rather than dropping out of the count. Omitting `--writes` would otherwise let write scope vanish silently from the cheap standalone path, which is the path most likely to be trusted. A verdict never reports `pass` having asserted nothing, since the declaration counts globs while the verdict counts writes and the two diverge at zero.
- The checker is TypeScript while provisioning stays bash. The harness was closed as bash on the grounds that what remains is `git` and `gh` orchestration plus copying trees, which is true of provisioning and does not describe a component that parses a declaration, aggregates partial failures, and emits counts. Its stated failure mode is asserting nothing while reporting green, which is invisible at runtime, so it has to be the unit-testable part.
- A run reports pass, fail, or unchecked. Absence of a declaration is `unchecked` rather than a pass, since a scenario that asserts nothing cannot pass, and rather than a failure, since failing every undeclared arm would make the harness unusable while expectations roll out. Only a failure exits non-zero.
- `unchecked` keeps its name rather than becoming `unproven`. The state already existed when the reporting gap was scoped, and a second word for one state costs more than the clearer label gains.
- The per-arm verdict was never the coverage problem. A single arm reports `unchecked` honestly, but reading that number across the catalog meant running `find` by hand, so the rollout had no surface. `aitk sandbox coverage` is that surface, and it counts scenarios and arms separately because the two denominators disagree.
- `--strict` inverts the exit rule for a caller that has finished arming. It stays opt-in, since the default has to keep 49 undeclared scenarios runnable.
- Standards and gov rules provision through the real installer rather than a copy. Both copies reimplemented an installer's selection rules, and the standards one omitted the `index.md` a real install rebuilds while neither wrote the `.claude/aitk.json` stamp. A sandbox now carries what a target carries, which is what makes a rule change observable to a run.
- Seeds stay a raw copy. `aitk claude init` does more than drop files, and the scenarios depending on the current shape outnumber the drift the copy risks. Hooks ship inside the seed tree, so a hook change is already reachable by any scenario declaring `SANDBOX_INJECT_SEEDS`.
- The two headless harnesses stay separate. `scripts/standards/authoring-test/` extracts a fixture outside the repository so no ancestor instruction file leaks in, which is the opposite of the sandbox's need to look like a real installed project. Merging them would cost one of the two its defining property.
- A declaration that exists and declares no mechanical assertion fails. That is the silent-truncation failure `scripts/core/install-check.sh` documents in its own comment, where a domain with no assertion stays green while its output shrinks to nothing. Prose in `manual` does not count towards the total, or an arm could carry five lines a checker cannot read and still report green.
- Git history initializes fresh each run, and a `refs/sandbox/baseline` ref marks the post-setup state so `aitk sandbox reset` restores without provisioning again.
- The anchor URL is built once by `sandbox_anchor_url` in `lib/sandbox-git.sh` and reaches GitHub over HTTPS. Eleven call sites hardcoded an SSH URL before, so no anchor scenario could run on a machine carrying only `gh` credentials. `setup_ssh` went with them, since an agent cannot answer a passphrase prompt and nothing authenticates over SSH now.
- The harness sets `credential.helper` to `!gh auth git-credential` on the sandbox repo rather than expecting the operator to run `gh auth setup-git`. `gh auth login` authenticates the CLI and leaves git without a credential, so an authenticated machine still failed at clone. Scoping the helper to the throwaway repo keeps the operator's global config unwritten and covers the pushes the agent makes itself once it is running inside the sandbox.
- Setting that helper resets the list first, with an empty value ahead of the real one. `credential.helper` is multi-valued and git concatenates it across system, global, and local, trying each until one returns a credential. A plain set leaves an operator's own helper ahead of the harness's, so a `store` entry or a stale `gh auth setup-git` token answers first and gh never runs. The failure is a 403 on push, on exactly the machines this change exists to serve, and it is invisible on a machine carrying no global helper.
- `GIT_TERMINAL_PROMPT=0` is exported by `manage-sandbox.sh` and again by `run.sh`. Git falls back to a terminal prompt when no helper supplies a credential, so an unauthenticated run would block on `/dev/tty` rather than fail, which breaks the rule that no command may require a TTY. `run.sh` needs its own export because the agent pushes from a session it spawns, which does not inherit the provisioning environment.
- `stage_anchor_tree` splits where an anchor scenario's tree comes from away from where its remote points. The tree is copied from `scripts/sandbox/fixtures/anchor/create/` through the same `create_from_fixtures` helper every other fixture uses, and the remote stays real because these nine push to it and drive `gh` against it. Cloning the anchor to obtain a starting tree was a file transfer wearing a git costume, since the old path deleted `.git` and re-initialized two lines later.
- `require_sandbox_anchor_config` still runs from `stage_anchor_tree`, in the main shell before provisioning, because `sandbox_anchor_url` is called inside command substitutions where `log_error` exits only the subshell. Without the separate guard an empty `GITHUB_ORG` produced `git remote add origin ""`, which succeeds, leaving the run to fail later somewhere unrelated with exit code 0. The fixture needs no network, so the guard now fires for the remote each scenario configures rather than for the provisioning step itself.
- Identity and remote setup collapse into `configure_sandbox_anchor_remote`, which the nine anchor scenarios call in place of three repeated lines. `configure_sandbox_git_identity` stays callable on its own, since a scenario that never reaches a remote must not acquire one as a side effect. The baseline push stays with each scenario rather than moving into the helper, because five of the nine push after staging their fixture and publishing the anchor content early would change what lands on `origin/main`.

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
- Anchor scenarios used to be order-dependent, because each cloned `toolkit-sandbox` main while several force-push to it, so one arm provisioned from whatever the previous arm published. Two identical sweeps of the sixteen arms disagreed on eleven of them, and `git:ship with-changelog` aborted outright once the anchor already carried the files it commits. Taking the tree from a fixture closes that, since the starting tree no longer depends on the remote's current state. The force-pushes remain, so an assertion that reads `origin/main` rather than the working tree is still order-sensitive.

## Standing limits

Three things a run cannot reach. Each is a property of the harness rather than a gap to close per task, so a claim depending on one is hand-verified and should say so.

- Marketplace install behavior. `run.sh` points `--plugin-dir` at a worktree instead of installing the plugin, so anything whose behavior depends on a real install stays outside the harness.
- A mid-session rule change. Rules are discovered at session start and the harness spawns a fresh session per run, so this binds the session doing the editing rather than the run.
- Host-conditional behavior such as linked-worktree locks or remote-state failures. A standalone sandbox repo cannot reproduce the trigger.

## Prerequisites

Nine scenarios push to a real GitHub remote. They need an authenticated `gh` and membership in the org that owns `toolkit-sandbox`, which is private. Everything else runs offline against an empty sandbox.

```bash
gh auth login   # required for any scenario declaring use_anchor
```

Provisioning itself is offline now that the starting tree comes from a fixture, so the first network call is the scenario's own `configure_sandbox_anchor_remote` and the push that follows. No precondition checks `gh auth status`, so a missing credential surfaces as a push failure naming the host rather than as a named precondition error. `GIT_TERMINAL_PROMPT=0` is what keeps that immediate instead of a blocked prompt. Org membership is a real requirement and not an accident of the setup, since HTTPS fixes transport rather than authorization and a contributor outside the org still cannot run the anchor scenarios.

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
scripts/sandbox/run.sh git:commit "/aitk:git-commit"
scripts/sandbox/run.sh claude:feature "/aitk:claude-feature add a widget" small
```

The prompt is the explicit skill invocation. Use the `/aitk:<skill>` form so `--plugin-dir` resolves the skill whether or not the branch changed it. A bare `/<skill>` only resolves for skills the sandbox injects, which is the subset changed on the current branch.

The JSON envelope carries `is_error`, `result`, `num_turns`, and `total_cost_usd`, plus a `verdict` object holding `state`, `asserted`, `failed`, and `unchecked`. Override the model, allowed tools, turn cap, or permission mode with `AITK_SKILL_TEST_MODEL`, `AITK_SKILL_TEST_TOOLS`, `AITK_SKILL_TEST_MAX_TURNS`, and `AITK_SKILL_TEST_PERMISSION_MODE`.

The envelope alone never decided anything. Two arms on 2026-07-29 returned `error=false` having written nothing and meeting none of their scenario's stated expectations, and a suite scoring on the envelope would have counted both as passes. `run.sh` now snapshots the tree before the session, diffs it after, and hands the result to `aitk sandbox check`, whose exit code becomes the run's outcome.

Every run also lands at `.claude/.tmp/sandbox-runs/<target>-<arm>-<timestamp>.json`, and `run.sh` logs the path on stderr. The file holds what stdout emitted plus a `writes` array. Both are needed to score a run again later: `aitk sandbox check` recovers the tree-based assertions from surviving `.sandbox/` state, but `max_turns` reads the envelope and `write_scope` reads the writes list, and the temp files carrying those are deleted at the end of the run.

The record is gitignored scratch with no rotation, one file per run. Writing it is additive and stdout stays the data contract, so a failure to record warns and prints the verdict anyway. Nothing prunes the folder, which makes it a scratch-lifecycle question rather than an oversight. It belongs with the other scratch catalogs whenever that track settles when a folder's contents expire.

The default turn cap is 30. It was 20 until 2026-07-30, when a clean `claude/docs` `drift` run took 29 turns and would have truncated. A truncated run fails the same assertions as a reasoning miss with nothing to tell them apart, so the global default sits above observed cost.

Set an arm's ceiling equal to the cap rather than under it, which is the relationship `drift` carries at 30 against the default 30. A truncated run reports one turn past its cap, so an equal ceiling still catches truncation, while a lower one fails legitimate runs that land in the gap between the two numbers.

Estimate an arm's cost from what it reads rather than from what it writes. `board-sweep` was projected to need a raised cap because it marks one more outcome and moves one more plan than `drift`, and it came in at 28 against `drift`'s 29. The extra mutations are a few edits, while the turns go to reading the board and reasoning about it, which both arms do once. A projected budget is worth nothing next to one real run, so declare the ceiling at the default and correct it from the first observation.

`AITK_SKILL_TEST_MAX_TURNS` is the only budget. An arm's `max_turns` is a ceiling the checker asserts after the run, and `run.sh` never reads `expect.toml`, so a declaration cannot raise the cap it runs under. An arm needing more than the default truncates, and if its declared ceiling sits above the cap it passes that one assertion while failing the rest. Raise the default or set the variable per run. A per-arm budget would need `run.sh` to parse the declaration, which nothing has yet asked for.

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

Expectations are not agent-only. An `infra` arm invoking the CLI directly declares the same way, minus `max_turns`. No agent drives it, so no envelope is produced and a ceiling would sit permanently skipped rather than assert anything. `infra/wiki` carries one declaration per arm and is the pattern to copy for a CLI scenario.

`src/sandbox/expect.test.ts` builds a tree per assertion kind that violates it and requires a red verdict. A checker exercised only against a correct tree cannot distinguish asserting correctly from asserting nothing, so the negative trees are the point rather than extra coverage.

## Coverage

`aitk sandbox coverage` reports which scenarios declare expectations and which only provision a state. It reads the fixture tree rather than running anything, so it costs nothing and needs no provisioned sandbox.

```bash
aitk sandbox coverage           # framed report on stderr
aitk sandbox coverage --json    # machine copy on stdout
aitk sandbox coverage --strict  # exit 1 while any scenario declares nothing
```

Scenarios and arms count separately. Seven arms across three scenarios out of fifty-two is 5 percent of scenarios, not the 13 percent that dividing arms by scenarios produces, and the report prints both rather than picking the flattering one.

The twelve scenarios declaring `SANDBOX_INJECT_STANDARDS` or `SANDBOX_INJECT_GOV` are the first candidates for arming. Moving to the real installers narrowed what they receive from all 38 source rules to the 20 in `base`, and none of the twelve declares expectations, so nothing in the harness would detect a scenario that depended on a rule outside `base`. The overlap against the seven armed arms is empty, so no existing assertion is affected, but the residual is invisible by exactly the measure this section exists to report.

A scenario enumerates from its script under `scripts/sandbox/<category>/`, not from the fixture tree. An unarmed scenario has no fixture directory to find, so counting fixtures would hide exactly the arms the report exists to surface. A declaration sitting at the command root belongs to the unnamed arm and reports as `(default)`.

`aitk sandbox check` takes `--strict` as well, which turns a single `unchecked` verdict into a non-zero exit. Both flags stay opt-in so the undeclared majority keeps running.

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

`scripts/sandbox/fixtures/anchor/create/` is the one tree outside the four-segment layout. It belongs to no single scenario, since all nine anchor scenarios provision from it, so `stage_anchor_tree` calls `create_from_fixtures` directly rather than going through `stage_fixtures`. It holds the minimum a scenario reads: `utils.js`, which `git/{pr,issue,followup}.sh` append to, plus a `.gitignore` matching what `init_empty_sandbox` writes. Three of the nine wipe the tree before staging their own and two overwrite what they need, so growing this fixture is warranted only when a scenario reads a file that is missing.

A stage must leave the tree coherent with what the scenario claims it staged. `02-postgres` on the `claude/docs` `drift` arm replaced `src/db.ts` alone, moving `createTask` to `(title, userId)` and returning `rows[0]`, while `src/routes/tasks.ts` stayed at its `01-initial` content calling `createTask(title)` and reading `result.lastInsertRowid`. The commit message said the migration shipped and the route did not compile against the module it imported.

A skill reading that diff saw a half-migration, correctly declined to mark the outcome, and failed four assertions. A stage that changes a module's signature carries its callers, or the arm tests the fixture's incoherence rather than the skill.

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

`SANDBOX_INJECT_SEEDS` is a raw copy of `tooling/claude/seeds/.` into the sandbox root, not a run of `aitk claude init`. It drops `CLAUDE.md` and `.claude/*` seed files before `stage_setup` runs. Hooks ride along in that tree, which is what makes a hook change observable to a run.

`SANDBOX_INJECT_STANDARDS` and `SANDBOX_INJECT_GOV` run `aitk standards install` and `aitk gov install` against the sandbox rather than copying source trees. The installer decides what lands, so the sandbox cannot drift from what a target receives, and provisioning exercises the installer as a side effect. `SANDBOX_GOV_STACK` picks the stack and defaults to `base`.

A stack install narrows what arrives. The copy it replaced took all 38 rules under `governance/rules`, while `base` resolves to 20, which is what a real target holds since no project carries both the React and FastAPI rules. A scenario needing a framework's rules sets `SANDBOX_GOV_STACK` rather than assuming every rule is present.

A failed install aborts provisioning with the installer's own stderr, since a sandbox missing the rules a scenario depends on would otherwise fail later somewhere unrelated.

### use_anchor

`use_anchor` marks a scenario as one that needs a real remote. Declaring it stages the sandbox from the anchor fixture instead of starting empty, and names the repository the scenario will push to.

All nine declare it the same way, delegating to `use_sandbox_anchor` in `lib/sandbox-git.sh` so the repository name lives in one place:

```bash
use_anchor() {
  use_sandbox_anchor
}
```

`ANCHOR_REPO` carried a `vite-react-template` default until 2026-08-01. Nothing reached it, since every declaring scenario calls `use_sandbox_anchor` with no argument and resolves to `toolkit-sandbox`, so it was removed rather than kept as a fallback.

The library exports `use_sandbox_anchor` rather than declaring `use_anchor` itself. `manage-sandbox.sh` keys off `type -t use_anchor` to decide between staging the anchor fixture and starting empty, so a hook declared at source time would hand an anchor to `git/commit.sh`, `git/stage.sh`, and `infra/indexes.sh`, which source the file for the identity helpers alone.

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
