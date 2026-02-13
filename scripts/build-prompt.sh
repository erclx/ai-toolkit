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

ENGINE_SCRIPT="scripts/build/compiler.sh"

check_dependencies() {
  if [ ! -f "$ENGINE_SCRIPT" ]; then
    log_error "Compiler engine not found at: $ENGINE_SCRIPT"
  fi
}

main() {
  check_dependencies

  echo -e "${GREY}┌${NC}"
  
  log_step "Building Prompt Command"
  "$ENGINE_SCRIPT" \
    "scripts/assets/cursor/rules" \
    "commands/gov" \
    "scripts/assets/templates/prompt.toml.template" \
    "commands/gov/prompt.toml" \
    "{{INJECT_RULES}}" \
    ".mdc"

  log_step "Staging Artifact"
  git add commands/gov/prompt.toml

  if git diff --cached --quiet; then
    log_info "No changes detected. Working tree clean."
  else
    git commit -m "chore(gov): update prompt command artifact"
    log_info "Committed: chore(gov): update prompt command artifact"
  fi

  echo -e "${GREY}└${NC}\n"
  echo -e "${GREEN}✓ Prompt build complete${NC}"
}

main "$@"