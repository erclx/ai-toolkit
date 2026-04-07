#!/bin/bash
set -e
set -o pipefail

source "$PROJECT_ROOT/scripts/lib/inject.sh"

stage_setup() {
  log_step "Wiki sandbox"
  log_info "init — scaffolds wiki/ folder with stub index.md"

  log_step "Running: aitk wiki init"
  exec "$PROJECT_ROOT/scripts/manage-wiki.sh" init .
}
