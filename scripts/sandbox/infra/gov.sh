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

  local src_rules="$PROJECT_ROOT/.cursor/rules"

  while IFS= read -r file; do
    local filename
    filename=$(basename "$file")
    cp "$file" "sync/.cursor/rules/$filename"
    echo "# stale" >>"sync/.cursor/rules/$filename"
  done < <(find "$src_rules" -type f -name "*.mdc" | sort | head -n 2)

  git add .
  git commit -m "chore(sandbox): scaffold gov test directories" --no-verify -q

  log_step "SCENARIO READY: Governance Commands"

  log_info "install/ — clean target, no rules present"
  echo -e "${GREY}│${NC}"
  log_info "Action:  cd install && aitk gov install [stack]"
  log_info "Expect:  .cursor/rules/ created and populated"

  echo -e "${GREY}│${NC}"

  log_info "sync/ — stale .cursor/rules/ present"
  echo -e "${GREY}│${NC}"
  log_info "Action:  cd sync && aitk gov sync"
  log_info "Expect:  Drift detected, changes proposed and applied"
}
