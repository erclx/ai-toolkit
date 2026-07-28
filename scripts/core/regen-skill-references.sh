#!/usr/bin/env bash
set -e
set -o pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="${PROJECT_ROOT:-$(cd "$SCRIPT_DIR/../.." && pwd)}"

source "$PROJECT_ROOT/scripts/lib/frontmatter.sh"

BUNDLED_DIR="$PROJECT_ROOT/standards/bundled"
SKILLS_DIR="$PROJECT_ROOT/claude/skills"

[ -d "$BUNDLED_DIR" ] || exit 0

while IFS= read -r file; do
  filename="$(basename "$file")"
  consumers="$(read_frontmatter_field "$file" "consumers")"
  [ -z "$consumers" ] && continue
  IFS=',' read -ra skills <<<"$consumers"
  for skill in "${skills[@]}"; do
    skill="${skill// /}"
    [ -z "$skill" ] && continue
    dest_dir="$SKILLS_DIR/$skill/references"
    mkdir -p "$dest_dir"
    cp "$file" "$dest_dir/$filename"
  done
done < <(find "$BUNDLED_DIR" -type f -name "*.md" | sort)
