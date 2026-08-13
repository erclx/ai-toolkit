#!/usr/bin/env bash
set -euo pipefail

# Prints a port for this working directory: the base itself in a normal
# checkout, and the base plus a per-worktree offset in a linked git worktree,
# so two worktrees of one repository never serve on one port.

base="${1:-0}"
band=50

offset() {
  if [[ -n "${WORKTREE_PORT_OFFSET:-}" ]]; then
    echo "$WORKTREE_PORT_OFFSET"
    return
  fi

  local git_dir common_dir name
  git_dir=$(git rev-parse --git-dir 2>/dev/null) || {
    echo 0
    return
  }
  common_dir=$(git rev-parse --git-common-dir 2>/dev/null) || {
    echo 0
    return
  }

  if [[ "$(cd "$git_dir" && pwd -P)" == "$(cd "$common_dir" && pwd -P)" ]]; then
    echo 0
    return
  fi

  name=$(basename "$(git rev-parse --show-toplevel)")
  echo $(($(printf '%s' "$name" | cksum | cut -d' ' -f1) % band + 1))
}

echo $((base + $(offset)))
