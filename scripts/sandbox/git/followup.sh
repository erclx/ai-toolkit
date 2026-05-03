#!/bin/bash
set -e
set -o pipefail

source "$PROJECT_ROOT/scripts/lib/sandbox-git.sh"

use_anchor() {
  export ANCHOR_REPO="toolkit-sandbox"
}

use_config() {
  export SANDBOX_SKIP_AUTO_COMMIT="true"
  export SANDBOX_INJECT_STANDARDS="true"
  export SANDBOX_INJECT_CONTEXT="true"
}

stage_setup() {
  select_or_route_scenario "Which scenario?" "open-pr" "no-pr-guard" "main-guard"

  configure_sandbox_git_identity
  git remote add origin "git@github.com:${GITHUB_ORG}/${ANCHOR_REPO}.git"

  cat <<'EOF' >utils.js
export function capitalize(text) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}
EOF
  git add utils.js && git commit -m "chore(utils): init" -q

  git push --force origin HEAD:main
  git push origin --delete feat/utils-capitalize -q 2>/dev/null || true

  case "$SELECTED_OPTION" in
  "open-pr")
    git checkout -b feat/utils-capitalize -q

    cat <<'EOF' >>utils.js

export function lowercase(text) {
  return text.toLowerCase();
}
EOF
    git add utils.js && git commit -m "feat(utils): add lowercase helper" -q
    git push -u origin feat/utils-capitalize -q

    cat <<'EOF' >>utils.js

export function trim(text) {
  return text.trim();
}
EOF

    log_step "Scenario ready: open PR with one followup edit"
    log_info "Context: feat/utils-capitalize tracks origin, PR open, unstaged trim() addition"
    log_info "Action:  /git-followup"
    log_info "Expect:  stage -> commit -> push -> PR body updated to mention trim helper"
    ;;
  "no-pr-guard")
    git checkout -b feat/utils-capitalize -q
    echo "// followup" >>utils.js

    log_step "Scenario ready: branch with no open PR"
    log_info "Context: branch has unstaged changes but no PR exists yet"
    log_info "Action:  /git-followup"
    log_info "Expect:  guard fires, suggests git-ship instead"
    ;;
  "main-guard")
    echo "// stray edit" >>utils.js

    log_step "Scenario ready: changes on main"
    log_info "Context: user is on main with unstaged changes"
    log_info "Action:  /git-followup"
    log_info "Expect:  guard fires, refuses to ship from main"
    ;;
  *)
    log_error "Unknown scenario: $SELECTED_OPTION"
    ;;
  esac
}
