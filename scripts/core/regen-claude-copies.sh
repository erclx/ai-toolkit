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

mirror_dir "$PROJECT_ROOT/standards" "$PROJECT_ROOT/.claude/standards" -name "*.md" -not -path "*/bundled/*"
mirror_dir "$PROJECT_ROOT/snippets" "$PROJECT_ROOT/.claude/snippets" -name "*.md"

# `internal/` is the surface the plugin does not symlink. Mirrored on its own so
# toolkit sessions read it at a `.claude/` path like every other consumed copy.
# `internal/rules/` is excluded because it lands in `.claude/rules/` below, and
# mirroring it here too would publish each rule at a second inert path.
mirror_dir "$PROJECT_ROOT/internal" "$PROJECT_ROOT/.claude/internal" -name "*.md" -not -path "*/rules/*"

# `.claude/rules/` is a subset rather than a mirror, so it resolves through the
# stack machinery instead of a fourth `mirror_dir` call. The record naming the
# subset is `internal/governance.toml`.
bun "$PROJECT_ROOT/src/cli.ts" gov regen --root "$PROJECT_ROOT"
