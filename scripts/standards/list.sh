#!/usr/bin/env bash
set -e
set -o pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="${PROJECT_ROOT:-$(dirname "$(dirname "$SCRIPT_DIR")")}"

source "$PROJECT_ROOT/scripts/lib/ui.sh"
source "$PROJECT_ROOT/scripts/lib/frontmatter.sh"

STANDARDS_DIR="$PROJECT_ROOT/standards"

show_help() {
  echo -e "${GREY}┌${NC}"
  echo -e "${GREY}├${NC} ${WHITE}Usage:${NC} canon standards list [options]"
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

# Emits the paths a standard's `## Scope` statement declares, as a JSON array.
# The declaration is prose, so the contract is narrow on purpose: backticked
# paths in the first sentence of the statement, or `*` for an attribute standard,
# which names no path and says so in the same statement. An empty array means the
# statement did not parse, which consumers report rather than skip.
read_applies_to() {
  local file="$1"
  local scope first paths

  scope=$(awk '/^## Scope[[:space:]]*$/ {found = 1; next} found && NF {print; exit}' "$file")
  first="${scope%%. *}"
  paths=$(printf '%s' "$first" | grep -o '`[^`]*`' | tr -d '`' || true)

  if [ -z "$paths" ] && [[ "$scope" == *"attribute standard"* ]]; then
    paths="*"
  fi

  printf '%s\n' "$paths" | jq -Rnc '[inputs | select(length > 0)]'
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

# No `target` field. It named where a standard installed, and nothing installs
# one now, so every value it could carry is either a path only this repository
# has or a duplicate of what `canon standards <name>` reports. `content` already
# carries the document, which is what a consumer wanted the path for.
list_json() {
  local first=1
  local file name title applies_to
  printf '['
  while IFS= read -r file; do
    name=$(basename "$file" .md)
    [ "$name" = "index" ] && continue
    title=$(read_frontmatter_field "$file" "description")
    applies_to=$(read_applies_to "$file")
    if [ "$first" -eq 0 ]; then
      printf ','
    fi
    jq -nc \
      --arg name "$name" \
      --arg description "$title" \
      --argjson appliesTo "$applies_to" \
      --rawfile content "$file" \
      '{name: $name, description: $description, appliesTo: $appliesTo, content: $content}'
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
