#!/bin/bash
set -e
set -o pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="${PROJECT_ROOT:-$(dirname "$SCRIPT_DIR")}"

source "$PROJECT_ROOT/scripts/lib/ui.sh"

show_help() {
  echo -e "${GREY}┌${NC}"
  echo -e "${GREY}├${NC} ${WHITE}Usage:${NC} aitk wiki [command] [target-path]"
  echo -e "${GREY}│${NC}"
  echo -e "${GREY}│${NC}  ${WHITE}Commands:${NC}"
  echo -e "${GREY}│${NC}    init      ${GREY}# Scaffold wiki/ folder with stub index.md${NC}"
  echo -e "${GREY}│${NC}"
  echo -e "${GREY}│${NC}  ${WHITE}Arguments:${NC}"
  echo -e "${GREY}│${NC}    target-path   Target directory (default: current directory)"
  echo -e "${GREY}│${NC}"
  echo -e "${GREY}│${NC}  ${WHITE}Options:${NC}"
  echo -e "${GREY}│${NC}    -h, --help    ${GREY}# Show this help message${NC}"
  echo -e "${GREY}│${NC}"
  echo -e "${GREY}│${NC}  ${WHITE}Examples:${NC}"
  echo -e "${GREY}│${NC}    aitk wiki init"
  echo -e "${GREY}│${NC}    aitk wiki init ../my-app"
  echo -e "${GREY}└${NC}"
  exit 0
}

main() {
  if [ "$1" = "-h" ] || [ "$1" = "--help" ]; then
    show_help
  fi

  echo -e "${GREY}┌${NC}"
  echo -e "${GREY}│${NC} ${WHITE}aitk wiki${NC}"
  trap close_timeline EXIT

  local command="$1"

  if [ -z "$command" ]; then
    select_option "Wiki command?" "init"
    command="$SELECTED_OPTION"
  else
    shift
  fi

  case "$command" in
  init)
    exec "$PROJECT_ROOT/scripts/wiki/init.sh" "$@"
    ;;
  *)
    log_error "Unknown command: $command. Use 'init'."
    ;;
  esac
}

main "$@"
