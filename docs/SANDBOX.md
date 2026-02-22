# Sandbox System

## Overview

Sandboxes provision isolated project states for testing scripts, configs, and AI commands. Each sandbox defines a known starting state and clear instructions for what to run and what to expect.

## Structure

```
scripts/sandbox/
├── tooling/
│   ├── base.sh        ← tests base golden configs
│   ├── vite-react.sh  ← tests vite-react configs against anchor repo
│   └── sync.sh        ← tests gdev tooling sync against drifted project
├── infra/
│   ├── cursor.sh      ← Cursor IDE playground with full governance injected
│   └── gov-sync.sh    ← tests gdev gov sync against mock drifted project
├── git/
│   ├── commit.sh      ← staged changes scenario for testing /git:commit
│   ├── branch.sh      ← branch rename scenario for testing /git:branch
│   └── pr.sh          ← PR description scenario for testing /git:pr
├── dev/
│   ├── apply.sh       ← file changes scenario for testing /dev:apply
│   └── setup.sh       ← mixed-state project for testing /dev:setup
├── docs/
│   └── sync.sh        ← stale README and docs scenario for testing /docs:sync
└── release/
    └── changelog.sh   ← commit history scenario for testing /release:changelog
```

All sandboxes provision into `.sandbox/` at the repo root. Git history initializes fresh each run. A `sandbox-baseline` tag marks the post-setup state for `gdev reset`.

## Running

```bash
gdev          # interactive category + command picker
gdev reset    # restore sandbox to baseline
gdev clean    # wipe sandbox entirely
```

## Writing a Sandbox

Each sandbox is a `.sh` file with a `stage_setup` function:

```bash
stage_setup() {
  export GEMINI_SKIP_AUTO_COMMIT="true"  # when you need git control

  # scaffold scenario state
  # end with SCENARIO READY instructions
  log_step "SCENARIO READY: ..."
  log_info "Action:  what to run"
  log_info "Expect:  what should happen"
}
```

Declare `use_anchor()` to clone from an anchor repo instead of starting empty:

```bash
use_anchor() {
  export ANCHOR_REPO="vite-react-template"
}
```

`manage-test.sh` handles provisioning, asset injection, git setup, and baseline tagging. `stage_setup` sets up scenario-specific state only.
