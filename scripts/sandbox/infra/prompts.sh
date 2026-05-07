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
  mkdir -p sync/prompts

  local src_prompts="$PROJECT_ROOT/prompts"

  while IFS= read -r file; do
    local filename
    filename=$(basename "$file")
    cp "$file" "sync/prompts/$filename"
    echo "<!-- stale -->" >>"sync/prompts/$filename"
  done < <(find "$src_prompts" -type f -name "*.md" | sort | head -n 2)

  git add .
  git commit -m "chore(sandbox): scaffold prompts test directories" --no-verify -q

  log_step "Prompts sandbox"
  log_info "install/    : clean target, installs infra category"
  log_info "essentials/ : clean target, installs essentials preset"
  log_info "sync/       : stale prompts/ present"

  select_or_route_scenario "Which scenario?" "install" "essentials" "sync"

  case "$SELECTED_OPTION" in
  "install")
    log_step "Running: aitk prompts install infra"
    exec "$PROJECT_ROOT/scripts/prompts/install.sh" infra install/
    ;;
  "essentials")
    mkdir -p essentials
    log_step "Running: aitk prompts install essentials"
    exec "$PROJECT_ROOT/scripts/prompts/install.sh" essentials essentials/
    ;;
  "sync")
    log_step "Running: aitk prompts sync"
    exec "$PROJECT_ROOT/scripts/prompts/sync.sh" sync/
    ;;
  *)
    log_error "Unknown scenario: $SELECTED_OPTION"
    ;;
  esac
}
