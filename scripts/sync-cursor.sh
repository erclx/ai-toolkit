#!/bin/bash
set -e
set -o pipefail

GREEN='\033[0;32m'
RED='\033[0;31m'
WHITE='\033[1;37m'
GREY='\033[0;90m'
NC='\033[0m'

log_info() { echo -e "${GREY}│${NC} ${GREEN}✓${NC} $1"; }
log_error() { echo -e "${GREY}│${NC} ${RED}✗${NC} $1"; exit 1; }
log_step() { echo -e "${GREY}│${NC}\n${GREY}├${NC} ${WHITE}$1${NC}"; }

show_help() {
  echo -e "${GREY}┌${NC}"
  log_step "Script Usage"
  echo -e "${GREY}│${NC}  ${WHITE}Usage:${NC} ./sync-cursor.sh [options]"
  echo -e "${GREY}│${NC}"
  echo -e "${GREY}│${NC}  ${WHITE}Options:${NC}"
  echo -e "${GREY}│${NC}    -h, --help    ${GREY}# Show this help message${NC}"
  echo -e "${GREY}└${NC}"
  exit 0
}

main() {
  if [[ "$1" == "-h" || "$1" == "--help" ]]; then
    show_help
  fi

  local SCRIPT_DIR
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
  local PROJECT_ROOT
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
  local ASSETS_SOURCE="$PROJECT_ROOT/scripts/assets/cursor"
  local LOCAL_TARGET="$PROJECT_ROOT/.cursor"

echo -e "${GREY}┌${NC}"
  log_step "Mirroring Pattern"

  if [ ! -d "$ASSETS_SOURCE" ]; then
    log_error "Source directory missing: $ASSETS_SOURCE"
  fi

mkdir -p "$LOCAL_TARGET"
  cp -a "$ASSETS_SOURCE/." "$LOCAL_TARGET/"

  log_info "Mirror complete: scripts/assets/cursor -> .cursor"
  echo -e "${GREY}└${NC}\n"
echo -e "${GREEN}✓ Local environment synchronized${NC}"
}

main "$@"