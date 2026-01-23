#!/bin/bash
set -e
set -o pipefail

GREEN='\033[0;32m'
RED='\033[0;31m'
WHITE='\033[1;37m'
GREY='\033[0;90m'
NC='\033[0m'

log_info() { echo -e "${GREY}│${NC} ${GREEN}✓${NC} $1"; }
log_step() { echo -e "${GREY}│${NC}\n${GREY}├${NC} ${WHITE}$1${NC}"; }
log_fail() { echo -e "${GREY}│${NC} ${RED}✗${NC} $1"; }

use_anchor() {
  export ANCHOR_REPO="gemini-cli-sandbox"
}

stage_setup() {
  log_step "Configuring PR Environment ($ANCHOR_REPO)"
  
git config user.email "architect@erclx.com"
git config user.name "Senior Architect"

  git push origin --delete feature/string-utils -q 2>/dev/null || true

  mkdir -p .gemini/.tmp
  cat <<EOF > .gemini/.tmp/scout_report.md
# Scout Report
- Archetype: Node.js/JavaScript
- Framework: Vanilla JS
- Manager: npm
- Intent: Utility Library
EOF

  git checkout -b feature/string-utils -q

  cat <<'EOF' >> utils.js

export function capitalize(text) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}
EOF

  git add utils.js
  git commit -m "feat(utils): add capitalize helper" -q
  
  log_info "Anchor environment prepared with feature branch and context"
}

stage_verify() {
  local log_file=$1
  local body_file=".gemini/.tmp/pr_body.md"

  log_step "PR Artifact Validation"

  if [ ! -f "$body_file" ]; then
    log_fail "PR body artifact missing at $body_file"
    return 1
  fi

  if grep -qi "Node" "$body_file" || grep -qi "JavaScript" "$body_file" || grep -qi "slugify" "$body_file"; then
    log_info "Description verified: Correct architectural context detected"
  else
    log_fail "Description failed: Missing context from Scout Report or utils.js"
    return 1
  fi
  
  if grep -iq "gh pr create" "$log_file"; then
    log_info "Command verified: Intent to use GitHub CLI detected"
  else
    log_fail "Command failed: No 'gh pr create' execution found in logs"
    return 1
  fi

  return 0
}