#!/bin/bash
set -e
set -o pipefail

source "$PROJECT_ROOT/scripts/lib/inject.sh"

use_config() {
  export SANDBOX_SKIP_AUTO_COMMIT="true"
}

stage_setup() {
  mkdir -p install
  touch install/.gitkeep
  mkdir -p sync/.agent/workflows

  local src_workflows="$PROJECT_ROOT/antigravity/workflows"

  while IFS= read -r file; do
    local filename
    filename=$(basename "$file")
    cp "$file" "sync/.agent/workflows/$filename"
    echo "<!-- stale -->" >>"sync/.agent/workflows/$filename"
  done < <(find "$src_workflows" -type f -name "*.md" | sort | head -n 2)

  git add .
  git commit -m "chore(sandbox): scaffold antigravity test directories" --no-verify -q

  log_step "Antigravity sandbox"
  log_info "install/ — clean target, no workflows present"
  log_info "sync/    — stale workflows/ present"

  select_or_route_scenario "Which scenario?" "install" "sync"

  case "$SELECTED_OPTION" in
  "install")
    log_step "Running: aitk antigravity install all"
    exec "$PROJECT_ROOT/scripts/manage-antigravity.sh" install all install/
    ;;
  "sync")
    log_step "Running: aitk antigravity sync"
    exec "$PROJECT_ROOT/scripts/manage-antigravity.sh" sync sync/
    ;;
  *)
    log_error "Unknown scenario: $SELECTED_OPTION"
    ;;
  esac
}
