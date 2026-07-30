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

configure_sandbox_git_credentials() {
  git config credential.helper "$SANDBOX_GIT_CREDENTIAL_HELPER"
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
