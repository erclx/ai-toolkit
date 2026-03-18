#!/bin/bash
set -e
set -o pipefail

use_config() {
  export SANDBOX_SKIP_AUTO_COMMIT="true"
  export SANDBOX_INJECT_STANDARDS="true"
}

stage_setup() {
  git init -q
  git config user.email "architect@example.com"
  git config user.name "Senior Architect"

  echo "# My App" >README.md
  git add . && git commit -m "chore(project): init" -q

  mkdir -p src/auth src/api docs

  echo 'export function login(user) { return fetch("/api/login", { body: user }); }' >src/auth/login.js
  echo 'export function logout() { return fetch("/api/logout"); }' >src/auth/logout.js
  echo "export function getUser(id) { return fetch(\`/api/users/\${id}\`); }" >src/api/users.js
  printf "# Auth module\n\nHandles login and logout.\n" >docs/auth.md
  echo '{ "name": "my-app", "version": "1.1.0" }' >package.json

  git add src/auth/login.js src/auth/logout.js src/api/users.js docs/auth.md package.json

  log_step "Scenario ready: 5 staged files across mixed concerns"
  log_info "Context: 2 auth files, 1 api file, 1 doc, 1 config change — all staged"
  log_info "Action:  gemini git:stage"
  log_info "Expect:  groups auth + api separately, docs solo, config solo"
}
