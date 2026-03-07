#!/bin/bash
set -e
set -o pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="${PROJECT_ROOT:-$(dirname "$SCRIPT_DIR")}"

source "$PROJECT_ROOT/scripts/lib/ui.sh"

show_help() {
  echo -e "${GREY}┌${NC}"
  log_step "Tooling Usage"
  echo -e "${GREY}│${NC}  ${WHITE}Usage:${NC} aitk tooling [command] [stack] [target-path]"
  echo -e "${GREY}│${NC}"
  echo -e "${GREY}│${NC}  ${WHITE}Commands:${NC}"
  echo -e "${GREY}│${NC}    sync       ${GREY}# Sync configs, seeds, deps, and references (default)${NC}"
  echo -e "${GREY}│${NC}    ref        ${GREY}# Drop reference docs only, no config changes${NC}"
  echo -e "${GREY}│${NC}    scaffold   ${GREY}# Scaffold a new stack with stub manifest and reference${NC}"
  echo -e "${GREY}│${NC}"
  echo -e "${GREY}│${NC}  ${WHITE}Arguments:${NC}"
  echo -e "${GREY}│${NC}    stack         Name of the tooling stack (e.g., base, vite-react)"
  echo -e "${GREY}│${NC}    target-path   Target directory (default: current directory)"
  echo -e "${GREY}│${NC}"
  echo -e "${GREY}│${NC}  ${WHITE}Options:${NC}"
  echo -e "${GREY}│${NC}    -h, --help    ${GREY}# Show this help message${NC}"
  echo -e "${GREY}│${NC}"
  echo -e "${GREY}│${NC}  ${WHITE}Examples:${NC}"
  echo -e "${GREY}│${NC}    aitk tooling base ."
  echo -e "${GREY}│${NC}    aitk tooling ref vite-react ../my-app"
  echo -e "${GREY}│${NC}    aitk tooling scaffold"
  echo -e "${GREY}└${NC}"
  exit 0
}

main() {
  if [ "$1" = "-h" ] || [ "$1" = "--help" ]; then
    show_help
  fi

  local command="$1"

  if [ -z "$command" ]; then
    select_option "Tooling command?" "sync" "ref" "scaffold"
    command="$SELECTED_OPTION"
  else
    shift
  fi

  case "$command" in
  sync)
    exec "$PROJECT_ROOT/scripts/tooling/sync.sh" "$@"
    ;;
  ref)
    exec "$PROJECT_ROOT/scripts/tooling/ref.sh" "$@"
    ;;
  scaffold)
    exec "$PROJECT_ROOT/scripts/tooling/scaffold.sh" "$@"
    ;;
  *)
    echo -e "${GREY}┌${NC}"
    log_error "Unknown command: $command. Use 'sync', 'ref', 'scaffold', or --help."
    ;;
  esac
}

main "$@"
