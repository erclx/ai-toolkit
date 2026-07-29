#!/usr/bin/env bash
set -e
set -o pipefail

stage_setup() {
  log_step "Wiki sandbox"
  log_info "init : scaffolds wiki/ folder with stub index.md"

  log_step "Running: aitk wiki init"
  exec bun "$PROJECT_ROOT/src/cli.ts" wiki init .
}
