#!/bin/bash
set -e
set -o pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="${PROJECT_ROOT:-$(dirname "$(dirname "$SCRIPT_DIR")")}"

source "$PROJECT_ROOT/scripts/lib/ui.sh"
source "$PROJECT_ROOT/scripts/lib/gov.sh"
trap close_timeline EXIT

show_help() {
  echo -e "${GREY}┌${NC}"
  echo -e "${GREY}├${NC} ${WHITE}Usage:${NC} aitk gov sync [target-path]"
  echo -e "${GREY}│${NC}"
  echo -e "${GREY}│${NC}  Syncs rules already installed under .claude/rules/."
  echo -e "${GREY}│${NC}  Removes stale .claude/GOV.md (retired surface)."
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

find_source_rule() {
  local rule="$1"
  find "$PROJECT_ROOT/governance/rules" -type f -name "${rule}.mdc" | head -n 1
}

collect_claude_changes() {
  local target_dir="$1"
  local rules_dir="$target_dir/.claude/rules"
  [ ! -d "$rules_dir" ] && return 0

  while IFS= read -r dest_file; do
    local rule
    rule=$(basename "$dest_file" .md)

    local src_file
    src_file=$(find_source_rule "$rule")
    if [ -z "$src_file" ]; then
      log_warn ".claude/rules/${dest_file#"$rules_dir/"} (not in toolkit source, skipping)"
      continue
    fi

    local rel=".claude/rules/${dest_file#"$rules_dir/"}"
    if ! diff -q "$src_file" "$dest_file" >/dev/null 2>&1; then
      log_warn "$rel"
      echo "claude|$src_file|$dest_file" >>"$PENDING_FILE"
      echo "$src_file|$dest_file|$rel" >>"$DRIFTED_FILE"
    else
      log_info "$rel"
    fi
  done < <(find "$rules_dir" -type f -name "*.md" | sort)
}

collect_stale_gov() {
  local target_dir="$1"
  local gov_file="$target_dir/.claude/GOV.md"
  [ ! -f "$gov_file" ] && return 0

  log_warn ".claude/GOV.md (retired surface, scheduled for removal)"
  echo "delete|$gov_file|$gov_file" >>"$PENDING_FILE"
}

open_diffs() {
  while IFS= read -r entry; do
    local src="${entry%%|*}"
    local rest="${entry#*|}"
    local dest="${rest%%|*}"
    code --diff "$src" "$dest"
  done <"$DRIFTED_FILE"
}

apply_changes() {
  log_step "Applying changes"
  while IFS= read -r entry; do
    local kind="${entry%%|*}"
    local rest="${entry#*|}"
    local src="${rest%%|*}"
    local dest="${rest#*|}"

    local rel="${dest#"$TARGET_PATH/"}"
    case "$kind" in
    claude)
      mkdir -p "$(dirname "$dest")"
      cp "$src" "$dest"
      log_add "$rel"
      ;;
    delete)
      rm -f "$dest"
      log_warn "removed $rel"
      ;;
    esac
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

  guard_root "$TARGET_PATH"

  PENDING_FILE=$(mktemp)
  DRIFTED_FILE=$(mktemp)
  trap 'rm -f "$PENDING_FILE" "$DRIFTED_FILE"; close_timeline' EXIT

  if [ ! -d "$TARGET_PATH/.claude/rules" ] && [ ! -f "$TARGET_PATH/.claude/GOV.md" ]; then
    log_warn "No governance surfaces found in target. Run 'aitk gov install' first."
    exit 0
  fi

  log_step "Scanning rules"
  collect_claude_changes "$TARGET_PATH"
  collect_stale_gov "$TARGET_PATH"

  local count
  count=$(wc -l <"$PENDING_FILE" | tr -d ' ')

  if [ "$count" -eq 0 ]; then
    trap - EXIT
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
      exit 0
    }
    ;;
  "No")
    log_warn "Sync cancelled"
    exit 0
    ;;
  esac

  apply_changes

  trap - EXIT
  echo -e "${GREY}└${NC}\n" >&2
  echo -e "${GREEN}✓ Sync complete${NC} ${GREY}($count changes)${NC}" >&2
}

main "$@"
