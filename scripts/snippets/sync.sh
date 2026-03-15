#!/bin/bash
set -e
set -o pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="${PROJECT_ROOT:-$(dirname "$(dirname "$SCRIPT_DIR")")}"

source "$PROJECT_ROOT/scripts/lib/ui.sh"
trap close_timeline EXIT

SNIPPETS_SOURCE="$PROJECT_ROOT/snippets"

show_help() {
  echo -e "${GREY}┌${NC}"
  echo -e "${GREY}├${NC} ${WHITE}Usage:${NC} aitk snippets sync [target-path]"
  echo -e "${GREY}│${NC}"
  echo -e "${GREY}│${NC}  Updates snippets already present in the target project."
  echo -e "${GREY}│${NC}  To add new snippets, use 'aitk snippets install' instead."
  echo -e "${GREY}│${NC}"
  echo -e "${GREY}│${NC}  ${WHITE}Arguments:${NC}"
  echo -e "${GREY}│${NC}    target-path   ${GREY}# Target directory (default: current directory)${NC}"
  echo -e "${GREY}│${NC}"
  echo -e "${GREY}│${NC}  ${WHITE}Options:${NC}"
  echo -e "${GREY}│${NC}    -h, --help    ${GREY}# Show this help message${NC}"
  echo -e "${GREY}└${NC}"
  exit 0
}

check_dependencies() {
  command -v diff >/dev/null 2>&1 || log_error "diff not installed"
  command -v find >/dev/null 2>&1 || log_error "find not installed"
}

validate_target() {
  local target="$1"
  [ -z "$target" ] && target="."
  if [ ! -d "$target" ]; then
    log_error "Target directory not found: $target"
  fi
  echo "$target"
}

collect_changes() {
  local target_dir="$1"
  local target_snippets_dir="$target_dir/snippets"

  if [ ! -d "$target_snippets_dir" ]; then
    log_warn "No snippets/ found in target. Run 'aitk snippets install' first."
    echo "0"
    return
  fi

  local count=0

  while IFS= read -r dest_file; do
    local filename
    filename=$(basename "$dest_file")
    local src_file="$SNIPPETS_SOURCE/$filename"

    if [ ! -f "$src_file" ]; then
      log_warn "$filename (not in toolkit source, skipping)"
      continue
    fi

    if ! diff -q "$src_file" "$dest_file" >/dev/null 2>&1; then
      log_warn "snippets/$filename"
      echo "$src_file|$dest_file" >>"$PENDING_FILE"
      echo "$src_file|$dest_file" >>"$DRIFTED_FILE"
      count=$((count + 1))
    else
      log_info "snippets/$filename"
    fi
  done < <(find "$target_snippets_dir" -type f -name "*.md" | sort)

  echo "$count"
}

open_diffs() {
  while IFS= read -r entry; do
    local src="${entry%%|*}"
    local dest="${entry##*|}"
    code --diff "$src" "$dest"
  done <"$DRIFTED_FILE"
}

apply_changes() {
  local target="$1"
  log_step "Applying changes"
  while IFS= read -r entry; do
    local src="${entry%%|*}"
    local dest="${entry##*|}"
    mkdir -p "$(dirname "$dest")"
    cp "$src" "$dest"
    log_add "${dest#"$target/"}"
  done <"$PENDING_FILE"
}

parse_args() {
  TARGET_PATH="."

  if [[ $# -gt 0 && "$1" != -* ]]; then
    TARGET_PATH="$1"
    shift
  fi

  while [[ $# -gt 0 ]]; do
    case $1 in
    -h | --help)
      show_help
      ;;
    *)
      shift
      ;;
    esac
  done
}

main() {
  parse_args "$@"
  check_dependencies

  TARGET_PATH=$(validate_target "$TARGET_PATH")

  local target_abs
  target_abs=$(cd "$TARGET_PATH" && pwd)
  if [ "$target_abs" = "$PROJECT_ROOT" ]; then
    log_error "Cannot sync to toolkit root. Files here are the source of truth."
  fi

  PENDING_FILE=$(mktemp)
  DRIFTED_FILE=$(mktemp)
  trap 'rm -f "$PENDING_FILE" "$DRIFTED_FILE"' EXIT

  log_step "Scanning snippets"
  local count
  count=$(collect_changes "$TARGET_PATH")

  if [ "$count" -eq 0 ]; then
    echo -e "${GREY}└${NC}\n"
    echo -e "${GREEN}✓ Everything up to date${NC}"
    exit 0
  fi

  local has_diffs=false
  [ -s "$DRIFTED_FILE" ] && has_diffs=true

  if [ "$has_diffs" = true ]; then
    select_option "Apply $count changes?" "Review diffs" "Apply all" "No"
  else
    select_option "Apply $count changes?" "Yes" "No"
  fi

  case "$SELECTED_OPTION" in
  "Review diffs")
    open_diffs
    select_option "Apply $count changes?" "Yes" "No"
    [ "$SELECTED_OPTION" == "No" ] && {
      log_warn "Sync cancelled"
      echo -e "${GREY}└${NC}"
      exit 0
    }
    ;;
  "No")
    log_warn "Sync cancelled"
    echo -e "${GREY}└${NC}"
    exit 0
    ;;
  esac

  apply_changes "$TARGET_PATH"

  trap - EXIT
  echo -e "${GREY}└${NC}\n"
  echo -e "${GREEN}✓ Sync complete${NC} ${GREY}($count snippets)${NC}"
}

main "$@"
