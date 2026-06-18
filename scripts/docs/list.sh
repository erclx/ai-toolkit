#!/usr/bin/env bash
set -e
set -o pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="${PROJECT_ROOT:-$(dirname "$(dirname "$SCRIPT_DIR")")}"

source "$PROJECT_ROOT/scripts/lib/ui.sh"
source "$PROJECT_ROOT/scripts/lib/index.sh"

DOCS_DIR="$PROJECT_ROOT/docs"
CONTEXT_DIR="$PROJECT_ROOT/.claude/context"

# Toolkit-internal context entries (former Infrastructure docs). Reachable by
# name via `aitk docs <topic>` but kept out of the downstream catalog.
INTERNAL_TOPICS=" ci development extensions sandbox "

show_help() {
  echo -e "${GREY}┌${NC}"
  echo -e "${GREY}├${NC} ${WHITE}Usage:${NC} aitk docs list [options]"
  echo -e "${GREY}│${NC}"
  echo -e "${GREY}│${NC}  ${WHITE}Options:${NC}"
  echo -e "${GREY}│${NC}    --json       ${GREY}# Emit machine-readable JSON${NC}"
  echo -e "${GREY}│${NC}    -h, --help   ${GREY}# Show this help message${NC}"
  echo -e "${GREY}└${NC}"
  exit 0
}

is_target_facing() {
  case "$1" in
  "Agent surface" | "Domain references") return 0 ;;
  *) return 1 ;;
  esac
}

is_internal_topic() {
  case "$INTERNAL_TOPICS" in
  *" $1 "*) return 0 ;;
  *) return 1 ;;
  esac
}

list_text() {
  local file name description category
  log_step "Docs"
  while IFS= read -r file; do
    name=$(basename "$file" .md)
    [ "$name" = "index" ] && continue
    category=$(read_frontmatter_field "$file" "category")
    is_target_facing "$category" || continue
    description=$(read_frontmatter_field "$file" "description")
    log_info "$name : $description"
  done < <(find "$DOCS_DIR" -maxdepth 1 -type f -name "*.md" | sort)

  log_step "Domain context"
  while IFS= read -r file; do
    name=$(basename "$file" .md)
    [ "$name" = "index" ] && continue
    is_internal_topic "$name" && continue
    description=$(read_frontmatter_field "$file" "description")
    log_info "$name : $description"
  done < <(find "$CONTEXT_DIR" -maxdepth 1 -type f -name "*.md" | sort)
}

emit_json_entry() {
  local name="$1" description="$2" category="$3" target="$4"
  [ "$JSON_FIRST" -eq 0 ] && printf ','
  jq -nc \
    --arg name "$name" \
    --arg description "$description" \
    --arg category "$category" \
    --arg target "$target" \
    '{name: $name, description: $description, category: $category, target: $target}'
  JSON_FIRST=0
}

list_json() {
  local file name description category
  JSON_FIRST=1
  printf '['
  while IFS= read -r file; do
    name=$(basename "$file" .md)
    [ "$name" = "index" ] && continue
    category=$(read_frontmatter_field "$file" "category")
    is_target_facing "$category" || continue
    description=$(read_frontmatter_field "$file" "description")
    emit_json_entry "$name" "$description" "$category" "docs/$(basename "$file")"
  done < <(find "$DOCS_DIR" -maxdepth 1 -type f -name "*.md" | sort)

  while IFS= read -r file; do
    name=$(basename "$file" .md)
    [ "$name" = "index" ] && continue
    is_internal_topic "$name" && continue
    description=$(read_frontmatter_field "$file" "description")
    emit_json_entry "$name" "$description" "" ".claude/context/$(basename "$file")"
  done < <(find "$CONTEXT_DIR" -maxdepth 1 -type f -name "*.md" | sort)
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
    printf '{"docs":'
    list_json
    printf '}\n'
    exit 0
  fi

  list_text
}

main "$@"
