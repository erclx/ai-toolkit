#!/usr/bin/env bash
set -e
set -o pipefail

use_config() {
  export SANDBOX_SKIP_AUTO_COMMIT="true"
}

stage_setup() {
  log_step "Snippets sandbox"
  log_info "create : runs against toolkit source directly"
  log_info "list   : read-only catalog dump, no target needed"

  select_or_route_scenario "Which scenario?" "create" "list"

  case "$SELECTED_OPTION" in
  "create")
    log_step "Running: aitk snippets create"
    exec "$PROJECT_ROOT/scripts/snippets/create.sh"
    ;;
  "list")
    log_step "Running: aitk snippets list"
    exec bun "$PROJECT_ROOT/src/cli.ts" snippets list
    ;;
  *)
    log_error "Unknown scenario: $SELECTED_OPTION"
    ;;
  esac
}
