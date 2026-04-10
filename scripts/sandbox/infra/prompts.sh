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
  log_info "install/ — clean target, no prompts present"
  log_info "sync/    — stale prompts/ present"

  local scenario="${SANDBOX_SCENARIO:-}"
  if [ -n "$scenario" ]; then
    SELECTED_OPTION="$scenario"
  else
    select_option "Which scenario?" "install" "sync"
  fi

  case "$SELECTED_OPTION" in
  "install")
    log_step "Running: aitk prompts install"
    exec "$PROJECT_ROOT/scripts/prompts/install.sh" scripting install/
    ;;
  "sync")
    log_step "Running: aitk prompts sync"
    exec "$PROJECT_ROOT/scripts/prompts/sync.sh" sync/
    ;;
  esac
}
