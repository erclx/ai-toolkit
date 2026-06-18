#!/usr/bin/env bash
set -e
set -o pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="${PROJECT_ROOT:-$(dirname "$(dirname "$SCRIPT_DIR")")}"

source "$PROJECT_ROOT/scripts/lib/ui.sh"
source "$PROJECT_ROOT/scripts/lib/gov.sh"

DOCS_DIR="$PROJECT_ROOT/docs"
CONTEXT_DIR="$PROJECT_ROOT/.claude/context"

list_topics() {
  local dir file name
  for dir in "$DOCS_DIR" "$CONTEXT_DIR"; do
    while IFS= read -r file; do
      name=$(basename "$file" .md)
      [ "$name" = "index" ] && continue
      log_info "$name"
    done < <(find "$dir" -maxdepth 1 -type f -name "*.md" | sort)
  done
}

main() {
  trap close_timeline EXIT

  local topic="$1"
  if [ -z "$topic" ]; then
    log_error "No topic. Run 'aitk docs list' to see available topics."
  fi

  local file="" rel=""
  if [ -f "$DOCS_DIR/$topic.md" ]; then
    file="$DOCS_DIR/$topic.md"
    rel="docs/$topic.md"
  elif [ -f "$CONTEXT_DIR/$topic.md" ]; then
    file="$CONTEXT_DIR/$topic.md"
    rel=".claude/context/$topic.md"
  else
    log_warn "Unknown topic: $topic"
    log_step "Available topics"
    list_topics
    log_error "Run 'aitk docs list' for descriptions."
  fi

  log_step "$rel"
  strip_frontmatter "$file"
}

main "$@"
