#!/bin/bash
set -e
set -o pipefail

use_anchor() {
  export ANCHOR_REPO="toolkit-sandbox"
}

use_config() {
  export SANDBOX_SKIP_AUTO_COMMIT="true"
  export SANDBOX_INJECT_STANDARDS="true"
}

stage_setup() {
  select_or_route_scenario "Which scenario?" "without-changelog" "with-changelog"

  git config user.email "${GITHUB_ORG}@github.com"
  git config user.name "Dev"

  git remote add origin "git@github.com:${GITHUB_ORG}/${ANCHOR_REPO}.git"

  cat <<'EOF' >README.md
# My App

## Setup

Run on port `8080`.

## Commands

- `start`: start the server
EOF

  mkdir -p src
  echo 'export const PORT = 8080;' >src/server.js
  git add . && git commit -m "chore(project): init" -q

  git push --force origin HEAD:main
  git push origin --delete draft/init -q 2>/dev/null || true

  git checkout -b draft/init -q

  cat <<'EOF' >src/server.js
export const PORT = 3000;
export function healthCheck() { return { status: "ok" }; }
EOF

  mkdir -p src/routes
  echo 'export function register(app) { app.get("/health", () => healthCheck()); }' >src/routes/health.js

  case "$SELECTED_OPTION" in
  "with-changelog")
    printf "# Changelog\n\n## [0.1.0]\n\n- Initial release\n" >CHANGELOG.md

    log_step "Scenario ready: with changelog"
    log_info "Context: draft/init branch, port changed to 3000, health check added, README stale, CHANGELOG.md present"
    log_info "Action:  /git:ship"
    log_info "Expect:  README updated, changes committed, branch renamed, PR opened, changelog appended"
    ;;
  "without-changelog")
    log_step "Scenario ready: without changelog"
    log_info "Context: draft/init branch, port changed to 3000, health check added, README stale, no CHANGELOG.md"
    log_info "Action:  /git:ship"
    log_info "Expect:  README updated, changes committed, branch renamed, PR opened, changelog step skipped"
    ;;
  *)
    log_error "Unknown scenario: $SELECTED_OPTION"
    ;;
  esac
}
