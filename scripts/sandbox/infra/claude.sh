#!/usr/bin/env bash
set -e
set -o pipefail

source "$PROJECT_ROOT/scripts/lib/inject.sh"

use_config() {
  export SANDBOX_SKIP_AUTO_COMMIT="true"
  export SANDBOX_INJECT_GOV="true"
}

stage_setup() {
  cat <<'EOF' >package.json
{
  "name": "sandbox-claude-infra",
  "version": "1.0.0",
  "private": true,
  "type": "module"
}
EOF

  git add .
  git commit -m "chore(sandbox): scaffold claude infra test directory" --no-verify -q

  log_step "Claude sandbox"
  log_info "init        : seeds .claude/ project docs"
  log_info "seeds-list  : lists seed doc sources as JSON"
  log_info "sync        : reconciles .gitignore against the claude manifest"
  log_info "setup       : installs user-level config to ~/.claude/"

  select_or_route_scenario "Which scenario?" "init" "seeds-list" "sync" "setup"

  case "$SELECTED_OPTION" in
  "init")
    log_step "Running: aitk claude init"
    exec "$PROJECT_ROOT/scripts/manage-claude.sh" init .
    ;;
  "seeds-list")
    log_step "Running: aitk claude seeds list --json"
    exec "$PROJECT_ROOT/scripts/manage-claude.sh" seeds list --json
    ;;
  "sync")
    log_step "Running: aitk claude sync"
    exec "$PROJECT_ROOT/scripts/manage-claude.sh" sync .
    ;;
  "setup")
    log_step "Running: aitk claude setup"
    exec "$PROJECT_ROOT/scripts/manage-claude.sh" setup
    ;;
  *)
    log_error "Unknown scenario: $SELECTED_OPTION"
    ;;
  esac
}
