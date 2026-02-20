#!/bin/bash
set -e
set -o pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="${PROJECT_ROOT:-$(dirname "$SCRIPT_DIR")}"

source "$PROJECT_ROOT/scripts/lib/ui.sh"

show_help() {
  echo -e "${GREY}┌${NC}"
  log_step "Governance Sync Usage"
  echo -e "${GREY}│${NC}  ${WHITE}Usage:${NC} gdev sync [target-path]"
  echo -e "${GREY}│${NC}"
  echo -e "${GREY}│${NC}  ${WHITE}Arguments:${NC}"
  echo -e "${GREY}│${NC}    target-path      ${GREY}# Target directory (default: current directory)${NC}"
  echo -e "${GREY}│${NC}"
  echo -e "${GREY}│${NC}  ${WHITE}Options:${NC}"
  echo -e "${GREY}│${NC}    -h, --help       ${GREY}# Show this help message${NC}"
  echo -e "${GREY}└${NC}"
  exit 0
}

GOV_TARGETS=(
  "Rules:.cursor/rules:*.mdc:.cursor/rules"
  "Standards:standards:*.md:standards"
)

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
  local src_dir=$1
  local target_dir=$2
  local pattern=$3
  local dest_prefix=$4
  local count=0

  if [ ! -d "$src_dir" ]; then
    log_warn "Source directory not found: $src_dir"
    echo "0"
    return
  fi

  while IFS= read -r file; do
    local rel="${file#"$src_dir"/}"

    local dest
    if [ "$dest_prefix" = "." ]; then
      dest="$target_dir/$rel"
    else
      dest="$target_dir/$dest_prefix/$rel"
    fi

    if [ ! -f "$dest" ]; then
      if [ "$dest_prefix" = "." ]; then
        log_add "$rel"
      else
        log_add "$dest_prefix/$rel"
      fi
      echo "$file|$dest" >>"$PENDING_FILE"
      ((count++))
    elif ! diff -q "$file" "$dest" >/dev/null 2>&1; then
      if [ "$dest_prefix" = "." ]; then
        log_warn "Changed: $rel"
      else
        log_warn "Changed: $dest_prefix/$rel"
      fi
      echo "$file|$dest" >>"$PENDING_FILE"
      ((count++))
    fi
  done < <(find "$src_dir" -type f -name "$pattern")

  echo "$count"
}

apply_changes() {
  while IFS= read -r entry; do
    local src="${entry%%|*}"
    local dest="${entry##*|}"
    mkdir -p "$(dirname "$dest")"
    cp "$src" "$dest"
  done <"$PENDING_FILE"
}

resolve_scope() {
  SELECTED_TARGETS=()

  case "$SELECTED_OPTION" in
  "Rules + Standards")
    SELECTED_TARGETS=("${GOV_TARGETS[@]}")
    ;;
  "Rules only")
    SELECTED_TARGETS=("${GOV_TARGETS[0]}")
    ;;
  "Standards only")
    SELECTED_TARGETS=("${GOV_TARGETS[1]}")
    ;;
  esac
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

  echo -e "${GREY}┌${NC}" >&2
  TARGET_PATH=$(validate_target "$TARGET_PATH")

  local TARGET_ABS
  TARGET_ABS=$(cd "$TARGET_PATH" && pwd)
  if [ "$TARGET_ABS" = "$PROJECT_ROOT" ]; then
    log_error "Cannot sync to ai-toolkit root. Files here are the source of truth."
  fi

  local scope_options=("Rules + Standards" "Rules only" "Standards only")

  select_option "Sync scope?" "${scope_options[@]}"
  resolve_scope

  PENDING_FILE=$(mktemp)
  trap 'rm -f "$PENDING_FILE"' EXIT

  declare -A TARGET_COUNTS
  local total=0

  for target in "${SELECTED_TARGETS[@]}"; do
    IFS=':' read -r label src_rel pattern dest_prefix <<<"$target"

    log_step "Syncing $label"
    local count
    count=$(collect_changes "$PROJECT_ROOT/$src_rel" "$TARGET_PATH" "$pattern" "$dest_prefix")
    TARGET_COUNTS["$label"]=$count
    total=$((total + count))

    if [ "$count" -eq 0 ]; then
      log_info "$label up to date"
    fi
  done

  if [ "$total" -gt 0 ]; then
    select_option "Apply $total changes?" "Yes" "No"
    if [ "$SELECTED_OPTION" == "Yes" ]; then
      apply_changes

      local summary=""
      for target in "${SELECTED_TARGETS[@]}"; do
        IFS=':' read -r label _ _ _ <<<"$target"
        local c="${TARGET_COUNTS[$label]}"
        if [ "$c" -gt 0 ]; then
          [ -n "$summary" ] && summary+=", "
          summary+="$c $label"
        fi
      done

      echo -e "${GREY}└${NC}\n" >&2
      echo -e "${GREEN}✓ Sync complete${NC} ${GREY}($summary)${NC}" >&2
    else
      echo -e "${GREY}└${NC}\n" >&2
      echo -e "${YELLOW}● Sync cancelled${NC}" >&2
    fi
  else
    echo -e "${GREY}└${NC}\n" >&2
    echo -e "${GREEN}✓ Everything up to date${NC}" >&2
  fi
}

main "$@"
