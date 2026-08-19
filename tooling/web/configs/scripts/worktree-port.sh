#!/usr/bin/env bash
set -euo pipefail

# Prints a port for this working directory: the base itself in a normal
# checkout, and the base plus a per-worktree offset in a linked git worktree,
# so two worktrees of one repository never serve on one port. A folder left
# behind after its worktree was removed is refused rather than served, since
# every port it derives lands on the one the main checkout wanted.

base="${1:-0}"
band=50
worktrees_dir=".claude/worktrees"

refuse() {
  echo "worktree-port: $1 is a leftover worktree folder, because $2." >&2
  echo "worktree-port: a port derived here collides with the main checkout, so remove the folder, or set WORKTREE_PORT_OFFSET to serve from it anyway." >&2
}

offset() {
  if [[ -n "${WORKTREE_PORT_OFFSET:-}" ]]; then
    echo "$WORKTREE_PORT_OFFSET"
    return
  fi

  local here git_dir common_dir toplevel dir name
  here=$(pwd -P)

  if ! git_dir=$(git rev-parse --git-dir 2>/dev/null); then
    # Git refuses outright when a `.git` file names an administrative directory
    # that is gone, which is what removing a worktree by hand leaves behind.
    # Outside a repository there is no pointer at all and the base is correct.
    dir=$here
    while [[ "$dir" != / ]]; do
      if [[ -f "$dir/.git" ]]; then
        refuse "$dir" "its .git file names an administrative directory that is gone"
        return 1
      fi
      [[ -d "$dir/.git" ]] && break
      dir=$(dirname "$dir")
    done
    echo 0
    return
  fi

  common_dir=$(git rev-parse --git-common-dir 2>/dev/null) || {
    echo 0
    return
  }
  toplevel=$(git rev-parse --show-toplevel 2>/dev/null) || {
    echo 0
    return
  }
  toplevel=$(cd "$toplevel" && pwd -P)

  if [[ "$(cd "$git_dir" && pwd -P)" == "$(cd "$common_dir" && pwd -P)" ]]; then
    # The main checkout answers here, and so does every directory under it,
    # including a folder whose `.git` was deleted along with its worktree,
    # since git then walks upward and reports the parent repository. Location
    # is the only signal separating the two, so a directory sitting under the
    # worktrees folder is refused rather than handed the base port.
    if [[ "$here/" == "$toplevel/$worktrees_dir/"?* ]]; then
      refuse "$here" "no worktree is registered for it"
      return 1
    fi
    echo 0
    return
  fi

  name=$(basename "$toplevel")
  echo $(($(printf '%s' "$name" | cksum | cut -d' ' -f1) % band + 1))
}

value=$(offset) || exit 1
echo $((base + value))
