#!/bin/bash
set -e
set -o pipefail

stage_setup() {
  export GEMINI_SKIP_AUTO_COMMIT="true"

  log_step "Setting up Changelog Environment"

  cat <<'EOF' >CHANGELOG.md
# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

## [1.0.0] - 2024-01-01

### Added

- Core: Initial release of the system.
EOF

  git add CHANGELOG.md
  git commit -m "chore(docs): init changelog" -q
  git tag v1.0.0

  touch auth.js
  git add auth.js
  git commit -m "feat(auth): add jwt validation logic" -q

  touch api.js
  git add api.js
  git commit -m "fix(api): patch buffer overflow in handler" -q

  echo "node_modules" >>.gitignore
  git add .gitignore
  git commit -m "chore(gitignore): update gitignore rules" -q

  log_step "SCENARIO READY: Unreleased Commits"
  log_info "Context: v1.0.0 tag exists. New feats/fixes + noise."
  log_info "Action:  gemini release:changelog"
  log_info "Expect:  Updates CHANGELOG.md with structured entries"
}
