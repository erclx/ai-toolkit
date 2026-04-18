#!/bin/bash
set -e
set -o pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="${PROJECT_ROOT:-$(dirname "$(dirname "$SCRIPT_DIR")")}"

source "$PROJECT_ROOT/scripts/lib/ui.sh"

SEEDS_DIR="$PROJECT_ROOT/tooling/claude/seeds"

show_help() {
  echo -e "${GREY}┌${NC}"
  echo -e "${GREY}├${NC} ${WHITE}Usage:${NC} aitk claude seeds list [options]"
  echo -e "${GREY}│${NC}"
  echo -e "${GREY}│${NC}  ${WHITE}Options:${NC}"
  echo -e "${GREY}│${NC}    --json       ${GREY}# Emit JSON with name, source, target, content${NC}"
  echo -e "${GREY}│${NC}    --names      ${GREY}# Only list target paths, one per line${NC}"
  echo -e "${GREY}│${NC}    -h, --help   ${GREY}# Show this help message${NC}"
  echo -e "${GREY}│${NC}"
  echo -e "${GREY}│${NC}  ${WHITE}Notes:${NC}"
  echo -e "${GREY}│${NC}    Lists toolkit seed docs as installed by ${WHITE}aitk claude init${NC}."
  echo -e "${GREY}│${NC}    JSON is intended for skills that audit drift in target projects."
  echo -e "${GREY}└${NC}"
  exit 0
}

list_seed_files() {
  local claude_md="$SEEDS_DIR/CLAUDE.md"
  [ -f "$claude_md" ] && echo "CLAUDE.md|$claude_md|CLAUDE.md"

  local file name
  while IFS= read -r file; do
    name=$(basename "$file")
    echo "$name|$file|.claude/$name"
  done < <(find "$SEEDS_DIR/.claude" -maxdepth 1 -type f | sort)
}

list_text() {
  log_step "Seed docs"
  local entry name source target rel_source
  while IFS= read -r entry; do
    name="${entry%%|*}"
    rest="${entry#*|}"
    source="${rest%%|*}"
    target="${rest##*|}"
    rel_source="${source#$PROJECT_ROOT/}"
    log_info "$target ${GREY}← $rel_source${NC}"
  done < <(list_seed_files)
}

list_json() {
  local first=1
  local entry name source target rel_source

  printf '['
  while IFS= read -r entry; do
    name="${entry%%|*}"
    rest="${entry#*|}"
    source="${rest%%|*}"
    target="${rest##*|}"
    rel_source="${source#$PROJECT_ROOT/}"

    [ "$first" -eq 0 ] && printf ','
    first=0

    jq -nc \
      --arg name "$name" \
      --arg source "$rel_source" \
      --arg target "$target" \
      --rawfile content "$source" \
      '{name: $name, source: $source, target: $target, content: $content}'
  done < <(list_seed_files)
  printf ']'
}

list_names() {
  local entry
  while IFS= read -r entry; do
    echo "${entry##*|}"
  done < <(list_seed_files)
}

main() {
  local mode="text"

  while [[ $# -gt 0 ]]; do
    case "$1" in
    -h | --help) show_help ;;
    --json)
      mode="json"
      shift
      ;;
    --names)
      mode="names"
      shift
      ;;
    *) log_error "Unknown option: $1" ;;
    esac
  done

  trap close_timeline EXIT

  case "$mode" in
  json)
    list_json
    printf '\n'
    ;;
  names)
    list_names
    ;;
  text)
    list_text
    ;;
  esac
}

main "$@"
