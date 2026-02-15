#!/bin/bash
set -e
set -o pipefail

GREEN='\033[0;32m'
RED='\033[0;31m'
WHITE='\033[1;37m'
GREY='\033[0;90m'
NC='\033[0m'

log_info() { echo -e "${GREY}│${NC} ${GREEN}✓${NC} $1"; }
log_step() { echo -e "${GREY}│${NC}\n${GREY}├${NC} ${WHITE}$1${NC}"; }
log_warn() { echo -e "${GREY}│${NC} ${YELLOW}!${NC} $1"; }

source "$PROJECT_ROOT/scripts/lib/inject.sh"

use_anchor() {
  export ANCHOR_REPO="vite-react-template"
}

stage_setup() {
  inject_governance
  inject_dependencies

  log_step "SCENARIO READY: CLI Automation Test"
  log_info "Context: Governance rules injected. React environment ready."
  log_info "Step 1:  gemini gov:prompt"
  log_info "Step 2:  gemini dev:apply-cli \"Create a shared StatusBadge component with success/warning/error variants using tailwind\""
  log_info "Expect:  Agent creates 'src/components/status-badge.tsx', runs lint/build, and reports success."
}
