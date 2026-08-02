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

# Collapses repeated separators and strips every trailing one, leaving a bare
# root as `/`. Every comparison below is a string test, so `//` and `$HOME//`
# would otherwise read as paths no rule names.
normalize_sandbox_path() {
  local path="$1"

  while [ "$path" != "${path//\/\//\/}" ]; do
    path="${path//\/\//\/}"
  done

  while [ "${#path}" -gt 1 ] && [ "${path%/}" != "$path" ]; do
    path="${path%/}"
  done

  printf '%s' "$path"
}

# Whether `candidate` is `target` or a directory containing it. Removing the
# former removes the latter, which is what makes an ancestor as dangerous as an
# exact match.
is_at_or_above() {
  local candidate="$1"
  local target="$2"

  [ "$candidate" = "$target" ] || [ "${target#"$candidate"/}" != "$target" ]
}

# Prints the reason a location is unusable and returns non-zero, so the caller
# reports one message naming the path rather than a bare refusal.
#
# Provisioning runs `rm -rf` on this path at three sites before staging, so the
# test is an allowlist rather than a list of paths to refuse. A blocklist has to
# name every system directory to be right once and stays wrong as soon as one is
# missed, while requiring a strict descendant of the home directory or of the
# temp root admits the default and every reasonable override and refuses `/`,
# `/usr`, `/etc`, and `$HOME` itself without naming any of them.
#
# The repository test is separate and runs both ways. A path under the worktree
# restores the ancestor chain the relocation removed, and a path above it is one
# `rm -rf` away from deleting the repository. It resolves the main worktree root
# rather than trusting `$PROJECT_ROOT`, since a linked worktree is itself inside
# that root.
assert_sandbox_dir_safe() {
  local raw="$1"
  local root="${2:-${PROJECT_ROOT:-$PWD}}"

  if [ -z "$raw" ] || [ "${raw#/}" = "$raw" ]; then
    printf 'AITK_SANDBOX_DIR must be an absolute path, got: %s\n' "${raw:-<empty>}"
    return 1
  fi

  local dir home temp
  dir="$(normalize_sandbox_path "$raw")"
  home="$(normalize_sandbox_path "${HOME:-/root}")"
  temp="$(normalize_sandbox_path "${TMPDIR:-/tmp}")"

  if ! is_at_or_above "$home" "$dir" && ! is_at_or_above "$temp" "$dir"; then
    printf 'Refusing %s as the sandbox. Provisioning removes the tree first, so the path has to sit under %s or %s.\n' "$raw" "$home" "$temp"
    return 1
  fi

  if [ "$dir" = "$home" ] || [ "$dir" = "$temp" ]; then
    printf 'Refusing %s as the sandbox. Provisioning removes the tree first, so the path has to sit under %s rather than be it.\n' "$raw" "$dir"
    return 1
  fi

  local main_root
  main_root="$(git -C "$root" worktree list --porcelain 2>/dev/null |
    grep -m 1 '^worktree ' | cut -d' ' -f2-)"
  main_root="$(normalize_sandbox_path "${main_root:-$root}")"

  if is_at_or_above "$dir" "$main_root"; then
    printf 'Refusing %s as the sandbox. Provisioning removes the tree first, and that path contains %s.\n' "$raw" "$main_root"
    return 1
  fi

  case "$dir" in
  "$main_root"/*)
    printf 'Sandbox at %s sits inside %s, which puts the toolkit CLAUDE.md back on the session ancestor chain. Point AITK_SANDBOX_DIR outside the repository.\n' "$raw" "$main_root"
    return 1
    ;;
  esac

  return 0
}
