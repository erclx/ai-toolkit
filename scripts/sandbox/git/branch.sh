#!/bin/bash
set -e

use_config() {
  export SANDBOX_SKIP_AUTO_COMMIT="true"
  export SANDBOX_INJECT_STANDARDS="true"
}

stage_setup() {
  echo "Base project" >README.md
  git add .
  git commit -m "chore(project): init base" -q

  git checkout -b feat/clean-feature -q
  echo "valid code" >feature.js
  git add . && git commit -m "feat(core): compliant feature work" -q

  git checkout -b temp/wip-stuff -q
  echo "messy code" >wip.js
  git add . && git commit -m "feat(wip): messy work in progress" -q

  log_step "Scenario ready: branch naming compliance"

  log_info "Test A (current branch): 'temp/wip-stuff'"
  log_info "  Action: gemini git:branch"
  log_info "  Expect: Suggest rename to 'feat/wip-messy-work'"

  echo -e "${GREY}│${NC}"

  log_info "Test B (toggle): 'git checkout feat/clean-feature'"
  log_info "  Action: gemini git:branch"
  log_info "  Expect: '✅ Branch name already follows conventions'"
}
