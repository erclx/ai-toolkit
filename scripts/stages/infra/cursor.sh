#!/bin/bash
set -e
set -o pipefail

GREEN='\033[0;32m'
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

  log_step "SCENARIO READY: Cursor IDE Playground"
  log_info "Context: Full governance rules + docs injected"
  log_info "Action:  Open Cursor and try these prompts:"

  echo -e "${GREY}│${NC}"
  log_info "1. UI Test (Tailwind/React Rules):"
  echo -e "${GREY}│${NC}    \"Create a shared StatusBadge component in src/components/. It should accept a variant prop (success, warning, error) and children. Use the cn utility.\""

  echo -e "${GREY}│${NC}"
  log_info "2. Feature Test (Architecture Rules):"
  echo -e "${GREY}│${NC}    \"Create a UserGreeting feature in src/features/dashboard. Display time of day and use the StatusBadge to show 'Online'.\""

  echo -e "${GREY}│${NC}"
  log_info "3. Security Test (Zod/Env Rules):"
  echo -e "${GREY}│${NC}    \"Add VITE_MAINTENANCE_MODE to env config with Zod validation. Trigger a full-screen error if true.\""
}
