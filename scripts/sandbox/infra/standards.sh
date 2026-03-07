#!/bin/bash
set -e
set -o pipefail

source "$PROJECT_ROOT/scripts/lib/inject.sh"

use_config() {
  export SANDBOX_SKIP_AUTO_COMMIT="true"
}

stage_setup() {
  mkdir -p install
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

  log_step "SCENARIO READY: Standards Commands"

  log_info "install/ — clean target, no standards present"
  echo -e "${GREY}│${NC}"
  log_info "Action:  cd install && aitk standards install"
  log_info "Expect:  standards/ created and populated"

  echo -e "${GREY}│${NC}"

  log_info "sync/ — stale standards/ present"
  echo -e "${GREY}│${NC}"
  log_info "Action:  cd sync && aitk standards sync"
  log_info "Expect:  Drift detected, changes proposed and applied"
}
