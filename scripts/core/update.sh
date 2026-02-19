#!/bin/bash
set -e
set -o pipefail

GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
WHITE='\033[1;37m'
GREY='\033[0;90m'
NC='\033[0m'

log_info() { echo -e "${GREY}│${NC} ${GREEN}✓${NC} $1"; }
log_warn() { echo -e "${GREY}│${NC} ${YELLOW}!${NC} $1"; }
log_error() {
  echo -e "${GREY}│${NC} ${RED}✗${NC} $1"
  exit 1
}
log_step() { echo -e "${GREY}│${NC}\n${GREY}├${NC} ${WHITE}$1${NC}"; }

pipe_output() { while IFS= read -r line; do echo -e "${GREY}│${NC}  $line"; done; }

check_dependencies() {
  command -v bun >/dev/null 2>&1 || log_error "bun is not installed"
}

main() {
  SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

  check_dependencies

  echo -e "${GREY}┌${NC}"

  log_step "Interactive Dependency Update"
  echo -e "${GREY}│${NC}"
  bun update --interactive 2>&1 | pipe_output

  log_step "Verifying Project Health"
  if [ -f "$SCRIPT_DIR/verify.sh" ]; then
    "$SCRIPT_DIR/verify.sh" --nested
    log_info "All checks passed"
  else
    log_warn "Verification script not found, skipping."
  fi

  echo -e "${GREY}└${NC}\n"
  echo -e "${GREEN}✓ Update Complete.${NC}"
}

main "$@"
