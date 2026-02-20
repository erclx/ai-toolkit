#!/bin/bash
set -e
set -o pipefail

use_anchor() {
  export ANCHOR_REPO="gemini-cli-sandbox"
}

stage_setup() {
  export GEMINI_SKIP_AUTO_COMMIT="true"

  log_step "Configuring PR Environment ($ANCHOR_REPO)"

  git config user.email "erclx@github.com"
  git config user.name "Eric"

  git remote add origin "git@github.com:erclx/${ANCHOR_REPO}.git"
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

  log_step "SCENARIO READY: Feature Branch"
  log_info "Context: Branch 'feature/string-utils' with un-pushed commits"
  log_info "Action:  gemini git:pr"
  log_info "Expect:  Agent renames branch -> pushes -> opens draft PR"
}
