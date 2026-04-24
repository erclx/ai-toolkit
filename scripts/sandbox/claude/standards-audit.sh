#!/bin/bash
set -e
set -o pipefail

use_config() {
  export SANDBOX_SKIP_AUTO_COMMIT="true"
  export SANDBOX_INJECT_SEEDS="true"
  export SANDBOX_INJECT_STANDARDS="true"
}

stage_setup() {
  cat <<'EOF' >package.json
{
  "name": "sandbox-standards-audit",
  "version": "1.0.0",
  "private": true,
  "type": "module"
}
EOF

  cat <<'EOF' >README.md
# Sandbox project

A tiny reference project used to exercise the standards audit skill.

## Commands

- `bun run check`: lint and typecheck
EOF

  mkdir -p docs .claude/skills/example
  cat <<'EOF' >docs/overview.md
---
title: Overview
description: High-level project overview
---

# Overview

Short reference for how the pieces fit together.

## Structure

- Source lives under `src/`
- Docs live under `docs/`
EOF

  cat <<'EOF' >.claude/skills/example/SKILL.md
---
name: example
description: Do an example thing. Use when asked to "example".
---

# Example

## Step 1

Run the example command against the current file.
EOF

  git add . && git commit -m "docs(project): initial project scaffold" --no-verify -q

  git checkout -b feat/docs-pass -q

  cat <<'EOF' >docs/overview.md
---
title: Overview
description: High-level project overview
---

# Overview

Short reference for how the pieces fit together — the layout is simple.

## Structure

Here are the directories:

- Source lives under `src/`; tests sit alongside each module.
- Docs live under `docs/`.
- The `scripts/` folder holds helpers.
EOF

  cat <<'EOF' >.claude/skills/example/SKILL.md
---
name: example
description: Do an example thing. Use when asked to "example".
---

# Example

## Step 1

The skill provides a comprehensive way to handle example workflows — it offers flexibility across many different scenarios that you might encounter.

## Step 2

You should probably try to run the example command if you think it might help.
EOF

  git add . && git commit -m "docs(overview): expand structure section and skill body" --no-verify -q

  log_step "Scenario ready: standards audit with seeded violations"
  log_info "Context: feat/docs-pass branch, one commit ahead of main with markdown violations:"
  log_info "  1. docs/overview.md: em dash in prose"
  log_info "  2. docs/overview.md: 'Here are the X:' lead-in"
  log_info "  3. docs/overview.md: semicolon joining clauses in a bullet"
  log_info "  4. .claude/skills/example/SKILL.md: em dash and inflated prose ('comprehensive', 'offers')"
  log_info "  5. .claude/skills/example/SKILL.md: non-imperative hedging voice ('You should probably try')"
  log_info "Action:  /claude-standards-audit"
  log_info "Expect:  violations grouped by file with line references across docs/overview.md and SKILL.md"
}
