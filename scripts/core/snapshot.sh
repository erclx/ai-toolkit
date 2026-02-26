#!/bin/bash
set -e
set -o pipefail

GREEN='\033[0;32m'
RED='\033[0;31m'
WHITE='\033[1;37m'
GREY='\033[0;90m'
NC='\033[0m'

NESTED="${VERIFY_NESTED:-false}"

log_info() { echo -e "${GREY}│${NC} ${GREEN}✓${NC} $1"; }
log_error() {
  echo -e "${GREY}│${NC} ${RED}✗${NC} $1"
  exit 1
}
log_step() { echo -e "${GREY}│${NC}\n${GREY}├${NC} ${WHITE}$1${NC}"; }

OUTPUT_FILE=".claude/PROJECT.md"

check_dependencies() {
  command -v find >/dev/null 2>&1 || log_error "find not installed"
}

load_gitignore_patterns() {
  if [ ! -f ".gitignore" ]; then
    echo ""
    return
  fi
  grep -v '^\s*#' .gitignore | grep -v '^\s*$' | sed 's|/$||'
}

is_ignored() {
  local name="$1"
  local patterns="$2"

  [ "$name" = ".git" ] && return 0
  [ "$name" = "_" ] && return 0

  while IFS= read -r pattern; do
    [ -z "$pattern" ] && continue
    # shellcheck disable=SC2053
    if [[ "$name" == $pattern ]]; then
      return 0
    fi
  done <<<"$patterns"

  return 1
}

build_tree() {
  local dir="${1:-.}"
  local prefix="${2:-}"
  local patterns="${3:-}"
  local entries=()

  while IFS= read -r entry; do
    local name
    name=$(basename "$entry")
    is_ignored "$name" "$patterns" && continue
    entries+=("$entry")
  done < <(find "$dir" -maxdepth 1 -mindepth 1 | sort)

  local count=${#entries[@]}
  local i=0

  for entry in "${entries[@]}"; do
    i=$((i + 1))
    local name
    name=$(basename "$entry")
    local connector="├──"
    local child_prefix="${prefix}│   "

    if [ "$i" -eq "$count" ]; then
      connector="└──"
      child_prefix="${prefix}    "
    fi

    if [ -d "$entry" ]; then
      echo "${prefix}${connector} ${name}/"
      build_tree "$entry" "$child_prefix" "$patterns"
    else
      echo "${prefix}${connector} ${name}"
    fi
  done
}

write_snapshot() {
  local project_name
  project_name=$(basename "$PWD")
  local patterns
  patterns=$(load_gitignore_patterns)

  mkdir -p "$(dirname "$OUTPUT_FILE")"

  {
    echo "# Project Snapshot: $project_name"
    echo ""
    echo "## Structure"
    echo ""
    echo '```'
    build_tree "." "" "$patterns"
    echo '```'
    echo ""

    if [ -f "package.json" ]; then
      echo "## package.json"
      echo ""
      echo '```json'
      cat package.json
      echo '```'
      echo ""
    fi
  } >"$OUTPUT_FILE"
}

main() {
  check_dependencies

  if [ "$NESTED" = false ]; then echo -e "${GREY}┌${NC}"; fi

  log_step "Snapshot"
  write_snapshot
  log_info "Written to $OUTPUT_FILE"

  if [ "$NESTED" = false ]; then
    echo -e "${GREY}└${NC}\n"
    echo -e "${GREEN}✓ Snapshot complete${NC}"
  fi
}

main "$@"
