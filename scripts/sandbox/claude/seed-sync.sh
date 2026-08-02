#!/usr/bin/env bash
set -e
set -o pipefail

use_config() {
  export SANDBOX_SKIP_AUTO_COMMIT="true"
  export SANDBOX_INJECT_SEEDS="true"
  export SANDBOX_INJECT_STANDARDS="true"
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
    sed -i 's/before changes, when present\./before edits\./' CLAUDE.md
  fi

  if [ -f ".claude/standards/prose.md" ]; then
    sed -i 's/^- Use active voice\./- Use active voice and present tense./' .claude/standards/prose.md
  fi

  # An explicit branch rather than whatever `git init` inherited. The proposal
  # filename carries the slug, so leaving it on the machine's `init.defaultBranch`
  # would make the expectation pass or fail by local git config.
  git checkout -b chore/seed-drift -q

  git add . && git commit -m "chore(claude): trim CLAUDE.md and drift standards" --no-verify -q

  log_step "Scenario ready: seed sync with drift across seeds and standards"
  log_info "Context: project with installed seeds and standards, CLAUDE.md truncated, one Context bullet mutated, .claude/standards/prose.md drifted"
  log_info "Action:  /claude-seed-sync"
  log_info "Expect:  drift report covering both seeds and standards, scope table grouped by source"
}
