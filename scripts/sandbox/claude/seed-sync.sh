#!/bin/bash
set -e
set -o pipefail

use_config() {
  export SANDBOX_SKIP_AUTO_COMMIT="true"
  export SANDBOX_INJECT_SEEDS="true"
}

stage_setup() {
  cat <<'EOF' >package.json
{
  "name": "sandbox-seed-sync",
  "version": "1.0.0",
  "private": true,
  "type": "module"
}
EOF

  git add . && git commit -m "chore(project): init" --no-verify -q

  if [ -f "CLAUDE.md" ]; then
    head -n 10 CLAUDE.md >CLAUDE.md.tmp && mv CLAUDE.md.tmp CLAUDE.md
  fi

  git add . && git commit -m "chore(claude): trim CLAUDE.md sections" --no-verify -q

  log_step "Scenario ready: seed sync with drift"
  log_info "Context: project with installed seeds, CLAUDE.md truncated to simulate stale sections"
  log_info "Action:  /claude-seed-sync"
  log_info "Expect:  drift report showing missing/stale sections in CLAUDE.md, proposed edits"
}
