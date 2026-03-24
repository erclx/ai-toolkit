#!/bin/bash
set -e
set -o pipefail

use_config() {
  export SANDBOX_SKIP_AUTO_COMMIT="true"
  export SANDBOX_INJECT_STANDARDS="true"
  export SANDBOX_INJECT_CONTEXT="true"
}

stage_setup() {
  git init -q
  git config user.email "architect@example.com"
  git config user.name "Senior Architect"

  echo "# My App" >README.md
  git add . && git commit -m "chore(project): init" -q

  git checkout -b feat/user-auth -q

  mkdir -p src
  echo 'export function login(user) { return fetch("/api/login", { body: user }); }' >src/auth.js
  git add . && git commit -m "feat(auth): add login function" -q

  echo 'export function logout() { return fetch("/api/logout"); }' >>src/auth.js
  git add . && git commit -m "feat(auth): add logout function" -q

  mkdir -p scripts
  cat <<'EOF' >scripts/setup.sh
#!/bin/bash
echo "Setting up project..."
npm install
EOF
  git add . && git commit -m "chore(scripts): add project setup script" -q

  mkdir -p docs
  printf "# Auth module\n\nHandles login and logout.\n" >docs/auth.md
  git add . && git commit -m "docs(auth): add auth module reference" -q

  printf "# Contributing\n\nRun npm install before committing.\n" >docs/contributing.md
  git add . && git commit -m "docs(project): add contributing guide" -q

  echo 'export function register(user) { return fetch("/api/register", { body: user }); }' >>src/auth.js
  git add . && git commit -m "feat(auth): add register function" -q

  log_step "Scenario ready: mixed commits on feat/user-auth"
  log_info "Context: 6 commits ahead of main — 3 auth feature, 1 chore/scripts, 2 docs"
  log_info "Action:  gemini git:split"
  log_info "Expect:  renames feat/user-auth to primary concern; proposes chore + docs as secondary branches"
}
