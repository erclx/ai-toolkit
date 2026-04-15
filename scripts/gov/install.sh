#!/bin/bash
set -e
set -o pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="${PROJECT_ROOT:-$(dirname "$(dirname "$SCRIPT_DIR")")}"

source "$PROJECT_ROOT/scripts/lib/ui.sh"
trap close_timeline EXIT

STACKS_DIR="$PROJECT_ROOT/governance/stacks"
RULES_SOURCE_DIR="$PROJECT_ROOT/governance/rules"

show_help() {
  echo -e "${GREY}┌${NC}"
  echo -e "${GREY}├${NC} ${WHITE}Usage:${NC} aitk gov install [stack] [--add rules] [target-path]"
  echo -e "${GREY}│${NC}"
  echo -e "${GREY}│${NC}  ${WHITE}Arguments:${NC}"
  echo -e "${GREY}│${NC}    stack         Name of the stack to install (e.g., base, node, react)"
  echo -e "${GREY}│${NC}    target-path   Target directory (default: current directory)"
  echo -e "${GREY}│${NC}"
  echo -e "${GREY}│${NC}  ${WHITE}Options:${NC}"
  echo -e "${GREY}│${NC}    --add rules   ${GREY}# Comma-separated rule names to layer on top of the stack${NC}"
  echo -e "${GREY}│${NC}    -h, --help    ${GREY}# Show this help message${NC}"
  echo -e "${GREY}│${NC}"
  echo -e "${GREY}│${NC}  ${WHITE}Examples:${NC}"
  echo -e "${GREY}│${NC}    aitk gov install react"
  echo -e "${GREY}│${NC}    aitk gov install node ../my-app"
  echo -e "${GREY}│${NC}    aitk gov install astro --add 200-react,260-shadcn ../my-app"
  echo -e "${GREY}└${NC}"
  exit 0
}

select_stack() {
  local stacks=()
  mapfile -t stacks < <(find "$STACKS_DIR" -maxdepth 1 -name "*.toml" -exec basename {} .toml \; | sort)

  if [ "${#stacks[@]}" -eq 0 ]; then
    log_error "No stacks found in governance/stacks/"
  fi

  select_option "Select stack to install:" "${stacks[@]}"
  echo "$SELECTED_OPTION"
}

resolve_rules() {
  local stack="$1"
  local -n _rules=$2

  resolve_chain() {
    local current="$1"
    local toml="$STACKS_DIR/$current.toml"

    if [ ! -f "$toml" ]; then
      log_error "Stack not found: $current"
    fi

    local extends
    extends=$(grep '^extends' "$toml" | cut -d'"' -f2)

    if [ -n "$extends" ]; then
      resolve_chain "$extends"
    fi

    local in_rules=0
    while IFS= read -r line; do
      if [[ "$line" =~ ^rules ]]; then
        in_rules=1
      fi

      if [ "$in_rules" -eq 1 ]; then
        while [[ "$line" =~ \"([^\"]+)\" ]]; do
          local rule="${BASH_REMATCH[1]}"
          line=$(echo "$line" | sed "s/\"${rule}\"//")
          local already=0
          for r in "${_rules[@]}"; do
            [ "$r" = "$rule" ] && already=1 && break
          done
          [ "$already" -eq 0 ] && _rules+=("$rule")
        done
        [[ "$line" =~ \] ]] && in_rules=0
      fi
    done <"$toml"
  }

  resolve_chain "$stack"
}

find_rule_file() {
  local rule="$1"
  find "$RULES_SOURCE_DIR" -type f -name "${rule}.mdc" | head -n 1
}

cmd_install() {
  local stack=""
  local target="."
  local add_rules=""
  local positional=()

  while [[ $# -gt 0 ]]; do
    case "$1" in
    --add)
      add_rules="$2"
      shift 2
      ;;
    --add=*)
      add_rules="${1#--add=}"
      shift
      ;;
    *)
      positional+=("$1")
      shift
      ;;
    esac
  done

  stack="${positional[0]:-}"
  target="${positional[1]:-.}"

  if [ -z "$stack" ]; then
    stack=$(select_stack)
  fi

  if [ ! -f "$STACKS_DIR/$stack.toml" ]; then
    log_error "Stack not found: $stack"
  fi

  local rules=()
  resolve_rules "$stack" rules

  if [ -n "$add_rules" ]; then
    local IFS_BACKUP="$IFS"
    IFS=',' read -ra extras <<<"$add_rules"
    IFS="$IFS_BACKUP"
    for extra in "${extras[@]}"; do
      extra="${extra# }"
      extra="${extra% }"
      [ -z "$extra" ] && continue
      local already=0
      for r in "${rules[@]}"; do
        [ "$r" = "$extra" ] && already=1 && break
      done
      [ "$already" -eq 0 ] && rules+=("$extra")
    done
  fi

  if [ "${#rules[@]}" -eq 0 ]; then
    log_warn "No rules defined for stack: $stack"
    exit 0
  fi

  if [ -n "$add_rules" ]; then
    log_step "Resolving stack: $stack + extras"
  else
    log_step "Resolving stack: $stack"
  fi

  local found=()
  local missing=()

  for rule in "${rules[@]}"; do
    local src
    src=$(find_rule_file "$rule")
    if [ -n "$src" ]; then
      found+=("$rule|$src")
    else
      missing+=("$rule")
    fi
  done

  for rule in "${missing[@]}"; do
    log_warn "$rule (source not found, skipping)"
  done

  for entry in "${found[@]}"; do
    local rule="${entry%%|*}"
    log_info "$rule"
  done

  local display_target
  display_target="${target%/}"
  display_target="${display_target#./}"
  local display_path
  if [ "$display_target" = "." ] || [ -z "$display_target" ]; then
    display_path=".cursor/rules"
  else
    display_path="$display_target/.cursor/rules"
  fi

  select_option "Install ${#found[@]} rules to $display_path?" "Yes" "No"

  if [ "$SELECTED_OPTION" = "No" ]; then
    log_warn "Cancelled"
    exit 0
  fi

  log_step "Installing rules"

  local dest_dir="$target/.cursor/rules"
  mkdir -p "$dest_dir"

  for entry in "${found[@]}"; do
    local rule="${entry%%|*}"
    local src="${entry##*|}"
    local filename
    filename=$(basename "$src")
    cp "$src" "$dest_dir/$filename"
    log_add ".cursor/rules/$filename"
  done
}

main() {
  if [ "$1" = "-h" ] || [ "$1" = "--help" ]; then
    show_help
  fi

  cmd_install "$@"

  trap - EXIT
  echo -e "${GREY}└${NC}\n"
  echo -e "${GREEN}✓ Rules installed${NC}"
}

main "$@"
