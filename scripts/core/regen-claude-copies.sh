#!/usr/bin/env bash
set -e
set -o pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="${PROJECT_ROOT:-$(cd "$SCRIPT_DIR/../.." && pwd)}"

mirror_dir() {
  local src="$1"
  local dest="$2"
  local find_args=("${@:3}")

  rm -rf "$dest"
  while IFS= read -r file; do
    local rel="${file#"$src"/}"
    mkdir -p "$dest/$(dirname "$rel")"
    cp "$file" "$dest/$rel"
  done < <(find "$src" -type f "${find_args[@]}" | sort)
}

mirror_dir "$PROJECT_ROOT/standards" "$PROJECT_ROOT/.claude/standards" -name "*.md"
mirror_dir "$PROJECT_ROOT/snippets" "$PROJECT_ROOT/.claude/snippets" -name "*.md"
