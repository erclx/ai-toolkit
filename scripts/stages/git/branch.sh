#!/bin/bash
set -e

stage_setup() {
  export GEMINI_SKIP_AUTO_COMMIT="true"

  echo "Base project" > README.md
  git add .
  git commit -m "chore(project): init base" -q

  git checkout -b temp/dev-work -q

  echo "function login() {}" > auth.js
  git add auth.js
  git commit -m "feat(auth): implement login function" -q

  mkdir -p docs
  echo "docs" > docs/auth.md
  git add docs/auth.md
  git commit -m "docs(auth): add auth notes" -q

  log_info "Branch scenario prepared with messy name 'temp/dev-work'"
  log_info "Current Branch: temp/dev-work"
  log_info "Commits: 'feat(auth): implement login function', 'docs(auth): add auth notes'"
  log_info "Run: gemini dev:apply-cli 'fix my branch name'"
  log_info "Expect: Rename to 'feat/auth' or 'feat/login'"
}
