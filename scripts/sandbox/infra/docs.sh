#!/usr/bin/env bash
set -e
set -o pipefail

use_config() {
  export SANDBOX_SKIP_AUTO_COMMIT="true"
}

stage_setup() {
  log_step "Docs sandbox"
  log_info "list : target-facing catalog, Infrastructure filtered out"
  log_info "get  : print one doc to stdout by exact name"
  log_info "aitk docs reads the toolkit's own docs/, no target needed"

  select_or_route_scenario "Which scenario?" "list" "get"

  case "$SELECTED_OPTION" in
  "list")
    log_step "Running: aitk docs list"
    "$PROJECT_ROOT/scripts/docs/list.sh"
    log_step "Running: aitk docs list --json | jq '.docs[0] | keys'"
    "$PROJECT_ROOT/scripts/docs/list.sh" --json | jq '.docs[0] | keys'
    log_info "Expect keys: category, description, name, target"
    log_info "Expect no Infrastructure topics: ci, development, extensions, sandbox"
    ;;
  "get")
    log_step "Running: aitk docs agents | head -5"
    "$PROJECT_ROOT/scripts/docs/get.sh" agents | head -5
    log_info "Expect the agents doc body on stdout, frontmatter stripped"
    ;;
  *)
    log_error "Unknown scenario: $SELECTED_OPTION"
    ;;
  esac
}
