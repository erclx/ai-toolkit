#!/bin/bash
set -e
set -o pipefail

source "$PROJECT_ROOT/scripts/lib/inject.sh"

seed_folder() {
  mkdir -p docs
  cat <<'EOF' >docs/index.md
---
title: Docs
subtitle: Sample folder index for sandbox
---

# Stale content that should be overwritten
EOF
  cat <<'EOF' >docs/alpha.md
---
title: Alpha
description: First sample entry
---

# Alpha
EOF
  cat <<'EOF' >docs/beta.md
---
title: Beta
description: Second sample entry
---

# Beta
EOF
}

stage_setup() {
  seed_folder

  log_step "Indexes sandbox"
  log_info "regen       — walks CWD and rewrites every index.md"
  log_info "dry-run     — reports drift without writing (exits 2 on drift)"
  log_info "json        — emits machine-readable records on stdout"
  log_info "opt-out     — adds auto: false to index.md and confirms skip"
  log_info "path        — passes a positional file and confirms walk-up"

  select_or_route_scenario "Which scenario?" "regen" "dry-run" "json" "opt-out" "path"

  case "$SELECTED_OPTION" in
  "regen")
    log_step "Running: aitk indexes regen"
    exec "$PROJECT_ROOT/scripts/manage-indexes.sh" regen
    ;;
  "dry-run")
    log_step "Running: aitk indexes regen --dry-run"
    exec "$PROJECT_ROOT/scripts/manage-indexes.sh" regen --dry-run
    ;;
  "json")
    log_step "Running: aitk indexes regen --dry-run --json"
    exec "$PROJECT_ROOT/scripts/manage-indexes.sh" regen --dry-run --json
    ;;
  "opt-out")
    log_step "Setting auto: false on docs/index.md"
    sed -i '2i\auto: false' docs/index.md
    log_step "Running: aitk indexes regen"
    exec "$PROJECT_ROOT/scripts/manage-indexes.sh" regen
    ;;
  "path")
    log_step "Running: aitk indexes regen docs/alpha.md"
    exec "$PROJECT_ROOT/scripts/manage-indexes.sh" regen docs/alpha.md
    ;;
  *)
    log_error "Unknown scenario: $SELECTED_OPTION"
    ;;
  esac
}
