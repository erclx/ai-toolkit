#!/usr/bin/env bash

# The sandbox tree lives outside the toolkit worktree. `scripts/sandbox/run.sh`
# sets cwd to it for `claude -p`, and every `CLAUDE.md` between that cwd and the
# filesystem root loads into the session. Under the repository the toolkit's own
# instructions join that chain beside the seeded copy the scenario installed,
# both carry the rule sending shared session scratch to the main worktree root,
# and nothing decides which root wins. A session picking the toolkit writes its
# output where no manifest reads it, so the run reports success while the verdict
# reports no writes at all. `scripts/eval/run.sh` keeps its fixture outside the
# repository for the same reason.
#
# Twin of `SANDBOX_DIR` in `src/commands/sandbox.ts`. The exec boundary rules out
# a shared constant, so a change to the default lands on both sides.
resolve_sandbox_dir() {
  if [ -n "${AITK_SANDBOX_DIR:-}" ]; then
    printf '%s\n' "$AITK_SANDBOX_DIR"
    return 0
  fi

  printf '%s/aitk/sandbox\n' "${XDG_STATE_HOME:-$HOME/.local/state}"
}

# Prints the reason a location is unusable and returns non-zero, so the caller
# reports one message naming the path rather than a bare refusal.
#
# Provisioning removes the tree before staging it, which is why a home directory
# or a filesystem root has to be refused rather than merely discouraged. The
# repository test protects the reason the sandbox sits outside in the first
# place: a path back under the worktree restores the ancestor chain and nothing
# else would say so. It resolves the main worktree root rather than trusting
# `$PROJECT_ROOT`, since a linked worktree is itself inside that root.
assert_sandbox_dir_safe() {
  local dir="$1"
  local root="${2:-${PROJECT_ROOT:-$PWD}}"

  if [ -z "$dir" ] || [ "${dir#/}" = "$dir" ]; then
    printf 'AITK_SANDBOX_DIR must be an absolute path, got: %s\n' "${dir:-<empty>}"
    return 1
  fi

  local main_root
  main_root="$(git -C "$root" worktree list --porcelain 2>/dev/null |
    grep -m 1 '^worktree ' | cut -d' ' -f2-)"
  main_root="${main_root:-$root}"

  case "${dir%/}" in
  '' | "$HOME")
    printf 'Refusing %s as the sandbox. Provisioning removes the tree first.\n' "$dir"
    return 1
    ;;
  "$main_root" | "$main_root"/*)
    printf 'Sandbox at %s sits inside %s, which puts the toolkit CLAUDE.md back on the session ancestor chain. Point AITK_SANDBOX_DIR outside the repository.\n' "$dir" "$main_root"
    return 1
    ;;
  esac

  return 0
}
