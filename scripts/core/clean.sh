#!/bin/bash
set -e
set -o pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="${PROJECT_ROOT:-$(cd "$SCRIPT_DIR/../.." && pwd)}"

source "$PROJECT_ROOT/scripts/lib/ui.sh"

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
