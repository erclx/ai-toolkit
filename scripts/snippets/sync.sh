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

build_source_map() {
  SOURCE_MAP_KEYS=()
  SOURCE_MAP_VALS=()

  while IFS= read -r f; do
    local rel
    rel="${f#"$SNIPPETS_SOURCE/"}"
    SOURCE_MAP_KEYS+=("$rel")
    SOURCE_MAP_VALS+=("$f")
  done < <(find "$SNIPPETS_SOURCE" -type f -name "*.md" | sort)
}

lookup_source() {
  local rel="$1"
  for i in "${!SOURCE_MAP_KEYS[@]}"; do
    if [ "${SOURCE_MAP_KEYS[$i]}" = "$rel" ]; then
      echo "${SOURCE_MAP_VALS[$i]}"
      return
    fi
  done
  echo ""
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
    local rel src_file
    rel="${dest_file#"$target_snippets_dir/"}"
    src_file=$(lookup_source "$rel")

    if [ -z "$src_file" ] || [ ! -f "$src_file" ]; then
      log_warn "$rel (not in toolkit source, skipping)"
      continue
    fi

    if ! diff -q "$src_file" "$dest_file" >/dev/null 2>&1; then
      log_warn "snippets/$rel"
      echo "$src_file|$dest_file" >>"$PENDING_FILE"
      echo "$src_file|$dest_file" >>"$DRIFTED_FILE"
      count=$((count + 1))
    else
      log_info "snippets/$rel"
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
  build_source_map

  TARGET_PATH=$(validate_target "$TARGET_PATH")

  guard_root "$TARGET_PATH"

  PENDING_FILE=$(mktemp)
  DRIFTED_FILE=$(mktemp)
  trap 'rm -f "$PENDING_FILE" "$DRIFTED_FILE"; close_timeline' EXIT

  log_step "Scanning snippets"
  local count
  count=$(collect_changes "$TARGET_PATH")

  if [ "$count" -eq 0 ]; then
    trap - EXIT
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
      exit 0
    }
    ;;
  "No")
    log_warn "Sync cancelled"
    exit 0
    ;;
  esac

  apply_changes "$TARGET_PATH"

  trap - EXIT
  echo -e "${GREY}└${NC}\n"
  echo -e "${GREEN}✓ Sync complete${NC} ${GREY}($count snippets)${NC}"
}

main "$@"
