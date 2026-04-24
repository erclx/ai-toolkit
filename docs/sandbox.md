---
title: Sandbox
description: Sandbox scenarios for verifying domain flows
category: Infrastructure
---

# Sandbox system

## Overview

Sandboxes provision isolated project states for testing scripts, configs, and AI commands. Each sandbox defines a known starting state with clear instructions for what to run and what to expect.

## Structure

```plaintext
scripts/sandbox/
├── tooling/
│   ├── base.sh        ← tests base golden configs
│   ├── claude.sh      ← tests claude tooling stack configs against anchor repo
│   ├── gemini.sh      ← tests gemini settings.json config injection
│   └── upstream.sh    ← provisions raw upstream templates before golden configs are applied
├── infra/
│   ├── init.sh           ← scenarios for aitk init (default, with-flags)
│   ├── cursor.sh         ← Cursor IDE playground with full governance injected
│   ├── gov.sh            ← interactive tests for governance commands
│   ├── standards.sh      ← interactive tests for standards commands
│   ├── snippets.sh       ← interactive tests for snippets commands
│   ├── claude.sh         ← interactive tests for claude workflow commands
│   ├── tooling.sh        ← interactive tests for tooling commands
│   ├── antigravity.sh    ← interactive tests for antigravity install and sync
│   ├── wiki.sh           ← interactive tests for wiki commands
│   └── indexes.sh        ← scenarios for aitk indexes regen, including lint-staged auto-stage and --no-stage, plus a bootstrap seed for the indexes-install skill
├── git/
│   ├── commit.sh      ← staged changes scenario for testing /git:commit
│   ├── branch.sh      ← branch rename scenario for testing /git:branch
│   ├── pr.sh          ← PR description scenario for testing /git:pr
│   ├── stage.sh       ← staged changes scenario for testing /git:stage
│   ├── split.sh       ← scenarios for /git:split (independent, stacked)
│   └── ship.sh        ← scenarios for /git:ship (without-changelog, with-changelog)
├── claude/
│   ├── autoship.sh     ← approved plan on feature branch for testing /claude-autoship
│   ├── review.sh       ← branch with known bugs for testing /claude-review
│   ├── feature.sh      ← scenarios for /claude-feature (full, small)
│   ├── ux-audit.sh     ← UI project with seeded design drift for testing /claude-ux-audit
│   ├── docs.sh         ← stale planning docs after a session pivot for testing /claude-docs
│   ├── seed-sync.sh    ← drifted seeds for testing /claude-seed-sync
│   ├── standards-audit.sh ← markdown branch with seeded prose and skill violations for testing /claude-standards-audit
│   ├── init-project.sh ← scenarios for /toolkit:init-project (fresh, vite-react, astro)
│   ├── design-extract.sh ← tokenized notes app for testing /toolkit:claude-design-extract and aitk design render
│   ├── design-propose.sh ← greenfield project with personality paragraph for testing /toolkit:claude-design-propose
│   ├── experiment.sh     ← scenarios for /toolkit:experiment (fresh, collision)
│   ├── memory.sh         ← seeded .claude/memory/ mix for testing /toolkit:claude-memory-review
│   ├── verify-scaffold.sh ← scaffolded project scenarios for testing /toolkit:verify-scaffold (pass, fail)
│   └── worktree.sh       ← scenarios for /toolkit:claude-worktree (matched-plan, multi-plan, branch-only)
├── dev/
│   ├── apply.sh       ← file changes scenario for testing /dev:apply
│   ├── comment.sh     ← code comment scenario for testing /dev:comment
│   └── review.sh      ← scenarios for /dev:review (args, branch-diff)
├── docs/
│   └── sync.sh        ← scenarios for /docs:sync (feature, chore, noop)
└── release/
    └── changelog.sh   ← commit history scenario for testing /release:changelog
```

All sandboxes provision into `.sandbox/` at the repo root. Git history initializes fresh each run. A `refs/sandbox/baseline` ref marks the post-setup state for `aitk reset`.

## Running

```bash
aitk sandbox                        # interactive category + command picker
aitk sandbox infra:gov install      # run a specific scenario non-interactively
aitk sandbox reset                  # restore sandbox to baseline
aitk sandbox clean                  # wipe sandbox entirely
```

When a scenario argument is passed, `manage-sandbox.sh` sets `SANDBOX_SCENARIO` and `AITK_NON_INTERACTIVE=1` automatically. Multi-scenario scripts call `select_or_route_scenario` from `lib/ui.sh`, which reads `SANDBOX_SCENARIO` and skips the picker when set. Passing a scenario name that does not match any option aborts with an `Unknown scenario` error. Skip `create` scenarios. They require user input with no default and loop on empty input.

After provisioning, your terminal cwd may need a refresh. Add this to `.zshrc` or `.bashrc`:

```bash
aitk() {
  command aitk "$@"
  cd .
}
```

## Writing a sandbox

Each sandbox is a `.sh` file with two optional hook functions and a required `stage_setup` function.

### stage_setup

`stage_setup` sets up scenario-specific state. It runs inside `.sandbox/` after provisioning and asset injection are complete. Commit messages inside `stage_setup` must follow `standards/commit.md` conventions.

```bash
stage_setup() {
  # scaffold scenario state
  # end with scenario ready instructions
  log_step "Scenario ready: ..."
  log_info "Action:  what to run"
  log_info "Expect:  what should happen"
}
```

Multi-scenario files list options before calling `select_or_route_scenario`. Use `: ` as the separator between option name and description, per `standards/prose.md`. No em dashes. Pad option names so the `:` separators align vertically across the list.

```bash
log_info "install/ : clean target, no rules present"
log_info "sync/    : stale .cursor/rules/ present"
log_info "list     : read-only catalog dump, no target needed"
```

### use_config

`use_config` runs before provisioning. Declare it to set sandbox behavior flags.

```bash
use_config() {
  export SANDBOX_SKIP_AUTO_COMMIT="true"  # skip auto-commit after stage_setup
  export SANDBOX_INJECT_SEEDS="true"      # inject tooling/claude/seeds/ into sandbox root
  export SANDBOX_INJECT_STANDARDS="true"  # inject standards/ into sandbox
  export SANDBOX_INJECT_GOV="true"        # inject .cursor/rules/ into sandbox
  export SANDBOX_INJECT_CONTEXT="true"    # inject GEMINI.md into sandbox root
  export SANDBOX_INJECT_GEMINI="true"     # inject .gemini/settings.json into sandbox
}
```

By default, sandboxes are minimal: no seeds, no standards, no gov rules, no Gemini settings, and auto-commit is on. Declare only the flags you need.

`SANDBOX_INJECT_SEEDS` is a raw copy of `tooling/claude/seeds/.` into the sandbox root, not a run of `aitk claude init`. It drops `CLAUDE.md` and `.claude/*` seed files before `stage_setup` runs, so scenarios that write a scenario-specific `CLAUDE.md` will overlay the seed. Use the flag when the scenario models a project that has installed seeds. Use hand-rolled files when the scenario models a target project with its own `CLAUDE.md`.

Rule for `claude/` scenarios: default to `SANDBOX_INJECT_SEEDS="true"` so each scenario models a real post-`aitk init` project state. Two documented exceptions:

- `init-project.sh`: tests `aitk init` itself, so pre-injecting seeds would invalidate the test.
- `autoship.sh`: the anchor wipe in `stage_setup` runs after asset injection and would delete the seeded files.

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

The reset contract is the scenario's responsibility, not the framework's. Each scenario:

1. Closes any open PRs it will recreate (`gh pr close <branch> 2>/dev/null || true`)
2. Deletes any remote branches it will recreate (`git push origin --delete <branch> -q 2>/dev/null || true`)
3. Force-pushes a fresh main (`git push --force origin HEAD:main`)
4. Recreates branches and opens PRs

Wrap each cleanup call with `2>/dev/null || true` so a missing branch or PR from the prior run does not abort the scenario. The remote starts empty for every run.
