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
log_fail() { echo -e "${GREY}│${NC} ${RED}✗${NC} $1"; }

stage_setup() {
  log_step "Initializing Clean Sandbox"
  log_info "Ready for generation."
}

stage_verify() {
  local log_file=$1
  
  log_step "Verifying Bash Architect Output"

  if grep -q "#!/bin/bash" "$log_file" && grep -q "set -e" "$log_file"; then
     log_info "Safety: Shebang and strict mode detected."
  else
     log_fail "Safety: Missing standard boilerplate."
     return 1
  fi

  if grep -q "select_option" "$log_file" && grep -q "SELECTED_OPTION" "$log_file"; then
     log_info "Interactivity: Interactive menu logic correctly generated."
  else
     log_fail "Interactivity: select_option logic missing or incorrect."
     return 1
  fi
  
  if grep -q "│" "$log_file" && grep -q "┌" "$log_file" && grep -q "└" "$log_file"; then
     log_info "Visuals: Timeline boundaries verified."
  else
     log_fail "Visuals: Timeline symbols missing."
     return 1
  fi

  return 0
}