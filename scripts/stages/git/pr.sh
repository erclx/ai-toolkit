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

  git remote add origin "git@github.com:erclx/${ANCHOR_REPO}.git"
  git push --force origin HEAD:main
  git push origin --delete feature/string-utils -q 2>/dev/null || true

  mkdir -p .gemini/.tmp
  cat <<EOF > .gemini/.tmp/scout-report.md
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
