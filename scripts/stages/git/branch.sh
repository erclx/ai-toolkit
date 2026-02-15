#!/bin/bash
set -e

stage_setup() {
  export GEMINI_SKIP_AUTO_COMMIT="true"

  echo "Base project" > README.md
  git add .
  git commit -m "chore(project): init base" -q

  git checkout -b feat/clean-feature -q
  echo "valid code" > feature.js
  git add . && git commit -m "feat(core): compliant feature work" -q

  git checkout -b temp/wip-stuff -q
  echo "messy code" > wip.js
  git add . && git commit -m "feat(wip): messy work in progress" -q

  log_step "SCENARIO READY: Branch Naming Compliance"
  
  log_info "Test A (Current Branch): 'temp/wip-stuff'"
  log_info "  Action: gemini git:branch"
  log_info "  Expect: Suggest rename to 'feat/wip-messy-work'"
  
  echo -e "${GREY}│${NC}"
  
  log_info "Test B (Toggle): 'git checkout feat/clean-feature'"
  log_info "  Action: gemini git:branch"
  log_info "  Expect: '✅ Branch name already follows conventions'"
}
