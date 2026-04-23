#!/bin/bash
set -e
set -o pipefail

source "$PROJECT_ROOT/scripts/lib/inject.sh"

use_config() {
  export SANDBOX_SKIP_AUTO_COMMIT="true"
}

stage_setup() {
  cat <<'EOF' >package.json
{
  "name": "sandbox-tooling-infra",
  "version": "1.0.0",
  "private": true,
  "type": "module"
}
EOF

  git add .
  git commit -m "chore(sandbox): scaffold tooling infra test directory" --no-verify -q

  log_step "Tooling sandbox"
  log_info "sync        : syncs configs, seeds, deps, gitignore, and reference docs for a stack"
  log_info "sync-drift  : sync with a pre-drifted markdown seed in place; seed must stay unchanged"
  log_info "ref         : drops reference docs only"
  log_info "create      : creates a new stack stub"
  log_info "list        : read-only catalog dump, no target needed"

  select_or_route_scenario "Which scenario?" "sync" "sync-drift" "ref" "create" "list"

  case "$SELECTED_OPTION" in
  "sync")
    log_step "Running: aitk tooling sync"
    exec "$PROJECT_ROOT/scripts/tooling/sync.sh" base .
    ;;
  "sync-drift")
    mkdir -p docs
    cat <<'EOF' >docs/development.md
---
title: Development (customized)
description: User-edited copy
---

# Development

Local dev workflow for this project.

## Setup

- Install dependencies with `bun install`.
EOF
    git add docs/development.md
    git commit -m "chore(sandbox): seed drifted docs/development.md" --no-verify -q

    log_step "Running: aitk tooling sync base"
    log_info "docs/development.md is pre-populated with a drifted copy."
    log_info "After sync, diff HEAD -- docs/development.md should be empty."
    exec "$PROJECT_ROOT/scripts/tooling/sync.sh" base .
    ;;
  "ref")
    log_step "Running: aitk tooling ref"
    exec "$PROJECT_ROOT/scripts/tooling/ref.sh" base .
    ;;
  "create")
    log_step "Running: aitk tooling create"
    exec "$PROJECT_ROOT/scripts/tooling/create.sh"
    ;;
  "list")
    log_step "Running: aitk tooling list"
    exec "$PROJECT_ROOT/scripts/tooling/list.sh"
    ;;
  *)
    log_error "Unknown scenario: $SELECTED_OPTION"
    ;;
  esac
}
