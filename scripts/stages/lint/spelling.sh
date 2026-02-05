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
  log_step "Staging Brownfield Environment for Fixer"

  echo "We use pydantic for the. Also typooo." > README.md

  log_step "Installing CSpell"
  if command -v bun &> /dev/null; then
      bun add -d cspell > /dev/null 2>&1
  else
      npm install -D cspell > /dev/null 2>&1
  fi
  
  log_info "Environment staged: README.md has 3 unknown words (pydantic, scoutreport, typooo)"
}
