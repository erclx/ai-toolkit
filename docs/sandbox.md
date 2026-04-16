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
│   └── wiki.sh           ← interactive tests for wiki commands
├── git/
│   ├── commit.sh      ← staged changes scenario for testing /git:commit
│   ├── branch.sh      ← branch rename scenario for testing /git:branch
│   ├── pr.sh          ← PR description scenario for testing /git:pr
│   ├── stage.sh       ← staged changes scenario for testing /git:stage
│   ├── split.sh       ← scenarios for /git:split (independent, stacked)
│   └── ship.sh        ← scenarios for /git:ship (without-changelog, with-changelog)
├── claude/
│   ├── autoship.sh    ← approved plan on feature branch for testing /claude-autoship
│   ├── review.sh      ← branch with known bugs for testing /claude-review
│   ├── feature.sh     ← project with docs for testing /claude-feature
│   └── seed-sync.sh   ← drifted seeds for testing /claude-seed-sync
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

### use_config

`use_config` runs before provisioning. Declare it to set sandbox behavior flags.

```bash
use_config() {
  export SANDBOX_SKIP_AUTO_COMMIT="true"  # skip auto-commit after stage_setup
  export SANDBOX_INJECT_STANDARDS="true"  # inject standards/ into sandbox
  export SANDBOX_INJECT_GOV="true"        # inject .cursor/rules/ into sandbox
  export SANDBOX_INJECT_CONTEXT="true"    # inject GEMINI.md into sandbox root
  export SANDBOX_INJECT_GEMINI="true"     # inject .gemini/settings.json into sandbox
}
```

By default, sandboxes are minimal: no standards, no gov rules, no Gemini settings, and auto-commit is on. Declare only the flags you need.

### use_anchor

`use_anchor` clones a remote repo as the sandbox base instead of starting empty.

```bash
use_anchor() {
  export ANCHOR_REPO="vite-react-template"
}
```

`manage-sandbox.sh` handles provisioning, asset injection, git setup, and baseline tagging. The hook functions configure behavior before that pipeline runs.
