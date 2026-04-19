#!/bin/bash
set -e
set -o pipefail

use_config() {
  export SANDBOX_SKIP_AUTO_COMMIT="true"
}

stage_setup() {
  cat <<'EOF' >package.json
{
  "name": "sandbox-design-propose",
  "version": "1.0.0",
  "private": true,
  "type": "module"
}
EOF

  mkdir -p .claude
  cat <<'EOF' >.claude/REQUIREMENTS.md
# Requirements

A focus timer for writers. Single-screen app. Start a session, see elapsed time, end and log the run.

## Personality

Quiet and disciplined. The app should feel like a clean desk at dawn: uncluttered, warm paper tones, a single confident accent for the active state. No decoration, no motion, no sound. The reader should trust the timer is running without needing reassurance from the interface.

## Non-goals

- No team features
- No statistics dashboard
- No motion or transitions
EOF

  cat <<'EOF' >.claude/ARCHITECTURE.md
# Architecture

- Vite plus React single-page app
- Local storage for session history
- No backend, no auth, no network calls
EOF

  git add . && git commit -m "chore(project): seed greenfield focus timer with personality" --no-verify -q

  log_step "Scenario ready: design propose for a greenfield project"
  log_info "Context: REQUIREMENTS.md with a Personality paragraph, ARCHITECTURE.md, no code"
  log_info "Signals the skill should pick up:"
  log_info "  Personality: quiet, disciplined, warm paper tones, single accent, no motion"
  log_info "  Non-goals: no motion or transitions"
  log_info "  Architecture: Vite plus React web app (informs typography choices)"
  log_info "Action 1: /toolkit:claude-design-propose"
  log_info "Expect:   populated .claude/DESIGN.md with proposed tokens, most cells marked ? verify"
  log_info "Action 2: aitk design render"
  log_info "Expect:   .claude/review/design/index.html renders cleanly with swatches and samples"
}
