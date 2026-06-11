#!/usr/bin/env bash
set -e
set -o pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="${PROJECT_ROOT:-$(dirname "$(dirname "$SCRIPT_DIR")")}"

source "$PROJECT_ROOT/scripts/lib/ui.sh"
source "$PROJECT_ROOT/scripts/lib/gov.sh"

DOCS_DIR="$PROJECT_ROOT/docs"

list_topics() {
  local file name
  while IFS= read -r file; do
    name=$(basename "$file" .md)
    [ "$name" = "index" ] && continue
    log_info "$name"
  done < <(find "$DOCS_DIR" -maxdepth 1 -type f -name "*.md" | sort)
}

main() {
  trap close_timeline EXIT

  local topic="$1"
  if [ -z "$topic" ]; then
    log_error "No topic. Run 'aitk docs list' to see available topics."
  fi

  local file="$DOCS_DIR/$topic.md"
  if [ ! -f "$file" ]; then
    log_warn "Unknown topic: $topic"
    log_step "Available topics"
    list_topics
    log_error "Run 'aitk docs list' for descriptions."
  fi

  log_step "docs/$topic.md"
  strip_frontmatter "$file"
}

main "$@"
