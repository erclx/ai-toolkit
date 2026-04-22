#!/bin/bash

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
