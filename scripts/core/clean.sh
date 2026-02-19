#!/bin/bash
set -e
set -o pipefail

GREEN='\033[0;32m'
RED='\033[0;31m'
WHITE='\033[1;37m'
GREY='\033[0;90m'
NC='\033[0m'

log_info() { echo -e "${GREY}│${NC} ${GREEN}✓${NC} $1"; }
log_error() {
  echo -e "${GREY}│${NC} ${RED}✗${NC} $1"
  exit 1
}
log_step() { echo -e "${GREY}│${NC}\n${GREY}├${NC} ${WHITE}$1${NC}"; }
log_rem() { echo -e "${GREY}│${NC} ${RED}-${NC} $1"; }

check_dependencies() {
  command -v bun >/dev/null 2>&1 || log_error "bun is not installed"
}

main() {
  check_dependencies

  echo -e "${GREY}┌${NC}"

  log_step "Cleaning Artifacts"
  rm -rf node_modules

  log_rem "node_modules/"

  log_step "Cleaning Cache"
  bun pm cache rm
  log_info "Package manager cache cleared"

  log_step "Rehydrating Project"
  bun install
  log_info "Dependencies installed"

  echo -e "${GREY}└${NC}\n"
  echo -e "${GREEN}✓ Success!${NC}"
}

main "$@"
