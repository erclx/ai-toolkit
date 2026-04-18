#!/bin/bash
set -e
set -o pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="${PROJECT_ROOT:-$(dirname "$SCRIPT_DIR")}"

source "$PROJECT_ROOT/scripts/lib/ui.sh"
source "$PROJECT_ROOT/scripts/lib/index.sh"

STANDARDS_SOURCE="$PROJECT_ROOT/standards"

show_help() {
  echo -e "${GREY}┌${NC}"
  echo -e "${GREY}├${NC} ${WHITE}Usage:${NC} aitk standards [command] [target-path]"
  echo -e "${GREY}│${NC}"
  echo -e "${GREY}│${NC}  ${WHITE}Commands:${NC}"
  echo -e "${GREY}│${NC}    install   ${GREY}# Copy all standards into a project (overwrites)${NC}"
  echo -e "${GREY}│${NC}    sync      ${GREY}# Update standards already present in a project${NC}"
  echo -e "${GREY}│${NC}    list      ${GREY}# List available standards with descriptions${NC}"
  echo -e "${GREY}│${NC}"
  echo -e "${GREY}│${NC}  ${WHITE}Arguments:${NC}"
  echo -e "${GREY}│${NC}    target-path   Target directory (default: current directory)"
  echo -e "${GREY}│${NC}"
  echo -e "${GREY}│${NC}  ${WHITE}Options:${NC}"
  echo -e "${GREY}│${NC}    -h, --help    ${GREY}# Show this help message${NC}"
  echo -e "${GREY}│${NC}"
  echo -e "${GREY}│${NC}  ${WHITE}Examples:${NC}"
  echo -e "${GREY}│${NC}    aitk standards install ../my-app"
  echo -e "${GREY}│${NC}    aitk standards sync ../my-app"
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

cmd_install() {
  local target="${1:-.}"
  target=$(validate_target "$target")
  guard_root "$target"

  local dest_dir="${target%/}/standards"

  log_step "Scanning standards"

  local files=()
  while IFS= read -r file; do
    local filename
    filename=$(basename "$file")
    [ "$filename" = "index.md" ] && continue
    log_info "standards/$filename"
    files+=("$file")
  done < <(find "$STANDARDS_SOURCE" -type f -name "*.md" | sort)

  local count=${#files[@]}

  select_option "Install $count standards to $dest_dir?" "Yes" "No"

  if [ "$SELECTED_OPTION" = "No" ]; then
    log_warn "Cancelled"
    exit 0
  fi

  log_step "Installing standards"

  mkdir -p "$dest_dir"
  for file in "${files[@]}"; do
    local filename
    filename=$(basename "$file")
    cp "$file" "$dest_dir/$filename"
    log_add "standards/$filename"
  done

  cp "$STANDARDS_SOURCE/index.md" "$dest_dir/index.md"
  write_index "$dest_dir"
  log_add "standards/index.md"

  trap - EXIT
  echo -e "${GREY}└${NC}\n"
  echo -e "${GREEN}✓ Standards installed${NC} ${GREY}($count files)${NC}"
}

collect_sync_changes() {
  local target_dir="$1"
  local standards_target="$target_dir/standards"
  local count=0

  if [ ! -d "$standards_target" ]; then
    log_warn "No standards/ found in target. Run 'aitk standards install' first."
    echo "0"
    return
  fi

  while IFS= read -r dest_file; do
    local filename
    filename=$(basename "$dest_file")
    [ "$filename" = "index.md" ] && continue
    local src_file="$STANDARDS_SOURCE/$filename"

    if [ ! -f "$src_file" ]; then
      log_warn "$filename (not in toolkit source, skipping)"
      continue
    fi

    if ! diff -q "$src_file" "$dest_file" >/dev/null 2>&1; then
      log_warn "standards/$filename"
      echo "$src_file|$dest_file" >>"$PENDING_FILE"
      echo "$src_file|$dest_file" >>"$DRIFTED_FILE"
      count=$((count + 1))
    else
      log_info "standards/$filename"
    fi
  done < <(find "$standards_target" -type f -name "*.md" | sort)

  echo "$count"
}

cmd_sync() {
  local target="${1:-.}"
  target=$(validate_target "$target")
  guard_root "$target"

  PENDING_FILE=$(mktemp)
  DRIFTED_FILE=$(mktemp)
  trap 'rm -f "$PENDING_FILE" "$DRIFTED_FILE"; close_timeline' EXIT

  log_step "Scanning standards"
  local count
  count=$(collect_sync_changes "$target")

  if [ "$count" -eq 0 ]; then
    cp "$STANDARDS_SOURCE/index.md" "$target/standards/index.md"
    write_index "$target/standards"
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

  apply_changes "$target"
  cp "$STANDARDS_SOURCE/index.md" "$target/standards/index.md"
  write_index "$target/standards"
  log_add "standards/index.md"

  trap - EXIT
  echo -e "${GREY}└${NC}\n"
  echo -e "${GREEN}✓ Sync complete${NC} ${GREY}($count standards)${NC}"
}

main() {
  if [ "$1" = "-h" ] || [ "$1" = "--help" ]; then
    show_help
  fi

  open_timeline "aitk standards"
  trap close_timeline EXIT

  local command="$1"

  if [ -z "$command" ]; then
    select_option "Standards command?" "install" "sync" "list"
    command="$SELECTED_OPTION"
  else
    shift
  fi

  case "$command" in
  install)
    cmd_install "$@"
    ;;
  sync)
    cmd_sync "$@"
    ;;
  list)
    exec "$PROJECT_ROOT/scripts/standards/list.sh" "$@"
    ;;
  *)
    log_error "Unknown command: $command. Use 'install', 'sync', 'list', or --help."
    ;;
  esac
}

main "$@"
