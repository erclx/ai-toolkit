#!/usr/bin/env bash
set -e
set -o pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="${PROJECT_ROOT:-$(dirname "$SCRIPT_DIR")}"

source "$PROJECT_ROOT/scripts/lib/ui.sh"

show_help() {
  echo -e "${GREY}┌${NC}"
  echo -e "${GREY}├${NC} ${WHITE}Usage:${NC} aitk docs [command|topic]"
  echo -e "${GREY}│${NC}"
  echo -e "${GREY}│${NC}  ${WHITE}Commands:${NC}"
  echo -e "${GREY}│${NC}    list           ${GREY}# List target-facing docs with descriptions${NC}"
  echo -e "${GREY}│${NC}    <topic>        ${GREY}# Print a doc to stdout (any doc by exact name)${NC}"
  echo -e "${GREY}│${NC}"
  echo -e "${GREY}│${NC}  ${WHITE}Options:${NC}"
  echo -e "${GREY}│${NC}    --json         ${GREY}# Emit list as machine-readable JSON${NC}"
  echo -e "${GREY}│${NC}    -h, --help     ${GREY}# Show this help message${NC}"
  echo -e "${GREY}│${NC}"
  echo -e "${GREY}│${NC}  ${WHITE}Examples:${NC}"
  echo -e "${GREY}│${NC}    aitk docs list"
  echo -e "${GREY}│${NC}    aitk docs list --json"
  echo -e "${GREY}│${NC}    aitk docs agents"
  echo -e "${GREY}└${NC}"
  exit 0
}

main() {
  if [ "$1" = "-h" ] || [ "$1" = "--help" ]; then
    show_help
  fi

  open_timeline "aitk docs"
  trap close_timeline EXIT

  local command="$1"
  if [ -z "$command" ]; then
    command="list"
  else
    shift
  fi

  case "$command" in
  list)
    exec "$PROJECT_ROOT/scripts/docs/list.sh" "$@"
    ;;
  *)
    exec "$PROJECT_ROOT/scripts/docs/get.sh" "$command" "$@"
    ;;
  esac
}

main "$@"
