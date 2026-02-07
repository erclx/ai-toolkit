#!/bin/bash
set -e
set -o pipefail

GREEN='\033[0;32m'
RED='\033[0;31m'
WHITE='\033[1;37m'
GREY='\033[0;90m'
NC='\033[0m'

log_info()  { echo -e "${GREY}│${NC} ${GREEN}✓${NC} $1"; }
log_error() { echo -e "${GREY}│${NC} ${RED}✗${NC} $1"; exit 1; }
log_step()  { echo -e "${GREY}│${NC}\n${GREY}├${NC} ${WHITE}$1${NC}"; }
log_add()   { echo -e "${GREY}│${NC} ${GREEN}+${NC} $1"; }

check_dependencies() {
  if [ ! -f "scripts/compile-rules.sh" ] || [ ! -f "scripts/compile-docs.sh" ]; then
    log_error "Compiler scripts not found in scripts/"
  fi
}

main() {
  check_dependencies

  echo -e "${GREY}┌${NC}"
  log_step "Syncing Governance Layer"

  ./scripts/compile-rules.sh
  ./scripts/compile-docs.sh

  log_step "Staging Artifacts"

  if git add commands/gov/rules.toml; then
    log_add "commands/gov/rules.toml"
  else
    log_error "Failed to stage rules.toml"
  fi

  if git add commands/gov/docs.toml; then
    log_add "commands/gov/docs.toml"
  else
    log_error "Failed to stage docs.toml"
  fi

  echo -e "${GREY}└${NC}\n"
  echo -e "${GREEN}✓ Governance artifacts staged${NC}"
  echo -e "${GREY}  To finish: git add scripts/assets/ && git commit${NC}"
}

main "$@"