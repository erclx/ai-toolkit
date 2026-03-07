#!/bin/bash
set -e
set -o pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="${PROJECT_ROOT:-$(dirname "$(dirname "$SCRIPT_DIR")")}"

source "$PROJECT_ROOT/scripts/lib/ui.sh"

show_help() {
  echo -e "${GREY}┌${NC}"
  log_step "Governance sync usage"
  echo -e "${GREY}│${NC}  ${WHITE}Usage:${NC} aitk gov sync [target-path]"
  echo -e "${GREY}│${NC}"
  echo -e "${GREY}│${NC}  Syncs rules already installed in the target project."
  echo -e "${GREY}│${NC}  To add new rules, use 'aitk gov install' instead."
  echo -e "${GREY}│${NC}  To sync standards, use 'aitk standards sync' instead."
  echo -e "${GREY}│${NC}"
  echo -e "${GREY}│${NC}  ${WHITE}Arguments:${NC}"
  echo -e "${GREY}│${NC}    target-path      ${GREY}# Target directory (default: current directory)${NC}"
  echo -e "${GREY}│${NC}"
  echo -e "${GREY}│${NC}  ${WHITE}Options:${NC}"
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

collect_changes() {
  local target_dir="$1"
  local target_rules_dir="$target_dir/.cursor/rules"

  if [ ! -d "$target_rules_dir" ]; then
    log_warn "No .cursor/rules/ found in target. Run 'aitk gov install' first."
    echo "0"
    return
  fi

  local count=0

  while IFS= read -r dest_file; do
    local filename
    filename=$(basename "$dest_file")

    local src_file
    src_file=$(find "$PROJECT_ROOT/.cursor/rules" -type f -name "$filename" | head -n 1)

    if [ -z "$src_file" ]; then
      log_warn "$filename (not in toolkit source, skipping)"
      continue
    fi

    if ! diff -q "$src_file" "$dest_file" >/dev/null 2>&1; then
      log_warn ".cursor/rules/$filename"
      echo "$src_file|$dest_file" >>"$PENDING_FILE"
      echo "$src_file|$dest_file" >>"$DRIFTED_FILE"
      ((count++))
    else
      log_info ".cursor/rules/$filename"
    fi
  done < <(find "$target_rules_dir" -type f -name "*.mdc" | sort)

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
  log_step "Applying changes"
  while IFS= read -r entry; do
    local src="${entry%%|*}"
    local dest="${entry##*|}"
    mkdir -p "$(dirname "$dest")"
    cp "$src" "$dest"
    log_add "${dest#"$TARGET_PATH/"}"
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

  local TARGET_ABS
  TARGET_ABS=$(cd "$TARGET_PATH" && pwd)
  if [ "$TARGET_ABS" = "$PROJECT_ROOT" ]; then
    log_error "Cannot sync to ai-toolkit root. Files here are the source of truth."
  fi

  PENDING_FILE=$(mktemp)
  DRIFTED_FILE=$(mktemp)
  trap 'rm -f "$PENDING_FILE" "$DRIFTED_FILE"' EXIT

  log_step "Scanning rules"
  local count
  count=$(collect_changes "$TARGET_PATH")

  if [ "$count" -eq 0 ]; then
    echo -e "${GREY}└${NC}\n" >&2
    echo -e "${GREEN}✓ Everything up to date${NC}" >&2
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
      echo -e "${GREY}└${NC}" >&2
      exit 0
    }
    ;;
  "No")
    log_warn "Sync cancelled"
    echo -e "${GREY}└${NC}" >&2
    exit 0
    ;;
  esac

  apply_changes

  echo -e "${GREY}└${NC}\n" >&2
  echo -e "${GREEN}✓ Sync complete${NC} ${GREY}($count rules)${NC}" >&2
}

main "$@"
