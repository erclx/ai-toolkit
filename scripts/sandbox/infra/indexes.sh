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

seed_bare_folder() {
  mkdir -p docs
  cat <<'EOF' >CLAUDE.md
# Project

Sample project for testing the indexes-install skill.

## Rules

- When editing any markdown file, follow project prose conventions.
EOF
  cat <<'EOF' >docs/architecture.md
# Architecture

System boundaries and module responsibilities for the sample project. Defines how the API gateway forwards requests to the worker pool and where state persists.

## Sections

Body content for the architecture doc goes here.
EOF
  cat <<'EOF' >docs/onboarding.md
# Onboarding

Steps for a new contributor to clone the repo, install dependencies, and run the dev loop end to end.

## Sections

Body content for the onboarding doc goes here.
EOF
  cat <<'EOF' >docs/deployment.md
# Deployment

Build, package, and release workflow for staging and production environments. Covers rollback procedure and post-deploy verification.

## Sections

Body content for the deployment doc goes here.
EOF
  cat <<'EOF' >docs/troubleshooting.md
# Troubleshooting

Common failure modes for the worker pool, with the symptom each surfaces and the recovery action that resolves it.

## Sections

Body content for the troubleshooting doc goes here.
EOF
  cat <<'EOF' >docs/glossary.md
# Glossary

Domain terms used across the codebase. Each entry is a single sentence so the doc stays scannable as the system grows.

## Sections

Body content for the glossary doc goes here.
EOF
}

stage_setup() {
  log_step "Indexes sandbox"
  log_info "regen       : walks CWD and rewrites every index.md"
  log_info "dry-run     : reports drift without writing (exits 2 on drift)"
  log_info "json        : emits machine-readable records on stdout"
  log_info "opt-out     : adds auto: false to index.md and confirms skip"
  log_info "path        : passes a positional file and confirms walk-up"
  log_info "bootstrap   : seeds raw markdown for the indexes-install skill"

  select_or_route_scenario "Which scenario?" "regen" "dry-run" "json" "opt-out" "path" "bootstrap"

  case "$SELECTED_OPTION" in
  "regen")
    seed_folder
    log_step "Running: aitk indexes regen"
    exec "$PROJECT_ROOT/scripts/manage-indexes.sh" regen
    ;;
  "dry-run")
    seed_folder
    log_step "Running: aitk indexes regen --dry-run"
    exec "$PROJECT_ROOT/scripts/manage-indexes.sh" regen --dry-run
    ;;
  "json")
    seed_folder
    log_step "Running: aitk indexes regen --dry-run --json"
    exec "$PROJECT_ROOT/scripts/manage-indexes.sh" regen --dry-run --json
    ;;
  "opt-out")
    seed_folder
    log_step "Setting auto: false on docs/index.md"
    sed -i '2i\auto: false' docs/index.md
    log_step "Running: aitk indexes regen"
    exec "$PROJECT_ROOT/scripts/manage-indexes.sh" regen
    ;;
  "path")
    seed_folder
    log_step "Running: aitk indexes regen docs/alpha.md"
    exec "$PROJECT_ROOT/scripts/manage-indexes.sh" regen docs/alpha.md
    ;;
  "bootstrap")
    seed_bare_folder
    log_step "Seeded docs/ with 5 raw markdown files (no frontmatter, no index.md)"
    log_info "Open Claude in this sandbox and invoke /indexes-install"
    log_info "The skill should detect docs/ as a candidate and walk the bootstrap flow"
    ;;
  *)
    log_error "Unknown scenario: $SELECTED_OPTION"
    ;;
  esac
}
