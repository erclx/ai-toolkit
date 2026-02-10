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

ENGINE_SCRIPT="scripts/build/compiler.sh"

check_dependencies() {
  if [ ! -f "$ENGINE_SCRIPT" ]; then
    log_error "Compiler engine not found at: $ENGINE_SCRIPT"
  fi
}

main() {
  check_dependencies

  echo -e "${GREY}┌${NC}"
  
  log_step "Building Governance Rules"
  "$ENGINE_SCRIPT" \
    "scripts/assets/cursor/rules" \
    ".cursor/rules" \
    "scripts/assets/templates/rules.toml.template" \
    "commands/gov/rules.toml" \
    "{{INJECT_ALL_RULES}}" \
    ".mdc"

  log_step "Building Project Documentation"
  "$ENGINE_SCRIPT" \
    "scripts/assets/docs" \
    "docs" \
    "scripts/assets/templates/docs.toml.template" \
    "commands/gov/docs.toml" \
    "{{INJECT_DOCS}}" \
    ".md"

  log_step "Staging Build Artifacts"

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
  echo -e "${GREEN}✓ Governance build complete${NC}"
  echo -e "${GREY}  Next: git add scripts/assets/ && git commit${NC}"
}

main "$@"