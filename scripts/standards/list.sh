#!/bin/bash
set -e
set -o pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="${PROJECT_ROOT:-$(dirname "$(dirname "$SCRIPT_DIR")")}"

source "$PROJECT_ROOT/scripts/lib/ui.sh"

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

read_h1_title() {
  local file="$1"
  awk '
    /^# / {
      sub(/^# +/, "", $0)
      print $0
      exit
    }
  ' "$file"
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
    title=$(read_h1_title "$file")
    log_info "$name — $title"
  done < <(find "$STANDARDS_DIR" -maxdepth 1 -type f -name "*.md" | sort)
}

list_json() {
  local first=1
  local file name title
  printf '['
  while IFS= read -r file; do
    name=$(basename "$file" .md)
    [ "$name" = "index" ] && continue
    title=$(read_h1_title "$file")
    if [ "$first" -eq 0 ]; then
      printf ','
    fi
    printf '{"name":"%s","description":"%s"}' "$name" "$(json_escape "$title")"
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

  if [ "$json" -eq 1 ]; then
    printf '{"standards":'
    list_json
    printf '}\n'
    exit 0
  fi

  echo -e "${GREY}┌${NC}"
  trap close_timeline EXIT
  list_text
}

main "$@"
