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
log_warn()  { echo -e "${GREY}│${NC} ${YELLOW}!${NC} $1"; }

ENGINE_SCRIPT="scripts/lib/compiler.sh"

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

  log_step "Syncing Documentation to Root"
  if [ -d "scripts/assets/docs" ]; then
    mkdir -p docs
    cp -r scripts/assets/docs/. docs/
    log_info "Synced scripts/assets/docs -> ./docs"
  else
    log_warn "Assets directory scripts/assets/docs not found"
  fi

  log_step "Staging & Committing Artifacts"

  git add commands/gov/rules.toml commands/gov/docs.toml docs/

  if git diff --cached --quiet; then
    log_info "No changes detected. Working tree clean."
  else
    git commit -m "chore(gov): update governance artifacts"
    log_add "Committed: chore(gov): update governance artifacts"
  fi

  echo -e "${GREY}└${NC}\n"
  echo -e "${GREEN}✓ Governance build complete${NC}"
}

main "$@"
