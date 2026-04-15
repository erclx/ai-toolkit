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
  log_info "sync   — syncs configs, seeds, deps, and gitignore for a stack"
  log_info "ref    — drops reference docs only"
  log_info "create — creates a new stack stub"
  log_info "list   — read-only catalog dump, no target needed"

  select_or_route_scenario "Which scenario?" "sync" "ref" "create" "list"

  case "$SELECTED_OPTION" in
  "sync")
    log_step "Running: aitk tooling sync"
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
