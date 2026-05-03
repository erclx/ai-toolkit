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

  git remote remove origin 2>/dev/null || true
  git remote add origin "git@github.com:${GITHUB_ORG}/${ANCHOR_REPO}.git"
  git branch -M main

  git push --force origin HEAD:main -q
  git push origin --delete feat/utils-followup -q 2>/dev/null || true
  gh pr list --head feat/utils-followup --state open --json number -q '.[].number' 2>/dev/null |
    xargs -r -I {} gh pr close {} -d -c "scenario reset" >/dev/null 2>&1 || true

  case "$SELECTED_OPTION" in
  "open-pr")
    git checkout -b feat/utils-followup -q

    cat <<'EOF' >>utils.js

export function lowercase(text) {
  return text.toLowerCase();
}
EOF
    git add utils.js && git commit -m "feat(utils): add lowercase helper" -q
    git push -u origin feat/utils-followup -q

    gh pr create \
      --title "feat(utils): add lowercase helper" \
      --body "Adds lowercase helper to utils." \
      --head feat/utils-followup \
      --base main >/dev/null

    cat <<'EOF' >>utils.js

export function trim(text) {
  return text.trim();
}
EOF

    log_step "Scenario ready: open PR with one followup edit"
    log_info "Context: feat/utils-followup tracks origin, PR open, unstaged trim() addition"
    log_info "Action:  /git-followup"
    log_info "Expect:  stage -> commit -> push -> PR body updated to mention trim helper"
    ;;
  "no-pr-guard")
    git checkout -b feat/utils-followup -q
    git commit --allow-empty -m "chore: bootstrap branch" -q
    git push -u origin feat/utils-followup -q
    echo "// followup" >>utils.js

    log_step "Scenario ready: branch tracks origin but no open PR"
    log_info "Context: feat/utils-followup pushed, no PR opened, unstaged edit"
    log_info "Action:  /git-followup"
    log_info "Expect:  no-PR guard fires, suggests git-ship instead"
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
