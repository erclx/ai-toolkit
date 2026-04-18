#!/bin/bash
set -e
set -o pipefail

use_anchor() {
  export ANCHOR_REPO="toolkit-sandbox"
}

use_config() {
  export SANDBOX_SKIP_AUTO_COMMIT="true"
  export SANDBOX_INJECT_STANDARDS="true"
  export SANDBOX_INJECT_CONTEXT="true"
}

stage_setup() {
  select_or_route_scenario "Which scenario?" "feature-branch" "draft-guard"

  case "$SELECTED_OPTION" in
  "feature-branch")
    log_step "Configuring PR environment ($ANCHOR_REPO)"

    git config user.email "${GITHUB_ORG}@github.com"
    git config user.name "Eric"

    git remote add origin "git@github.com:${GITHUB_ORG}/${ANCHOR_REPO}.git"
    git push --force origin HEAD:main
    git push origin --delete feature/string-utils -q 2>/dev/null || true

    git checkout -b feature/string-utils -q

    cat <<'EOF' >>utils.js
export function capitalize(text) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}
EOF

    git add utils.js
    git commit -m "feat(utils): add capitalize helper" -q

    log_step "Scenario ready: feature branch"
    log_info "Context: branch 'feature/string-utils' with un-pushed commits"
    log_info "Action:  gemini git:pr"
    log_info "Expect:  agent renames branch -> pushes -> opens PR"
    ;;
  "draft-guard")
    git checkout -b draft/init -q

    touch feature.js
    git add feature.js
    git commit -m "feat: work in progress" -q

    log_step "Scenario ready: draft/init guard"
    log_info "Context: user forgot to run /git:branch before /git:pr"
    log_info "Action:  gemini git:pr"
    log_info "Expect:  guard warning. Branch looks unset, run /git:branch first"
    ;;
  *)
    log_error "Unknown scenario: $SELECTED_OPTION"
    ;;
  esac
}
