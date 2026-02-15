#!/bin/bash
set -e
set -o pipefail

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
WHITE='\033[1;37m'
GREY='\033[0;90m'
NC='\033[0m'

log_info()  { echo -e "${GREY}│${NC} ${GREEN}✓${NC} $1" >&2; }
log_warn()  { echo -e "${GREY}│${NC} ${YELLOW}!${NC} $1" >&2; }
log_error() { echo -e "${GREY}│${NC} ${RED}✗${NC} $1" >&2; exit 1; }
log_step()  { echo -e "${GREY}│${NC}\n${GREY}├${NC} ${WHITE}$1${NC}" >&2; }
log_add()   { echo -e "${GREY}│${NC} ${GREEN}+${NC} $1" >&2; }

confirm() {
  local prompt_text=$1
  echo -ne "${GREY}│${NC}\n${GREEN}◆${NC} ${prompt_text} [y/N] " >&2
  read -n 1 -r input
  if [[ "$input" =~ ^[Yy]$ ]]; then
    echo -e "\033[1A\r\033[K${GREY}◇${NC} ${prompt_text} ${WHITE}Yes${NC}" >&2
    return 0
  else
    echo -e "\033[1A\r\033[K${GREY}◇${NC} ${prompt_text} ${RED}Skipped${NC}" >&2
    return 1
  fi
}

show_help() {
  echo -e "${GREY}┌${NC}"
  log_step "Governance Sync Usage"
  echo -e "${GREY}│${NC}  ${WHITE}Usage:${NC} ./scripts/sync-gov.sh [target-path] [options]"
  echo -e "${GREY}│${NC}"
  echo -e "${GREY}│${NC}  ${WHITE}Arguments:${NC}"
  echo -e "${GREY}│${NC}    target-path      ${GREY}# Target directory (default: current directory)${NC}"
  echo -e "${GREY}│${NC}"
  echo -e "${GREY}│${NC}  ${WHITE}Options:${NC}"
  echo -e "${GREY}│${NC}    -f, --force      ${GREY}# Overwrite all without confirmation${NC}"
  echo -e "${GREY}│${NC}    -d, --dry-run    ${GREY}# Preview changes without applying${NC}"
  echo -e "${GREY}│${NC}    -h, --help       ${GREY}# Show this help message${NC}"
  echo -e "${GREY}└${NC}"
  exit 0
}

check_dependencies() {
  command -v diff >/dev/null 2>&1 || log_error "diff not installed"
  command -v find >/dev/null 2>&1 || log_error "find not installed"
}

validate_target() {
  local target=$1
  [ -z "$target" ] && target="."
  if [ ! -d "$target" ]; then
    log_error "Target directory not found: $target"
  fi
  echo "$target"
}

sync_file() {
  local src=$1
  local rel_path=$2
  local target_root=$3
  local force=$4
  local dry_run=$5
  local dest="$target_root/$rel_path"

  if [ ! -f "$dest" ]; then
    if [ "$dry_run" != "true" ]; then
    mkdir -p "$(dirname "$dest")"
    cp "$src" "$dest"
    fi
    log_add "$rel_path"
    return 0
  fi

  if diff -q "$src" "$dest" >/dev/null 2>&1; then
    return 1
  fi

  log_warn "Conflict detected: $rel_path"
  
  if [ "$force" == "true" ]; then
    if [ "$dry_run" != "true" ]; then
    cp "$src" "$dest"
    fi
    log_info "Overwritten (Force)"
    return 0
  else
    if command -v diff >/dev/null; then
      echo -e "${GREY}│${NC}" >&2
      diff --color=always -u "$dest" "$src" | head -n 5 | sed "s/^/${GREY}│${NC} /" >&2
    fi
    
    if confirm "Overwrite file?"; then
      if [ "$dry_run" != "true" ]; then
      cp "$src" "$dest"
      fi
      log_info "Overwritten"
      return 0
    else
      return 1
    fi
  fi
}

process_directory() {
  local src_dir=$1
  local target_dir=$2
  local force_flag=$3
  local pattern=$4
  local dest_prefix=$5
  local dry_run=$6
  local count=0

  if [ -d "$src_dir" ]; then
    while IFS= read -r file; do
      local rel="$(basename "$file")"
      if sync_file "$file" "$dest_prefix/$rel" "$target_dir" "$force_flag" "$dry_run"; then
        ((count++))
      fi
    done < <(find "$src_dir" -name "$pattern")
  else
    log_warn "Source directory not found: $src_dir"
  fi

  echo "$count"
}

parse_args() {
  TARGET_PATH="${1:-.}"
  FORCE_MODE="false"
  DRY_RUN_MODE="false"

  if [[ "$1" == "-h" || "$1" == "--help" ]]; then
    show_help
  fi

  [[ $# -gt 0 ]] && shift
  while [[ $# -gt 0 ]]; do
    case $1 in
      -f|--force)
        FORCE_MODE="true"
        shift
        ;;
      -d|--dry-run)
        DRY_RUN_MODE="true"
        shift
        ;;
      *)
        shift
        ;;
    esac
  done
}

main() {
  SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
  PROJECT_ROOT="${PROJECT_ROOT:-$(dirname "$SCRIPT_DIR")}"

  parse_args "$@"
  check_dependencies

  echo -e "${GREY}┌${NC}" >&2
  TARGET_PATH=$(validate_target "$TARGET_PATH")

  local gov_count=0
  local doc_count=0

  log_step "Syncing Governance Rules"
  gov_count=$(process_directory "$PROJECT_ROOT/scripts/assets/cursor/rules" "$TARGET_PATH" "$FORCE_MODE" "*.mdc" ".cursor/rules" "$DRY_RUN_MODE")

  if [ "$gov_count" -eq 0 ]; then
    log_info "All governance rules up to date"
  fi

  log_step "Syncing Documentation"
  doc_count=$(process_directory "$PROJECT_ROOT/scripts/assets/docs" "$TARGET_PATH" "$FORCE_MODE" "*.md" "docs" "$DRY_RUN_MODE")

  if [ "$doc_count" -eq 0 ]; then
    log_info "All documentation up to date"
  fi

  echo -e "${GREY}└${NC}\n" >&2

  if [ "$DRY_RUN_MODE" == "true" ]; then
    echo -e "${YELLOW}⚠ Dry run - no changes applied${NC}" >&2
  fi

  echo -e "${GREEN}✓ Sync complete${NC} ${GREY}($gov_count rules, $doc_count docs)${NC}" >&2
}

main "$@"
