#!/bin/bash
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
  log_info "roles       : installs role prompts (planner, implementer, reviewer)"
  log_info "roles-list  : lists role prompt sources as JSON"
  log_info "seeds-list  : lists seed doc sources as JSON"
  log_info "sync        : diffs managed files against source and applies updates"
  log_info "prompt      : generates master prompts from installed rules (requires roles)"
  log_info "setup       : installs user-level config to ~/.claude/"

  select_or_route_scenario "Which scenario?" "init" "roles" "roles-list" "seeds-list" "sync" "prompt" "setup"

  case "$SELECTED_OPTION" in
  "init")
    log_step "Running: aitk claude init"
    exec "$PROJECT_ROOT/scripts/manage-claude.sh" init .
    ;;
  "roles")
    log_step "Running: aitk claude init"
    "$PROJECT_ROOT/scripts/manage-claude.sh" init .
    log_step "Running: aitk claude roles"
    exec "$PROJECT_ROOT/scripts/manage-claude.sh" roles .
    ;;
  "roles-list")
    log_step "Running: aitk claude roles list --json"
    exec "$PROJECT_ROOT/scripts/manage-claude.sh" roles list --json
    ;;
  "seeds-list")
    log_step "Running: aitk claude seeds list --json"
    exec "$PROJECT_ROOT/scripts/manage-claude.sh" seeds list --json
    ;;
  "sync")
    log_step "Running: aitk claude sync"
    exec "$PROJECT_ROOT/scripts/manage-claude.sh" sync .
    ;;
  "prompt")
    log_step "Running: aitk claude init --roles"
    "$PROJECT_ROOT/scripts/manage-claude.sh" init --roles .
    log_step "Running: aitk claude prompt"
    exec "$PROJECT_ROOT/scripts/claude/prompt.sh"
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
