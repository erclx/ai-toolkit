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
  local docs_source="$PROJECT_ROOT/scripts/assets/docs"
  local docs_target="docs"

  if [ -d "$rules_source" ]; then
    mkdir -p "$rules_target"
    cp -r "$rules_source/." "$rules_target/"
    log_info "Governance rules injected from Source of Truth"
  else
    log_warn "Source rules not found at $rules_source. Skipping injection."
  fi

  if [ -d "$docs_source" ]; then
    mkdir -p "$docs_target"
    cp -r "$docs_source/." "$docs_target/"
    log_info "Reference documentation injected from Source of Truth"
  else
    log_warn "Source docs not found at $docs_source. Skipping injection."
  fi

  echo -e "${GREY}│${NC}"
  echo -e "${GREY}│${NC} ${WHITE}MANUAL VERIFICATION REQUIRED:${NC}"
  echo -e "${GREY}│${NC} 1. Open the sandbox: ${WHITE}cursor .sandbox${NC}"
  echo -e "${GREY}│${NC} 2. Verify rules in ${WHITE}.cursor/rules/${NC}"
  echo -e "${GREY}│${NC} 3. Verify docs in ${WHITE}docs/${NC}"
  echo -e "${GREY}│${NC}"
  
  log_info "Scenario ready."
}