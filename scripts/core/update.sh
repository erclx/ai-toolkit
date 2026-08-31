#!/usr/bin/env bash
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

  echo -e "${GREY}├${NC} ${WHITE}Interactive dependency update${NC}"
  echo -e "${GREY}│${NC}"
  bun update --interactive

  log_step "Verifying project health"
  if [ -f "$PROJECT_ROOT/src/cli.ts" ]; then
    bun "$PROJECT_ROOT/src/cli.ts" gate run --nested
    log_info "All checks passed"
  else
    log_warn "Verification entry point not found, skipping."
  fi

  echo -e "${GREY}└${NC}\n"
  echo -e "${GREEN}✓ Update complete${NC}"
}

main "$@"
