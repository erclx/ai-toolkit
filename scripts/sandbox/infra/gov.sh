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
  mkdir -p sync/.cursor/rules
  mkdir -p build/.cursor/rules

  local src_rules="$PROJECT_ROOT/governance/rules"

  while IFS= read -r file; do
    local filename
    filename=$(basename "$file")
    cp "$file" "sync/.cursor/rules/$filename"
    echo "# stale" >>"sync/.cursor/rules/$filename"
  done < <(find "$src_rules" -type f -name "*.mdc" | sort | head -n 2)

  while IFS= read -r file; do
    local filename
    filename=$(basename "$file")
    cp "$file" "build/.cursor/rules/$filename"
  done < <(find "$src_rules" -type f -name "*.mdc" | sort)

  git add .
  git commit -m "chore(sandbox): scaffold gov test directories" --no-verify -q

  log_step "Governance sandbox"
  log_info "install/ — clean target, no rules present"
  log_info "sync/    — stale .cursor/rules/ present"
  log_info "build/   — full .cursor/rules/ present, generates .cursor/.tmp/rules.md"

  local scenario="${SANDBOX_SCENARIO:-}"
  if [ -n "$scenario" ]; then
    SELECTED_OPTION="$scenario"
  else
    select_option "Which scenario?" "install" "sync" "build"
  fi

  case "$SELECTED_OPTION" in
  "install")
    log_step "Running: aitk gov install"
    exec "$PROJECT_ROOT/scripts/gov/install.sh" base install/
    ;;
  "sync")
    log_step "Running: aitk gov sync"
    exec "$PROJECT_ROOT/scripts/gov/sync.sh" sync/
    ;;
  "build")
    log_step "Running: aitk gov build"
    exec "$PROJECT_ROOT/scripts/gov/build.sh" build/
    ;;
  esac
}
