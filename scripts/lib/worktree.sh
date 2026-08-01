#!/usr/bin/env bash

# Claude Code's worktree entry writes core.bare into the parent repository's
# shared config and its exit never restores it, stranding every later command in
# the main worktree. Sourced by verify.sh, which runs the repair before any stage
# because the flag breaks the git reads that scope the run.

repair_bare_flag() {
  local root="${1:-$PROJECT_ROOT}"
  local common_dir
  [ "$(git -C "$root" config --get core.bare 2>/dev/null || echo false)" = true ] || return 0

  common_dir=$(git -C "$root" rev-parse --path-format=absolute --git-common-dir 2>/dev/null) || return 0
  # A genuinely bare repository keeps its objects at the root and has no .git
  # directory, so it fails this test and keeps its flag.
  [ "$(basename "$common_dir")" = ".git" ] || return 0

  git -C "$root" config core.bare false
  log_warn "Repaired core.bare, which worktree entry left set. Recovery is 'git config core.bare false'."
}
