#!/bin/bash

use_config() {
  export SANDBOX_SKIP_AUTO_COMMIT="true"
  export SANDBOX_INJECT_STANDARDS="true"
}

stage_setup() {
  git init -q
  git config user.email "architect@erclx.com"
  git config user.name "Senior Architect"

  echo 'export const MAX_CONNECTIONS = "5";' >config.js
  git add . && git commit -m "feat(git): initial config" -q

  echo 'export const MAX_CONNECTIONS = 5;' >config.js
  git add config.js

  log_step "Scenario ready: staged changes (config update)"
  log_info "Context: modified 'config.js' (MAX_CONNECTIONS string -> number)"
  log_info "Action:  gemini git:commit \"update config limit\""
  log_info "Expect:  generates conventional commit message"
}
