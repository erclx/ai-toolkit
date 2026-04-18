#!/bin/bash
set -e
set -o pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="${PROJECT_ROOT:-$(dirname "$SCRIPT_DIR")}"

source "$PROJECT_ROOT/scripts/lib/ui.sh"

show_help() {
  echo -e "${GREY}┌${NC}"
  echo -e "${GREY}├${NC} ${WHITE}Usage:${NC} aitk indexes [command] [options] [path...]"
  echo -e "${GREY}│${NC}"
  echo -e "${GREY}│${NC}  ${WHITE}Commands:${NC}"
  echo -e "${GREY}│${NC}    regen      ${GREY}# Regenerate index.md files from sibling frontmatter${NC}"
  echo -e "${GREY}│${NC}"
  echo -e "${GREY}│${NC}  ${WHITE}Options:${NC}"
  echo -e "${GREY}│${NC}    -h, --help    ${GREY}# Show this help message${NC}"
  echo -e "${GREY}│${NC}"
  echo -e "${GREY}│${NC}  ${WHITE}Examples:${NC}"
  echo -e "${GREY}│${NC}    aitk indexes regen"
  echo -e "${GREY}│${NC}    aitk indexes regen --dry-run"
  echo -e "${GREY}│${NC}    aitk indexes regen --json docs/"
  echo -e "${GREY}└${NC}"
  exit 0
}

main() {
  if [ "$1" = "-h" ] || [ "$1" = "--help" ]; then
    show_help
  fi

  local command="$1"

  if [ -z "$command" ]; then
    show_help
  fi
  shift

  open_timeline "aitk indexes"
  trap close_timeline EXIT

  case "$command" in
  regen)
    exec "$PROJECT_ROOT/scripts/indexes/regen.sh" "$@"
    ;;
  *)
    log_error "Unknown command: $command. Use 'regen'."
    ;;
  esac
}

main "$@"
