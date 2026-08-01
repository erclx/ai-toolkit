#!/usr/bin/env bash

# The sandbox reaches GitHub over HTTPS with the gh token so a headless run needs
# no SSH key and no agent. `gh auth login` authenticates the CLI but leaves git
# itself without a credential, so the harness supplies the helper rather than
# assuming the machine carries one.
SANDBOX_GIT_CREDENTIAL_HELPER='!gh auth git-credential'

# Call from the main shell before any scenario runs. sandbox_anchor_url is used
# inside command substitutions, where log_error would exit only the subshell and
# leave the caller building an empty remote, so the run has to stop here instead.
require_sandbox_anchor_config() {
  if [ -z "${GITHUB_ORG:-}" ]; then
    log_error "GITHUB_ORG is empty. Export GITHUB_ORG=<org>, or run from a clone whose remote.origin.url points at GitHub."
  fi
}

sandbox_anchor_url() {
  local repo_name="${1:-${ANCHOR_REPO:-}}"

  if [ -z "$repo_name" ] || [ -z "${GITHUB_ORG:-}" ]; then
    log_error "sandbox_anchor_url needs GITHUB_ORG and a repository name. Call require_sandbox_anchor_config first."
  fi

  printf 'https://github.com/%s/%s.git\n' "$GITHUB_ORG" "$repo_name"
}

# credential.helper is multi-valued and git concatenates it across system, global,
# and local, trying each in order until one returns a credential. A plain set
# leaves an operator's existing helper ahead of this one, so a stale token wins
# and gh never runs. The empty value resets the inherited list first.
configure_sandbox_git_credentials() {
  git config credential.helper ""
  git config --add credential.helper "$SANDBOX_GIT_CREDENTIAL_HELPER"
}

resolve_sandbox_git_identity() {
  SANDBOX_GIT_NAME="${SANDBOX_GIT_NAME:-$(git config --global user.name 2>/dev/null || true)}"
  SANDBOX_GIT_EMAIL="${SANDBOX_GIT_EMAIL:-$(git config --global user.email 2>/dev/null || true)}"

  : "${SANDBOX_GIT_NAME:=aitk-sandbox}"
  : "${SANDBOX_GIT_EMAIL:=sandbox@example.com}"

  export SANDBOX_GIT_NAME SANDBOX_GIT_EMAIL
}

configure_sandbox_git_identity() {
  resolve_sandbox_git_identity
  git config user.name "$SANDBOX_GIT_NAME"
  git config user.email "$SANDBOX_GIT_EMAIL"
}

# Every scenario that needs a remote points at the same throwaway repository, so
# the name lives here rather than in each one.
SANDBOX_ANCHOR_REPO="toolkit-sandbox"

# A scenario calls this from its own use_anchor hook rather than this file
# defining the hook. manage-sandbox.sh keys off `type -t use_anchor`, so
# declaring it here would hand an anchor to the scenarios that source this file
# for the identity helpers alone.
use_sandbox_anchor() {
  export ANCHOR_REPO="${1:-$SANDBOX_ANCHOR_REPO}"
}

# A remote is useless without an author, so the scenarios that reach one always
# configure both. configure_sandbox_git_identity stays callable on its own for
# the scenarios that never push. The remove keeps this idempotent against a
# sandbox tree that already carries an origin.
configure_sandbox_anchor_remote() {
  configure_sandbox_git_identity
  git remote remove origin 2>/dev/null || true
  git remote add origin "$(sandbox_anchor_url "$@")"
}
