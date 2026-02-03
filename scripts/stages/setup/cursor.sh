#!/bin/bash
set -e
set -o pipefail

GREEN='\033[0;32m'
RED='\033[0;31m'
WHITE='\033[1;37m'
GREY='\033[0;90m'
NC='\033[0m'

log_info() { echo -e "${GREY}│${NC} ${GREEN}✓${NC} $1"; }
log_warn() { echo -e "${GREY}│${NC} ${YELLOW}!${NC} $1"; }
log_step() { echo -e "${GREY}│${NC}\n${GREY}├${NC} ${WHITE}$1${NC}"; }

use_anchor() {
  export ANCHOR_REPO="vite-react-template"
}

stage_setup() {
  log_step "Staging Governance Environment"

  local rules_source="$PROJECT_ROOT/scripts/assets/cursor/rules"
  local rules_target=".cursor/rules"

  if [ -d "$rules_source" ]; then
    mkdir -p "$rules_target"
    cp -r "$rules_source/." "$rules_target/"
    log_info "Governance rules injected from Source of Truth"
  else
    log_warn "Source rules not found at $rules_source. Skipping injection."
    log_info "Tip: Create a rule in scripts/assets/cursor/rules/ to test this stage."
  fi

  echo -e "${GREY}│${NC}"
  echo -e "${GREY}│${NC} ${WHITE}MANUAL VERIFICATION REQUIRED:${NC}"
  echo -e "${GREY}│${NC} 1. Open the sandbox: ${WHITE}cursor .sandbox${NC}"
  echo -e "${GREY}│${NC} 2. Open a file (e.g., src/App.tsx) and verify the rules are active."
  echo -e "${GREY}│${NC} 3. Check .sandbox/.cursor/rules to see the injected files."
  echo -e "${GREY}│${NC}"
  
  log_info "Scenario ready."
}