#!/bin/bash

use_anchor() {
  export ANCHOR_REPO="vite-react-template"
}

stage_setup() {
  export GEMINI_SKIP_AUTO_COMMIT="true"
  
  log_step "Hydrating Sandbox Environment"
  if command -v bun &> /dev/null; then
    bun install
  else
    npm install
  fi
}