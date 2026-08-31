---
title: Overview
description: What the sandbox domain owns, the scenario categories, and the standing limits a run cannot reach
---

# Overview

Owns the scenarios that provision isolated project states for testing scripts, configs, and skills. Each scenario defines a known starting state plus instructions for what to run and what to expect. The scripts live under `scripts/sandbox/` but the authoring contract is its own thing, which is why this entry is separate from `.claude/context/scripts/index.md`.

## Layout

- `scripts/sandbox/` owns the scenario scripts, one folder per category
- `scripts/sandbox/<category>/` owns one file per command, each holding one or more named scenarios
- `scripts/sandbox/fixtures/` owns file content staged into the sandbox, one tree per scenario arm
- `$XDG_STATE_HOME/aitk/sandbox-<run-id>` owns the provisioned project state, outside the repository and unique to the run that provisioned it

Run `aitk sandbox` with no args for the live catalog. Categories and scenarios enumerate dynamically, so nothing here needs updating when one is added. `fixtures/` sits alongside the categories but holds no scenarios, so both pickers filter it out by name.

- `tooling/`: golden configs per stack, plus raw upstream templates
- `infra/`: domain CLI commands, covering init, gov, standards, snippets, and others
- `git/`: the `git-*` ship-chain skills
- `claude/`: the `claude-*` planning, review, and setup skills
- `dev/`: code-level dev skills
- `docs/`: docs sync scenarios

## Decisions

### Scenario defaults and the reset contract

- Sandboxes are minimal by default: no seeds, no standards, no gov rules, and auto-commit on. A scenario declares only the flags it needs, so the fixture states exactly what it depends on.
- `claude/` scenarios default to `SANDBOX_INJECT_SEEDS="true"` so each models a real post-`aitk init` project. Two documented exceptions: `setup-init.sh` tests `aitk init` itself, and `autoship.sh` wipes the anchor after injection.
- The reset contract belongs to the scenario, not the framework. A scenario that touches a real remote closes its own PRs and force-pushes a fresh main, because only the scenario knows what it created.

### Headless runs and permissions

Headless runs pin `--model sonnet` for cost control and assert on structural properties rather than exact wording, since model output varies between runs. They also use `--permission-mode bypassPermissions`. `acceptEdits` denies writes under `.claude/`, and neither an `--allowedTools` glob nor a `permissions.allow` rule in `settings.json` lifts it, so an arm that writes planning docs cannot run under it at all.

The scoping a permission layer would supply comes from `write_scope` instead, asserted after the run rather than enforced during it. `write_scope` is a report, not a block. It names where a run reached after the fact, so a skill that writes somewhere it should not still wrote there. The manifest diff covers creates, modifications, and deletions, which is what makes it comparable to the permission check rather than a subset of it.

What `write_scope` cannot do is prevent the write, and it cannot see a write outside the sandbox tree at all. `run.sh` watches the toolkit roots separately and reports what it finds there as `escapes` rather than folding them into the scope, since a file the session put outside the tree is not in it to be asserted over. `.claude/context/scripts/eval.md` holds the underlying blind spot as one finding across both harnesses, since the eval fixture snapshot has the same shape.

### The checker and its verdicts

An assertion kind whose input the caller did not supply reports as unchecked rather than dropping out of the count. Omitting `--writes` would otherwise let write scope vanish silently from the cheap standalone path, which is the path most likely to be trusted. A verdict never reports `pass` having asserted nothing, since the declaration counts globs while the verdict counts writes and the two diverge at zero.

The checker is TypeScript while provisioning stays bash. The harness was closed as bash on the grounds that what remains is `git` and `gh` orchestration plus copying trees, which is true of provisioning and does not describe a component that parses a declaration, aggregates partial failures, and emits counts. Its stated failure mode is asserting nothing while reporting green, which is invisible at runtime, so it has to be the unit-testable part.

- A run reports pass, fail, or unchecked. Absence of a declaration is `unchecked` rather than a pass, since a scenario that asserts nothing cannot pass, and rather than a failure, since failing every undeclared arm would make the harness unusable while expectations roll out. Only a failure exits non-zero.
- `unchecked` keeps its name rather than becoming `unproven`. The state already existed when the reporting gap was scoped, and a second word for one state costs more than the clearer label gains.
- The per-arm verdict was never the coverage problem. A single arm reports `unchecked` honestly, but reading that number across the catalog meant running `find` by hand, so the rollout had no surface. `aitk sandbox coverage` is that surface, and it counts scenarios and arms separately because the two denominators disagree.
- `--strict` inverts the exit rule for a caller that has finished arming. It stays opt-in, since the default has to keep 48 undeclared scenarios runnable.

### What a sandbox is provisioned with

- Standards and gov rules provision through the real installer rather than a copy. Both copies reimplemented an installer's selection rules, and the standards one omitted the `index.md` a real install rebuilds while neither wrote the `.claude/aitk/config.json` stamp. A sandbox now carries what a target carries, which is what makes a rule change observable to a run.
- Seeds stay a raw copy. `aitk claude init` does more than drop files, and the scenarios depending on the current shape outnumber the drift the copy risks. Hooks ship inside the seed tree, so a hook change is already reachable by any scenario declaring `SANDBOX_INJECT_SEEDS`.

### Why the sandbox sits outside the repository

The two headless harnesses stay separate. `scripts/eval/run.sh` extracts its fixture to a `mktemp -d` carrying no seed, which is the opposite of the sandbox's need to look like a real installed project. Merging them would cost one of the two its defining property.

Location and inheritance are separable, which is what lets both harnesses sit outside the repository. The eval fixture is outside it and carries no seed. The sandbox is outside it and still carries its seed, its installed standards, and its gov rules, which is the whole of what makes it look like a real installed project. Reading the separation above as ruling out a directory rather than a merge is what left the sandbox inside the worktree while the escape it caused was recorded as unfixable.

### The sandbox path and its guard

The sandbox tree lives at `$XDG_STATE_HOME/aitk/sandbox-<run-id>`, defaulting to `~/.local/state/aitk/sandbox-<run-id>`, and `AITK_SANDBOX_DIR` overrides the whole path. Two definitions hold it, `resolve_sandbox_dir` in `scripts/lib/sandbox-path.sh` and `sandboxTree` in `src/commands/sandbox.ts`, and the exec boundary is why there are two rather than one.

### The per-run id

`<run-id>` comes from `mint_sandbox_run_id` and `mintSandboxRunId`, the twins' own twin functions. Each mints a short random suffix the first time a process asks for the default and holds it in `AITK_SANDBOX_RUN_ID` for the rest of that process, so a child inheriting the environment resolves the same tree its parent did rather than minting a second one.

`run.sh` mints once, before it provisions, which is what lets its own provisioning step and the `sandbox check` it runs afterward agree. `.claude/context/sandbox/running.md` carries the collision this replaced and what it costs a caller who resolves the tree standalone.

### The guard

Inside the worktree, the toolkit's own `CLAUDE.md` loaded through the ancestor chain of the session `run.sh` spawns, beside the seeded copy the scenario installed. Both carry the rule sending shared session scratch to the main worktree root and nothing decided which root won, so a skill's output landed in the toolkit on roughly one run in two.

`.gitignore` keeps its `.sandbox/` entry after the move. Nothing provisions there now, so the entry costs a line and covers a stray tree from an older checkout or a hand-set override.

`assert_sandbox_dir_safe` is the live guard. Provisioning runs `rm -rf` on the resolved path at three sites, so it tests an allowlist rather than a list of paths to refuse: the path normalizes first, collapsing repeated separators, folding `.` and `..` segments, and stripping trailing ones, then has to be a strict descendant of the home directory or the temp root.

A blocklist is right once and wrong as soon as a system directory goes unnamed, while the allowlist admits the default and every reasonable override and refuses `/`, `/usr`, `/etc`, `//`, `$HOME/../..`, and `$HOME` itself without naming any of them. The repository test is separate and runs both ways, since a path under the worktree restores the ancestor chain and a path above it is one `rm -rf` from deleting the repository.

The fold is lexical and the guard follows no symlink. It runs before provisioning creates the tree, which rules out `cd` with `pwd -P` and every other resolution needing the path to exist, so a `..` below a symlink resolves against the link's own path rather than its target. A `..` climbing past the root clamps to `/`, which the allowlist then refuses under the rule already covering every root path. Folding dot-dot is what the guard turns on: a string test against the path as written admits `$HOME/../../usr`, `$HOME/..`, `/tmp/../etc`, and a spelling resolving to the main worktree root.

### What counts as an assertion

A declaration that exists and declares no mechanical assertion fails. That is the silent-truncation failure `scripts/core/install-check.sh` documents in its own comment, where a domain with no assertion stays green while its output shrinks to nothing. Prose in `manual` does not count towards the total, or an arm could carry five lines a checker cannot read and still report green.

Three arms assert a standards citation through the filename their run produces. `claude/review`, `claude/ui-test`, and `claude/memory-review` each run against a target holding no standards folder, which is what every target holds now, so the plugin root is the only route to the slug transform.

Each stages a branch carrying a `/`, and the transform replacing it with `-` appears in no skill body, so the output filename is evidence the citation resolved rather than evidence about the skill. Each also asserts that `.claude/standards/skill.md` and `standards/skill.md` are both absent, which is what makes a later arm staging a copy of its own go red at the point it lands rather than quietly voiding the premise.

Five of those entries assert mechanically, two in `claude/review` and three in `claude/memory-review`. Each was verified against a real run's output rather than declared from the fixture, which is the standard an entry meets before it leaves `manual`.

`claude/ui-test`'s two stay `Semantic:` while the same escape is closed for them. A run can judge every staged change behavioral and write no checklist at all, which its skill body permits, so whether the file exists is the visual-versus-automatable judgment the arm's third entry already demotes. An entry whose blocker is fixed is not automatically an entry that can assert, and a run is what tells the two apart.

### Declarations that fail silently

`claude/ui-test` declared a write scope covering only half of what its skill body asks for. `node_modules/**` was there, but `bun.lock` and `test-results/**` were not, and no earlier run got far enough to execute the tests that produce them. The first run that did reported six violations against a correct run. A scope written from what a skill is expected to write drifts from what running it actually produces, so widen it from a measured write list.

A demoted assertion is never inverted into `absent`. Where a claim genuinely cannot be read, the filenames a wrong run would have chosen stay undeclared, because an `absent` entry would pass for the file being elsewhere rather than for the run being correct. That is the vacuous pass `manual` is excluded from the count to prevent, arriving through the back door. The rule outlived the escape that motivated it and holds for any claim over output the snapshot does not reach.

A bare key below a `[[content]]` header belongs to that table, not to the document. `claude/ui-test` shipped its `max_turns` and all five `manual` entries under its last content block, so the ceiling never asserted, the entries never reached the unchecked count, and `aitk sandbox coverage` read the arm as armed throughout. `contentArray` now throws on any key beside `path` and `pattern`, which is the only level that can see the difference.

An arm over a step that reports rather than writes needs `reply`, because every tree assertion it can make is a negative and a declaration of only negatives passes hardest on the skip it exists to detect. `claude:docs/anchor-sweep` pins a record that has to survive the run byte-identical, which a run where the step never fired satisfies perfectly. Two `reply` substrings are what separate the two. The same shape reaches any arm whose subject decides not to write.

### Naming and staging a scenario

A scenario file is named for the skill it drives, not for the domain the skill sits in. `scripts/sandbox/claude/memory-review.sh` drives `/aitk:claude-memory-review`, and had the two names diverged the `<category>/<rest>.sh` mapping rule would find nothing and the audit would report the skill unpaired. A skill that gets renamed takes its scenario file with it rather than gaining a second scenario beside it.

- A scenario whose expectation reads a slug checks out its branch explicitly. `git init` inherits the machine's `init.defaultBranch`, so an arm resting on the initial branch name passes or fails by local git config.
- Git history initializes fresh each run, and a `refs/sandbox/baseline` ref marks the post-setup state so `aitk sandbox reset` restores without provisioning again.

### The anchor remote and its credentials

The anchor URL is built once by `sandbox_anchor_url` in `lib/sandbox-git.sh` and reaches GitHub over HTTPS. Eleven call sites hardcoded an SSH URL before, so no anchor scenario could run on a machine carrying only `gh` credentials. `setup_ssh` went with them, since an agent cannot answer a passphrase prompt and nothing authenticates over SSH now.

The harness sets `credential.helper` to `!gh auth git-credential` on the sandbox repo rather than expecting the operator to run `gh auth setup-git`. `gh auth login` authenticates the CLI and leaves git without a credential, so an authenticated machine still failed at clone. Scoping the helper to the throwaway repo keeps the operator's global config unwritten and covers the pushes the agent makes itself once it is running inside the sandbox.

Setting that helper resets the list first, with an empty value ahead of the real one. `credential.helper` is multi-valued and git concatenates it across system, global, and local, trying each until one returns a credential. A plain set leaves an operator's own helper ahead of the harness's, so a `store` entry or a stale `gh auth setup-git` token answers first and gh never runs. The failure is a 403 on push, on exactly the machines this change exists to serve, and it is invisible on a machine carrying no global helper.

`GIT_TERMINAL_PROMPT=0` is exported by `manage-sandbox.sh` and again by `run.sh`. Git falls back to a terminal prompt when no helper supplies a credential, so an unauthenticated run would block on `/dev/tty` rather than fail, which breaks the rule that no command may require a TTY. `run.sh` needs its own export because the agent pushes from a session it spawns, which does not inherit the provisioning environment.

### Staging an anchor tree

`stage_anchor_tree` splits where an anchor scenario's tree comes from away from where its remote points. The tree is copied from `scripts/sandbox/fixtures/anchor/create/` through the same `create_from_fixtures` helper every other fixture uses, and the remote stays real because these nine push to it and drive `gh` against it. Cloning the anchor to obtain a starting tree was a file transfer wearing a git costume, since the old path deleted `.git` and re-initialized two lines later.

`require_sandbox_anchor_config` still runs from `stage_anchor_tree`, in the main shell before provisioning, because `sandbox_anchor_url` is called inside command substitutions where `log_error` exits only the subshell. Without the separate guard an empty `GITHUB_ORG` produced `git remote add origin ""`, which succeeds, leaving the run to fail later somewhere unrelated with exit code 0. The fixture needs no network, so the guard now fires for the remote each scenario configures rather than for the provisioning step itself.

Identity and remote setup collapse into `configure_sandbox_anchor_remote`, which the nine anchor scenarios call in place of three repeated lines. `configure_sandbox_git_identity` stays callable on its own, since a scenario that never reaches a remote must not acquire one as a side effect. The baseline push stays with each scenario rather than moving into the helper, because five of the nine push after staging their fixture and publishing the anchor content early would change what lands on `origin/main`.

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

- On Windows, back-to-back headless runs can briefly fail to wipe the sandbox tree with a busy-lock. Re-run or `aitk sandbox clean` first.
- An autonomous sonnet run costs roughly $0.10 to $0.60 and tracks the turn count, measured at $0.28 for 7 turns and $0.58 for 17 on 2026-08-13. Drive one skill on demand rather than sweeping the catalog.
- Skills whose body forbids probing project surfaces, such as `aitk-feedback-file`, have no fixture to anchor and stay out of scope.
- Anchor scenarios take their starting tree from a fixture, so provisioning does not depend on what the previous arm published to the remote. The force-pushes remain, so an assertion that reads `origin/main` rather than the working tree is still order-sensitive.

## Standing limits

Six things a run cannot reach. Each is a property of the harness rather than a gap to close per task, so a claim depending on one is hand-verified and should say so.

- Marketplace install behavior. `run.sh` points `--plugin-dir` at a worktree instead of installing the plugin, so anything whose behavior depends on a real install stays outside the harness.
- A mid-session rule change. Rules are discovered at session start and the harness spawns a fresh session per run, so this binds the session doing the editing rather than the run.
- Host-conditional behavior such as linked-worktree locks or remote-state failures. A standalone sandbox repo cannot reproduce the trigger.
- The standards fallback of a skill the branch changed. Both resolution routes can land on one file, and no assertion tells them apart.
- A write landing outside both the sandbox tree and the four watched scratch directories. `snapshot_tree` reads the sandbox, and `run.sh` watches `.claude/plans/`, `.claude/review/`, `.claude/memory/`, and `.claude/tasks/` under the toolkit roots for escapes.
- Git state. `snapshot_tree` excludes `.git`, and the seven declaration keys read paths, file content, the write list, the reply, and the turn count, so no key reaches a commit, a branch, or a rewritten history.

### Reading the last three

The fourth is a provisioning consequence rather than a harness defect. A shipped body cites `${CLAUDE_SKILL_DIR}/../../standards/<file>.md` and nothing else, and `${CLAUDE_SKILL_DIR}` expands to wherever the harness found the skill. Resolved through `--plugin-dir` that lands on `<root>/standards/`, a tree the sandbox does not carry, so an arm asserting the sandbox holds no standard still distinguishes the two. Resolved through injection the base is `<sandbox>/.claude/skills/<name>/`, so it lands on `<sandbox>/.claude/standards/`, which is a path inside the fixture and indistinguishable from one a project copy would answer from.

Since `inject_changed_skills` injects exactly the skills the branch changed, the skills most in need of the check are the ones injection disqualifies, so checking a fallback means leaving that skill's body alone on the branch. Closing it would mean changing what injection copies or what `--plugin-dir` points at, and both trade one unreachable case for another, so it is recorded rather than fixed.

The fifth is what remains once the sandbox sits outside the repository. With the toolkit off the spawned session's ancestor chain, a skill writing to shared session scratch lands inside the sandbox where the arm's `write_scope` asserts over it, and only a write reaching past both the tree and the four watched directories goes unseen. A session can still reach past all of that, to a home directory or a sibling worktree, and nothing reports it. The boundary is stated rather than universal because there is no viable universal one.

The sixth costs `git-stage` and `git-split` most, since rewriting commits and branches is the largest blast radius in the catalogue and a `reply` assertion over either covers what the skill said rather than what it did. Closing it means a new assertion kind rather than another declaration, so both skills stay `should-be-asserted` until one exists.

Escape detection assumes the toolkit's shared scratch is quiet while a run is in flight. It compares the four directories before and after and attributes any difference to the spawned session, which nothing in the manifest can distinguish from the operator's own editing. A launching session that edits those directories mid-run draws an escape naming its own file. Run the harness from a session that leaves them alone, or read a reported escape against what else was happening rather than as a verdict on the skill.
