#!/bin/bash
set -e
set -o pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="${PROJECT_ROOT:-$(dirname "$SCRIPT_DIR")}"

source "$PROJECT_ROOT/scripts/lib/ui.sh"

STANDARDS_SOURCE="$PROJECT_ROOT/standards"

show_help() {
  echo -e "${GREY}┌${NC}"
  log_step "Standards"
  echo -e "${GREY}│${NC}  ${WHITE}Usage:${NC} gdev standards [command] [target-path]"
  echo -e "${GREY}│${NC}"
  echo -e "${GREY}│${NC}  ${WHITE}Commands:${NC}"
  echo -e "${GREY}│${NC}    sync      ${GREY}# Sync standards to another project${NC}"
  echo -e "${GREY}│${NC}"
  echo -e "${GREY}│${NC}  ${WHITE}Arguments:${NC}"
  echo -e "${GREY}│${NC}    target-path   Target directory (default: current directory)"
  echo -e "${GREY}│${NC}"
  echo -e "${GREY}│${NC}  ${WHITE}Options:${NC}"
  echo -e "${GREY}│${NC}    -h, --help    ${GREY}# Show this help message${NC}"
  echo -e "${GREY}└${NC}"
  exit 0
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
  local standards_target="$target_dir/standards"
  local count=0

  if [ ! -d "$standards_target" ]; then
    while IFS= read -r file; do
      local filename
      filename=$(basename "$file")
      log_add "standards/$filename"
      echo "$file|$standards_target/$filename" >>"$PENDING_FILE"
      ((count++))
    done < <(find "$STANDARDS_SOURCE" -type f -name "*.md" | sort)
    echo "$count"
    return
  fi

  while IFS= read -r src_file; do
    local filename
    filename=$(basename "$src_file")
    local dest_file="$standards_target/$filename"

    if [ ! -f "$dest_file" ]; then
      log_add "standards/$filename"
      echo "$src_file|$dest_file" >>"$PENDING_FILE"
      ((count++))
    elif ! diff -q "$src_file" "$dest_file" >/dev/null 2>&1; then
      log_warn "Changed: standards/$filename"
      echo "$src_file|$dest_file" >>"$PENDING_FILE"
      echo "$src_file|$dest_file" >>"$DRIFTED_FILE"
      ((count++))
    fi
  done < <(find "$STANDARDS_SOURCE" -type f -name "*.md" | sort)

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
  while IFS= read -r entry; do
    local src="${entry%%|*}"
    local dest="${entry##*|}"
    mkdir -p "$(dirname "$dest")"
    cp "$src" "$dest"
  done <"$PENDING_FILE"
}

cmd_sync() {
  local target="${1:-.}"

  target=$(validate_target "$target")

  local TARGET_ABS
  TARGET_ABS=$(cd "$target" && pwd)
  if [ "$TARGET_ABS" = "$PROJECT_ROOT" ]; then
    log_error "Cannot sync to ai-toolkit root. Files here are the source of truth."
  fi

  PENDING_FILE=$(mktemp)
  DRIFTED_FILE=$(mktemp)
  trap 'rm -f "$PENDING_FILE" "$DRIFTED_FILE"' EXIT

  log_step "Scanning Standards"
  local count
  count=$(collect_changes "$target")

  if [ "$count" -eq 0 ]; then
    log_info "Everything up to date"
    echo -e "${GREY}└${NC}\n"
    echo -e "${GREEN}✓ Standards up to date${NC}"
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

  apply_changes
}

main() {
  if [ "$1" = "-h" ] || [ "$1" = "--help" ]; then
    show_help
  fi

  echo -e "${GREY}┌${NC}"

  local command="${1:-sync}"

  if [ "$1" = "sync" ]; then
    shift
  fi

  case "$command" in
  sync)
    cmd_sync "$@"
    echo -e "${GREY}└${NC}\n"
    echo -e "${GREEN}✓ Standards synced${NC}"
    ;;
  *)
    log_error "Unknown command: $command. Use 'sync' or --help."
    ;;
  esac
}

main "$@"
