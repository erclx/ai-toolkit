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
  mkdir -p sync/snippets

  local src_snippets="$PROJECT_ROOT/snippets"

  while IFS= read -r file; do
    local rel parent
    rel="${file#"$src_snippets/"}"
    parent=$(dirname "sync/snippets/$rel")
    mkdir -p "$parent"
    cp "$file" "sync/snippets/$rel"
    echo "<!-- stale -->" >>"sync/snippets/$rel"
  done < <(find "$src_snippets" -type f -name "*.md" | sort | head -n 2)

  git add .
  git commit -m "chore(sandbox): scaffold snippets test directories" --no-verify -q

  log_step "Snippets sandbox"
  log_info "install/ — clean target, no snippets present"
  log_info "sync/    — stale snippets/ present"
  log_info "create   — runs against toolkit source directly"
  log_info "list     — read-only catalog dump, no target needed"

  local scenario="${SANDBOX_SCENARIO:-}"
  if [ -n "$scenario" ]; then
    SELECTED_OPTION="$scenario"
  else
    select_option "Which scenario?" "install" "sync" "create" "list"
  fi

  case "$SELECTED_OPTION" in
  "install")
    log_step "Running: aitk snippets install"
    exec "$PROJECT_ROOT/scripts/snippets/install.sh" base install/
    ;;
  "sync")
    log_step "Running: aitk snippets sync"
    exec "$PROJECT_ROOT/scripts/snippets/sync.sh" sync/
    ;;
  "create")
    log_step "Running: aitk snippets create"
    exec "$PROJECT_ROOT/scripts/snippets/create.sh"
    ;;
  "list")
    log_step "Running: aitk snippets list"
    exec "$PROJECT_ROOT/scripts/snippets/list.sh"
    ;;
  esac
}
