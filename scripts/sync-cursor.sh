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
log_file() { echo -e "${GREY}│${NC}   ${GREY}+${NC} $1"; }

PROJECT_ROOT=""
ASSETS_SOURCE=""
LOCAL_TARGET=""

setup_paths() {
  local script_dir
  script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
  PROJECT_ROOT="$(dirname "$script_dir")"
  ASSETS_SOURCE="$PROJECT_ROOT/scripts/assets/cursor"
  LOCAL_TARGET="$PROJECT_ROOT/.cursor"
}

validate_source() {
  if [ ! -d "$ASSETS_SOURCE" ]; then
    log_error "Source directory missing: $ASSETS_SOURCE"
  fi
}

mirror_assets() {
  log_step "Mirroring Pattern"
  
  mkdir -p "$LOCAL_TARGET"
  
  pushd "$ASSETS_SOURCE" > /dev/null
  find . -type f | sort | while read -r file; do
    local clean_file="${file#./}"
    mkdir -p "$LOCAL_TARGET/$(dirname "$clean_file")"
    cp "$clean_file" "$LOCAL_TARGET/$clean_file"
    log_file ".cursor/$clean_file"
  done
  popd > /dev/null
}

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

echo -e "${GREY}┌${NC}"
  
  setup_paths
  validate_source
  mirror_assets

  log_step "Sync Status"
  log_info "Mirror complete"
  
  echo -e "${GREY}└${NC}\n"
echo -e "${GREEN}✓ Local environment synchronized${NC}"
}

main "$@"