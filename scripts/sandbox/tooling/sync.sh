#!/bin/bash
set -e
set -o pipefail

stage_setup() {
  export GEMINI_SKIP_AUTO_COMMIT="true"

  log_step "Scaffolding Partial Tooling State"

  cat <<'EOF' >package.json
{
  "name": "sandbox-sync-test",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "format": "prettier --write ."
  }
}
EOF
  log_info "package.json created (partial scripts — missing check:*, shell, spell)"

  cat <<'EOF' >.prettierrc
{
  "semi": true,
  "singleQuote": false
}
EOF
  log_info ".prettierrc created (drifted — semi:true, singleQuote:false)"

  cat <<'EOF' >commitlint.config.js
export default {
  extends: ['@commitlint/config-conventional'],
}
EOF
  log_info "commitlint.config.js created (drifted — missing custom rules)"

  git add .
  git commit -m "chore(sandbox): partial tooling state" -q

  log_step "SCENARIO READY: Tooling Sync Merge Test"
  log_info "Context: Project has partial, drifted tooling configs."
  log_info ""
  log_info "State:"
  log_warn ".prettierrc          drifted  (semi:true, singleQuote:false)"
  log_warn "commitlint.config.js drifted  (missing custom rules)"
  log_add "all other configs    missing"
  log_add "all seeds            missing"
  log_info ""
  log_info "Action:  gdev tooling base ."
  log_info "Expect:  Drifted configs overwritten, missing configs created, seeds planted, deps installed"
}
