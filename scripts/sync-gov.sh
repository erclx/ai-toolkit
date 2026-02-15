#!/bin/bash
set -e
set -o pipefail

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
WHITE='\033[1;37m'
GREY='\033[0;90m'
NC='\033[0m'

log_info()  { echo -e "${GREY}│${NC} ${GREEN}✓${NC} $1"; }
log_warn()  { echo -e "${GREY}│${NC} ${YELLOW}!${NC} $1"; }
log_error() { echo -e "${GREY}│${NC} ${RED}✗${NC} $1"; exit 1; }
log_step()  { echo -e "${GREY}│${NC}\n${GREY}├${NC} ${WHITE}$1${NC}"; }
log_add()   { echo -e "${GREY}│${NC} ${GREEN}+${NC} $1"; }

confirm() {
  local prompt_text=$1
  echo -ne "${GREY}│${NC}\n${GREEN}◆${NC} ${prompt_text} [y/N] "
  read -n 1 -r input
  if [[ "$input" =~ ^[Yy]$ ]]; then
    echo -e "\033[1A\r\033[K${GREY}◇${NC} ${prompt_text} ${WHITE}Yes${NC}"
    return 0
  else
    echo -e "\033[1A\r\033[K${GREY}◇${NC} ${prompt_text} ${RED}Skipped${NC}"
    return 1
  fi
}

show_help() {
  echo -e "${GREY}┌${NC}"
  log_step "Governance Sync Usage"
  echo -e "${GREY}│${NC}  ${WHITE}Usage:${NC} ./scripts/sync-gov.sh <target-path> [options]"
  echo -e "${GREY}│${NC}"
  echo -e "${GREY}│${NC}  ${WHITE}Options:${NC}"
  echo -e "${GREY}│${NC}    -f, --force    ${GREY}# Overwrite all without confirmation${NC}"
  echo -e "${GREY}│${NC}    -h, --help     ${GREY}# Show this help message${NC}"
  echo -e "${GREY}└${NC}"
  exit 0
}

validate_target() {
  local target=$1
  if [ -z "$target" ]; then
    show_help
  fi
  if [ ! -d "$target" ]; then
    log_error "Target directory not found: $target"
  fi
}

sync_file() {
  local src=$1
  local rel_path=$2
  local target_root=$3
  local force=$4
  local dest="$target_root/$rel_path"

  if [ ! -f "$dest" ]; then
    mkdir -p "$(dirname "$dest")"
    cp "$src" "$dest"
    log_add "$rel_path"
    return
  fi

  if diff -q "$src" "$dest" >/dev/null 2>&1; then
    return
  fi

  log_warn "Conflict detected: $rel_path"
  
  if [ "$force" == "true" ]; then
    cp "$src" "$dest"
    log_info "Overwritten (Force)"
  else
    if command -v diff >/dev/null; then
      echo -e "${GREY}│${NC}"
      diff --color=always -u "$dest" "$src" | head -n 5 | sed "s/^/${GREY}│${NC} /"
    fi
    
    if confirm "Overwrite file?"; then
      cp "$src" "$dest"
      log_info "Overwritten"
    fi
  fi
}

process_directory() {
  local src_dir=$1
  local target_dir=$2
  local force_flag=$3
  local pattern=$4
  local dest_prefix=$5

  if [ -d "$src_dir" ]; then
    find "$src_dir" -name "$pattern" | while read -r file; do
      local rel="${file#$src_dir/}"
      sync_file "$file" "$dest_prefix/$rel" "$target_dir" "$force_flag"
    done
  else
    log_warn "Source directory not found: $src_dir"
  fi
}

main() {
  SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
  PROJECT_ROOT="${PROJECT_ROOT:-$(dirname "$SCRIPT_DIR")}"

  local target_path=$1
  local force_mode="false"

  if [[ "$1" == "-h" || "$1" == "--help" ]]; then
    show_help
  fi

  if [[ "$2" == "-f" || "$2" == "--force" ]]; then
    force_mode="true"
  fi

  echo -e "${GREY}┌${NC}"
  validate_target "$target_path"

  log_step "Syncing Governance Rules"
  process_directory "$PROJECT_ROOT/scripts/assets/cursor/rules" "$target_path" "$force_mode" "*.mdc" ".cursor/rules"

  log_step "Syncing Documentation"
  process_directory "$PROJECT_ROOT/scripts/assets/docs" "$target_path" "$force_mode" "*.md" "docs"

  echo -e "${GREY}└${NC}\n"
  echo -e "${GREEN}✓ Sync complete${NC}"
}

main "$@"
