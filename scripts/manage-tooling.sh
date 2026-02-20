#!/bin/bash
set -e
set -o pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="${PROJECT_ROOT:-$(dirname "$SCRIPT_DIR")}"

source "$PROJECT_ROOT/scripts/lib/ui.sh"
source "$PROJECT_ROOT/scripts/lib/inject.sh"

show_help() {
  echo -e "${GREY}┌${NC}"
  log_step "Tooling Usage"
  echo -e "${GREY}│${NC}  ${WHITE}Usage:${NC} gdev tooling [command] [stack] [target-path]"
  echo -e "${GREY}│${NC}"
  echo -e "${GREY}│${NC}  ${WHITE}Commands:${NC}"
  echo -e "${GREY}│${NC}    sync     ${GREY}# Sync configs, seeds, deps, and references (default)${NC}"
  echo -e "${GREY}│${NC}    ref      ${GREY}# Drop reference docs only, no config changes${NC}"
  echo -e "${GREY}│${NC}"
  echo -e "${GREY}│${NC}  ${WHITE}Arguments:${NC}"
  echo -e "${GREY}│${NC}    stack         Name of the tooling stack (e.g., base, vite-react)"
  echo -e "${GREY}│${NC}    target-path   Target directory (default: current directory)"
  echo -e "${GREY}│${NC}"
  echo -e "${GREY}│${NC}  ${WHITE}Options:${NC}"
  echo -e "${GREY}│${NC}    -h, --help    ${GREY}# Show this help message${NC}"
  echo -e "${GREY}│${NC}"
  echo -e "${GREY}│${NC}  ${WHITE}Examples:${NC}"
  echo -e "${GREY}│${NC}    gdev tooling base ."
  echo -e "${GREY}│${NC}    gdev tooling ref vite-react ../my-app"
  echo -e "${GREY}└${NC}"
  exit 0
}

select_stack() {
  local stacks=()
  if ls -d "$PROJECT_ROOT/tooling"/*/ >/dev/null 2>&1; then
    mapfile -t stacks < <(find "$PROJECT_ROOT/tooling" -mindepth 1 -maxdepth 1 -type d -exec basename {} \; | sort)
  fi

  if [ ${#stacks[@]} -eq 0 ]; then
    log_error "No tooling stacks found in $PROJECT_ROOT/tooling"
  fi

  select_option "Select tooling stack:" "${stacks[@]}"
  echo "$SELECTED_OPTION"
}

collect_stack_references() {
  local stack="$1"
  local target="$2"
  local -n _ref_update=$3
  local -n _ref_missing=$4

  local manifest="$PROJECT_ROOT/tooling/$stack/manifest.toml"
  local extends
  extends=$(grep '^extends' "$manifest" 2>/dev/null | cut -d'"' -f2)

  if [ -n "$extends" ]; then
    collect_stack_references "$extends" "$target" _ref_update _ref_missing
  fi

  local reference_file="$PROJECT_ROOT/tooling/$stack/reference.md"
  [ ! -f "$reference_file" ] && return

  local dest="$target/tooling/$stack.md"

  if [ ! -f "$dest" ]; then
    _ref_missing+=("tooling/$stack.md")
  elif ! diff -q "$reference_file" "$dest" >/dev/null 2>&1; then
    _ref_update+=("tooling/$stack.md")
  fi
}

collect_stack_configs() {
  local stack="$1"
  local target="$2"
  local -n _new=$3
  local -n _drifted=$4
  local -n _matching=$5

  local manifest="$PROJECT_ROOT/tooling/$stack/manifest.toml"
  local extends
  extends=$(grep '^extends' "$manifest" 2>/dev/null | cut -d'"' -f2)

  if [ -n "$extends" ]; then
    collect_stack_configs "$extends" "$target" _new _drifted _matching
  fi

  local configs_dir="$PROJECT_ROOT/tooling/$stack/configs"
  [ ! -d "$configs_dir" ] && return

  while IFS= read -r file; do
    local rel="${file#"$configs_dir"/}"
    local dest="$target/$rel"

    if [ ! -f "$dest" ]; then
      _new+=("$rel")
    elif diff -q "$file" "$dest" >/dev/null 2>&1; then
      _matching+=("$rel")
    else
      _drifted+=("$rel")
    fi
  done < <(find "$configs_dir" -type f | sort)
}

collect_stack_seeds() {
  local stack="$1"
  local target="$2"
  local -n _seeded=$3
  local -n _seed_missing=$4

  local manifest="$PROJECT_ROOT/tooling/$stack/manifest.toml"
  local extends
  extends=$(grep '^extends' "$manifest" 2>/dev/null | cut -d'"' -f2)

  if [ -n "$extends" ]; then
    collect_stack_seeds "$extends" "$target" _seeded _seed_missing
  fi

  local seeds_dir="$PROJECT_ROOT/tooling/$stack/seeds"
  [ ! -d "$seeds_dir" ] && return

  while IFS= read -r file; do
    local rel="${file#"$seeds_dir"/}"
    local dest="$target/$rel"

    if [ -f "$dest" ]; then
      _seeded+=("$rel")
    else
      _seed_missing+=("$rel")
    fi
  done < <(find "$seeds_dir" -type f | sort)
}

scan_configs() {
  local stack="$1"
  local target="$2"

  log_step "Scanning Configs"

  collect_stack_configs "$stack" "$target" NEW_FILES DRIFTED_FILES MATCHING_FILES

  for f in "${MATCHING_FILES[@]}"; do
    log_info "${GREY}Matching:  $f${NC}"
  done
  for f in "${DRIFTED_FILES[@]}"; do
    log_warn "Drifted:   $f"
  done
  for f in "${NEW_FILES[@]}"; do
    log_add "Missing:   $f"
  done

  CONFIG_CHANGES=$((${#NEW_FILES[@]} + ${#DRIFTED_FILES[@]}))

  log_step "Scanning Seeds"

  collect_stack_seeds "$stack" "$target" SEEDED_FILES SEED_MISSING_FILES

  for f in "${SEEDED_FILES[@]}"; do
    log_info "${GREY}Seeded:    $f${NC}"
  done
  for f in "${SEED_MISSING_FILES[@]}"; do
    log_add "Missing:   $f"
  done

  log_step "Scanning References"

  collect_stack_references "$stack" "$target" REF_UPDATE_FILES REF_MISSING_FILES

  for f in "${REF_UPDATE_FILES[@]}"; do
    log_warn "Outdated: $f"
  done
  for f in "${REF_MISSING_FILES[@]}"; do
    log_add "Missing:  $f"
  done

  REF_CHANGES=$((${#REF_UPDATE_FILES[@]} + ${#REF_MISSING_FILES[@]}))
  TOTAL_CHANGES=$((CONFIG_CHANGES + SEED_CHANGES + REF_CHANGES))
}

cmd_ref() {
  local stack="$1"
  local target="${2:-.}"

  if [ -z "$stack" ]; then
    stack=$(select_stack)
  fi

  if [ ! -d "$PROJECT_ROOT/tooling/$stack" ]; then
    log_error "Stack not found: $stack"
  fi

  local target_abs
  target_abs=$(cd "$target" && pwd)
  if [ "$target_abs" = "$PROJECT_ROOT" ]; then
    log_error "Cannot sync tooling to ai-toolkit root. Files here are the source of truth."
  fi

  log_step "Syncing References: $stack"
  inject_tooling_reference "$stack" "$target"
}

cmd_sync() {
  local stack="$1"
  local target="${2:-.}"

  if [ -z "$stack" ]; then
    stack=$(select_stack)
  fi

  if [ ! -d "$PROJECT_ROOT/tooling/$stack" ]; then
    log_error "Stack not found: $stack"
  fi

  local target_abs
  target_abs=$(cd "$target" && pwd)
  if [ "$target_abs" = "$PROJECT_ROOT" ]; then
    log_error "Cannot sync tooling to ai-toolkit root. Files here are the source of truth."
  fi

  NEW_FILES=()
  DRIFTED_FILES=()
  MATCHING_FILES=()
  SEEDED_FILES=()
  SEED_MISSING_FILES=()
  REF_UPDATE_FILES=()
  REF_MISSING_FILES=()
  CONFIG_CHANGES=0
  SEED_CHANGES=0
  REF_CHANGES=0
  TOTAL_CHANGES=0

  scan_configs "$stack" "$target"

  if [ "$TOTAL_CHANGES" -eq 0 ]; then
    echo -e "${GREY}└${NC}\n" >&2
    echo -e "${GREEN}✓ Everything up to date${NC}" >&2
    exit 0
  fi

  local summary=""
  [ "${#DRIFTED_FILES[@]}" -gt 0 ] && summary+="${#DRIFTED_FILES[@]} drifted"
  if [ "${#NEW_FILES[@]}" -gt 0 ]; then
    [ -n "$summary" ] && summary+=", "
    summary+="${#NEW_FILES[@]} missing"
  fi
  if [ "${#REF_UPDATE_FILES[@]}" -gt 0 ] || [ "${#REF_MISSING_FILES[@]}" -gt 0 ]; then
    [ -n "$summary" ] && summary+=", "
    summary+="${REF_CHANGES} references"
  fi

  select_option "Apply $TOTAL_CHANGES changes ($summary)?" "Yes" "No"

  if [ "$SELECTED_OPTION" == "No" ]; then
    log_warn "Sync cancelled"
    echo -e "${GREY}└${NC}" >&2
    exit 0
  fi

  if [ "$CONFIG_CHANGES" -gt 0 ]; then
    log_step "Applying Configs"
    inject_tooling_configs "$stack" "$target"
  fi

  if [ "$SEED_CHANGES" -gt 0 ]; then
    log_step "Applying Seeds"
    inject_tooling_seeds "$stack" "$target"
  fi

  if [ "$REF_CHANGES" -gt 0 ]; then
    log_step "Applying References"
    inject_tooling_reference "$stack" "$target"
  fi

  inject_tooling_manifest "$stack" "$target"
}

main() {
  if [ "$1" = "-h" ] || [ "$1" = "--help" ]; then
    show_help
  fi

  echo -e "${GREY}┌${NC}" >&2

  local command="$1"

  if [ -z "$command" ]; then
    select_option "Tooling command?" "sync" "ref"
    command="$SELECTED_OPTION"
  fi

  case "$command" in
  ref)
    shift 2>/dev/null || true
    cmd_ref "$@"
    echo -e "${GREY}└${NC}\n" >&2
    echo -e "${GREEN}✓ References synced${NC}" >&2
    ;;
  sync | "")
    shift 2>/dev/null || true
    cmd_sync "$@"
    echo -e "${GREY}└${NC}\n" >&2
    echo -e "${GREEN}✓ Tooling sync complete${NC}" >&2
    ;;
  *)
    cmd_sync "$@"
    echo -e "${GREY}└${NC}\n" >&2
    echo -e "${GREEN}✓ Tooling sync complete${NC}" >&2
    ;;
  esac
}

main "$@"
