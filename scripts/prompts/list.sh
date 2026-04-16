#!/bin/bash
set -e
set -o pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="${PROJECT_ROOT:-$(dirname "$(dirname "$SCRIPT_DIR")")}"

source "$PROJECT_ROOT/scripts/lib/ui.sh"
source "$PROJECT_ROOT/scripts/lib/index.sh"

PROMPTS_DIR="$PROJECT_ROOT/prompts"

show_help() {
  echo -e "${GREY}┌${NC}"
  echo -e "${GREY}├${NC} ${WHITE}Usage:${NC} aitk prompts list [options]"
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
  log_step "Prompts"
  local file name description
  while IFS= read -r file; do
    name=$(basename "$file" .md)
    [ "$name" = "index" ] && continue
    description=$(read_frontmatter_field "$file" "description")
    log_info "$name — $description"
  done < <(find "$PROMPTS_DIR" -maxdepth 1 -type f -name "*.md" | sort)
}

list_json() {
  local first=1
  local file name description
  printf '['
  while IFS= read -r file; do
    name=$(basename "$file" .md)
    [ "$name" = "index" ] && continue
    description=$(read_frontmatter_field "$file" "description")
    if [ "$first" -eq 0 ]; then
      printf ','
    fi
    printf '{"name":"%s","description":"%s"}' "$name" "$(json_escape "$description")"
    first=0
  done < <(find "$PROMPTS_DIR" -maxdepth 1 -type f -name "*.md" | sort)
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
    printf '{"prompts":'
    list_json
    printf '}\n'
    exit 0
  fi

  echo -e "${GREY}┌${NC}"
  trap close_timeline EXIT
  list_text
}

main "$@"
