#!/bin/bash
set -e
set -o pipefail

GREEN='\033[0;32m'
RED='\033[0;31m'
WHITE='\033[1;37m'
GREY='\033[0;90m'
NC='\033[0m'

log_step()  { echo -e "${GREY}│${NC}\n${GREY}├${NC} ${WHITE}$1${NC}"; }
log_error() { echo -e "${GREY}│${NC} ${RED}✗${NC} $1"; exit 1; }

  SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
ENGINE_SCRIPT="$SCRIPT_DIR/build/compiler.sh"

check_engine() {
  if [ ! -f "$ENGINE_SCRIPT" ]; then
    log_error "Compiler engine not found at: $ENGINE_SCRIPT"
  fi
}

main() {
  check_engine

  echo -e "${GREY}┌${NC}"
  log_step "Initializing Docs Compiler"

  "$ENGINE_SCRIPT" \
    "$PROJECT_ROOT/scripts/assets/docs" \
    "docs" \
    "$PROJECT_ROOT/scripts/assets/templates/docs.toml.template" \
    "$PROJECT_ROOT/commands/gov/docs.toml" \
    "{{INJECT_DOCS}}" \
    ".md"

  echo -e "${GREY}└${NC}\n"
  echo -e "${GREEN}✓ Docs build complete${NC}"
}

main "$@"