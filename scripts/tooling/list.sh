#!/bin/bash
set -e
set -o pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="${PROJECT_ROOT:-$(dirname "$(dirname "$SCRIPT_DIR")")}"

source "$PROJECT_ROOT/scripts/lib/ui.sh"
source "$PROJECT_ROOT/scripts/lib/tooling.sh"

TOOLING_DIR="$PROJECT_ROOT/tooling"

show_help() {
  echo -e "${GREY}┌${NC}"
  echo -e "${GREY}├${NC} ${WHITE}Usage:${NC} aitk tooling list [options]"
  echo -e "${GREY}│${NC}"
  echo -e "${GREY}│${NC}  ${WHITE}Options:${NC}"
  echo -e "${GREY}│${NC}    --json       ${GREY}# Emit machine-readable JSON${NC}"
  echo -e "${GREY}│${NC}    -h, --help   ${GREY}# Show this help message${NC}"
  echo -e "${GREY}└${NC}"
  exit 0
}

read_stack_field() {
  local toml="$1"
  local field="$2"
  awk -v f="$field" '
    /^\[stack\]/ { in_stack = 1; next }
    in_stack && /^\[/ { exit }
    in_stack && match($0, "^" f "[[:space:]]*=") {
      val = substr($0, RLENGTH + 1)
      sub(/^[[:space:]]+/, "", val)
      sub(/^[\x27"]/, "", val)
      sub(/[\x27"]$/, "", val)
      print val
      exit
    }
  ' "$toml"
}

count_array_block() {
  local toml="$1"
  local section="$2"
  local key="$3"
  awk -v s="$section" -v k="$key" '
    $0 == "[" s "]" { in_section = 1; next }
    in_section && /^\[/ { exit }
    in_section && match($0, "^" k "[[:space:]]*=[[:space:]]*\\[") { in_array = 1; next }
    in_array && /\]/ { exit }
    in_array && /"[^"]+"/ { count++ }
    END { print count+0 }
  ' "$toml"
}

count_section_keys() {
  local toml="$1"
  local section="$2"
  awk -v s="$section" '
    $0 == "[" s "]" { in_section = 1; next }
    in_section && /^\[/ { exit }
    in_section && /^"[^"]+"[[:space:]]*=/ { count++ }
    END { print count+0 }
  ' "$toml"
}

list_stacks_text() {
  log_step "Stacks"
  local stack manifest name extends dev_deps scripts_count gitignore_count
  while IFS= read -r stack; do
    manifest="$TOOLING_DIR/$stack/manifest.toml"
    [ ! -f "$manifest" ] && continue
    name=$(read_stack_field "$manifest" "name")
    extends=$(read_stack_field "$manifest" "extends")
    dev_deps=$(count_array_block "$manifest" "dependencies.dev" "packages")
    scripts_count=$(count_section_keys "$manifest" "scripts")
    gitignore_count=$(count_section_keys "$manifest" "gitignore")
    if [ -n "$extends" ]; then
      log_info "$name (extends: $extends, ${dev_deps} dev deps, ${scripts_count} scripts, ${gitignore_count} gitignore groups)"
    else
      log_info "$name (${dev_deps} dev deps, ${scripts_count} scripts, ${gitignore_count} gitignore groups)"
    fi
  done < <(list_tooling_stacks)
}

list_stacks_json() {
  local first=1
  local stack manifest name extends dev_deps scripts_count gitignore_count extends_json
  printf '['
  while IFS= read -r stack; do
    manifest="$TOOLING_DIR/$stack/manifest.toml"
    [ ! -f "$manifest" ] && continue
    name=$(read_stack_field "$manifest" "name")
    extends=$(read_stack_field "$manifest" "extends")
    dev_deps=$(count_array_block "$manifest" "dependencies.dev" "packages")
    scripts_count=$(count_section_keys "$manifest" "scripts")
    gitignore_count=$(count_section_keys "$manifest" "gitignore")
    if [ -n "$extends" ]; then
      extends_json="\"$extends\""
    else
      extends_json="null"
    fi
    if [ "$first" -eq 0 ]; then
      printf ','
    fi
    printf '{"name":"%s","extends":%s,"devDeps":%s,"scripts":%s,"gitignoreGroups":%s}' \
      "$name" "$extends_json" "$dev_deps" "$scripts_count" "$gitignore_count"
    first=0
  done < <(list_tooling_stacks)
  printf ']'
}

main() {
  local json=0

  while [[ $# -gt 0 ]]; do
    case "$1" in
    -h | --help) show_help ;;
    --json)
      json=1
      shift
      ;;
    *) log_error "Unknown option: $1" ;;
    esac
  done

  if [ "$json" -eq 1 ]; then
    printf '{"stacks":'
    list_stacks_json
    printf '}\n'
    exit 0
  fi

  echo -e "${GREY}┌${NC}"
  echo -e "${GREY}│${NC} ${WHITE}aitk tooling list${NC}"
  trap close_timeline EXIT
  list_stacks_text
}

main "$@"
