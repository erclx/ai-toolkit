#!/usr/bin/env bash
set -e
set -o pipefail

use_config() {
  export SANDBOX_SKIP_AUTO_COMMIT="true"
}

stage_setup() {
  select_or_route_scenario "Which scenario?" "pass" "fail"

  case "$SELECTED_OPTION" in
  "pass")
    cat <<'EOF' >package.json
{
  "name": "sandbox-smoke-pass",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "mkdir -p .smoke && touch .smoke/dev-started && sleep 15",
    "preview": "mkdir -p .smoke && touch .smoke/preview-started && sleep 15",
    "test:e2e": "mkdir -p .smoke && touch .smoke/e2e-ran && echo e2e ok",
    "screenshot": "mkdir -p .smoke && touch .smoke/screenshot-ran && echo screenshot ok"
  }
}
EOF

    git add . && git commit -m "chore(sandbox): scaffolded project with passing smoke scripts" --no-verify -q

    log_step "Scenario ready: setup-smoke happy path"
    log_info "Context: package.json with dev, preview, test:e2e, screenshot all succeeding"
    log_info "Action:  /canon:setup-smoke"
    log_info "Expect:  four green checks, summary 'Scaffold smoke-tested'"
    ;;
  "fail")
    cat <<'EOF' >package.json
{
  "name": "sandbox-smoke-fail",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "mkdir -p .smoke && touch .smoke/dev-started && sleep 15",
    "preview": "mkdir -p .smoke && touch .smoke/preview-started && sleep 15",
    "test:e2e": "mkdir -p .smoke && touch .smoke/e2e-ran && echo e2e error >&2 && exit 1",
    "screenshot": "mkdir -p .smoke && touch .smoke/screenshot-ran && echo screenshot ok"
  }
}
EOF

    git add . && git commit -m "chore(sandbox): scaffolded project with failing end-to-end suite" --no-verify -q

    log_step "Scenario ready: setup-smoke fail path"
    log_info "Context: package.json with test:e2e exiting non-zero"
    log_info "Action:  /canon:setup-smoke"
    log_info "Expect:  dev and preview pass, test:e2e fails, run stops before screenshot, failing output surfaced"
    ;;
  *)
    log_error "Unknown scenario: $SELECTED_OPTION"
    ;;
  esac
}
