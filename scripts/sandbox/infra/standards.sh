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
  mkdir -p sync/standards

  local src_standards="$PROJECT_ROOT/standards"

  while IFS= read -r file; do
    local filename
    filename=$(basename "$file")
    cp "$file" "sync/standards/$filename"
    echo "<!-- stale -->" >>"sync/standards/$filename"
  done < <(find "$src_standards" -type f -name "*.md" | sort | head -n 2)

  git add .
  git commit -m "chore(sandbox): scaffold standards test directories" --no-verify -q

  log_step "Standards sandbox"
  log_info "install/ — clean target, no standards present"
  log_info "sync/    — stale standards/ present"

  local scenario="${SANDBOX_SCENARIO:-}"
  if [ -n "$scenario" ]; then
    SELECTED_OPTION="$scenario"
  else
    select_option "Which scenario?" "install" "sync"
  fi

  case "$SELECTED_OPTION" in
  "install")
    log_step "Running: aitk standards install"
    exec "$PROJECT_ROOT/scripts/manage-standards.sh" install install/
    ;;
  "sync")
    log_step "Running: aitk standards sync"
    exec "$PROJECT_ROOT/scripts/manage-standards.sh" sync sync/
    ;;
  esac
}
