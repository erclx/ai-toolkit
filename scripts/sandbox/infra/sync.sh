#!/bin/bash
set -e
set -o pipefail

source "$PROJECT_ROOT/scripts/lib/inject.sh"

use_config() {
  export SANDBOX_SKIP_AUTO_COMMIT="true"
}

stage_setup() {
  mkdir -p sync/standards
  mkdir -p sync/.cursor/rules

  local src_standards="$PROJECT_ROOT/standards"
  local src_rules="$PROJECT_ROOT/.cursor/rules"

  while IFS= read -r file; do
    local filename
    filename=$(basename "$file")
    cp "$file" "sync/standards/$filename"
    echo "<!-- stale -->" >>"sync/standards/$filename"
  done < <(find "$src_standards" -type f -name "*.md" | sort | head -n 2)

  while IFS= read -r file; do
    local filename
    filename=$(basename "$file")
    cp "$file" "sync/.cursor/rules/$filename"
    echo "# stale" >>"sync/.cursor/rules/$filename"
  done < <(find "$src_rules" -type f -name "*.mdc" | sort | head -n 2)

  git add .
  git commit -m "chore(sandbox): scaffold sync test directory" --no-verify -q

  log_step "Sync sandbox"
  log_info "sync/ — stale standards/ and .cursor/rules/ present"

  log_step "Running: aitk sync"
  exec "$PROJECT_ROOT/scripts/manage-sync.sh" sync/
}
