#!/bin/bash
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
  "name": "sandbox-verify-pass",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "lint:fix": "echo lint ok",
    "typecheck": "echo typecheck ok",
    "check": "echo check ok",
    "test:run": "echo tests ok",
    "build": "echo build ok"
  }
}
EOF

    git add . && git commit -m "chore(sandbox): scaffolded project with passing scripts" --no-verify -q

    log_step "Scenario ready: verify-scaffold happy path"
    log_info "Context: package.json with lint:fix, typecheck, check, test:run, build all echoing ok"
    log_info "Action:  /toolkit:verify-scaffold"
    log_info "Expect:  five green checks, summary 'Scaffold verified'"
    ;;
  "fail")
    cat <<'EOF' >package.json
{
  "name": "sandbox-verify-fail",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "lint:fix": "echo lint ok",
    "typecheck": "echo typecheck error >&2 && exit 1",
    "check": "echo check ok",
    "test:run": "echo tests ok",
    "build": "echo build ok"
  }
}
EOF

    git add . && git commit -m "chore(sandbox): scaffolded project with failing typecheck" --no-verify -q

    log_step "Scenario ready: verify-scaffold fail path"
    log_info "Context: package.json with typecheck that exits non-zero"
    log_info "Action:  /toolkit:verify-scaffold"
    log_info "Expect:  lint passes, typecheck fails, run stops before check/test/build, failing output surfaced"
    ;;
  *)
    log_error "Unknown scenario: $SELECTED_OPTION"
    ;;
  esac
}
