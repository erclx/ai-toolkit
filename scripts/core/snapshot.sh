#!/usr/bin/env bash
set -e
set -o pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="${PROJECT_ROOT:-$(cd "$SCRIPT_DIR/../.." && pwd)}"

# shellcheck source=/dev/null
source "$PROJECT_ROOT/scripts/lib/ui.sh"

NESTED="${VERIFY_NESTED:-false}"

OUTPUT_FILE=".canon/tmp/project/PROJECT-SNAPSHOT.md"

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

  if [ "$NESTED" = false ]; then open_timeline; fi

  log_step "Snapshot"
  write_snapshot
  log_info "Written to $OUTPUT_FILE"

  # The whole frame goes to stderr, since the run writes its document to a file
  # and leaves stdout carrying nothing. Edges on stdout with the body on stderr
  # would capture as a frame with no body inside it.
  if [ "$NESTED" = false ]; then
    close_timeline
    # All six are declared to scope what `set_palette` assigns, so the four this
    # line never spells stay out of the globals a sourcing script reads.
    # shellcheck disable=SC2034
    local GREEN RED YELLOW WHITE GREY NC
    set_palette 2
    echo -e "\n${GREEN}✓ Snapshot complete${NC}" >&2
  fi
}

main "$@"
