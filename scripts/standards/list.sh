#!/bin/bash
set -e
set -o pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="${PROJECT_ROOT:-$(dirname "$(dirname "$SCRIPT_DIR")")}"

source "$PROJECT_ROOT/scripts/lib/ui.sh"
source "$PROJECT_ROOT/scripts/lib/index.sh"

STANDARDS_DIR="$PROJECT_ROOT/standards"

show_help() {
  echo -e "${GREY}┌${NC}"
  echo -e "${GREY}├${NC} ${WHITE}Usage:${NC} aitk standards list [options]"
  echo -e "${GREY}│${NC}"
  echo -e "${GREY}│${NC}  ${WHITE}Options:${NC}"
  echo -e "${GREY}│${NC}    --json       ${GREY}# Emit machine-readable JSON${NC}"
  echo -e "${GREY}│${NC}    -h, --help   ${GREY}# Show this help message${NC}"
  echo -e "${GREY}└${NC}"
  exit 0
}

json_escape() {
  local s="$1"
  s="${s//\\/\\\\}"
  s="${s//\"/\\\"}"
  printf '%s' "$s"
}

list_text() {
  log_step "Standards"
  local file name title
  while IFS= read -r file; do
    name=$(basename "$file" .md)
    [ "$name" = "index" ] && continue
    title=$(read_frontmatter_field "$file" "description")
    log_info "$name : $title"
  done < <(find "$STANDARDS_DIR" -maxdepth 1 -type f -name "*.md" | sort)
}

list_json() {
  local first=1
  local file name title target
  printf '['
  while IFS= read -r file; do
    name=$(basename "$file" .md)
    [ "$name" = "index" ] && continue
    title=$(read_frontmatter_field "$file" "description")
    target="standards/$(basename "$file")"
    if [ "$first" -eq 0 ]; then
      printf ','
    fi
    jq -nc \
      --arg name "$name" \
      --arg description "$title" \
      --arg target "$target" \
      --rawfile content "$file" \
      '{name: $name, description: $description, target: $target, content: $content}'
    first=0
  done < <(find "$STANDARDS_DIR" -maxdepth 1 -type f -name "*.md" | sort)
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

  trap close_timeline EXIT

  if [ "$json" -eq 1 ]; then
    printf '{"standards":'
    list_json
    printf '}\n'
    exit 0
  fi

  list_text
}

main "$@"
