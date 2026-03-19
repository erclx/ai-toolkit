#!/bin/bash
set -e
set -o pipefail

use_config() {
  export SANDBOX_SKIP_AUTO_COMMIT="true"
}

stage_setup() {
  mkdir -p .claude

  cat <<'EOF' >.claude/TASKS.md
# Tasks

Track what is being built and why, at the level of features and outcomes.

Two sections only: Up next and Done. When completing a task, append it at the bottom of Done (newest last). When Done exceeds 10 entries, move the oldest to `.claude/TASKS-ARCHIVE.md`. Run `/tasks:flush` to move completed items and archive overflow.

## Up next

### Feature: auth

- [x] Add login flow
- [x] Add logout handler
- **Test strategy: unit**: auth logic

### Feature: api

- [x] Add rate limiting
- [x] Add pagination
- **Test strategy: unit**: api handlers

### Feature: notifications

- [ ] Add email alerts
- [ ] Add in-app notifications
- **Test strategy: unit**: notification handlers

## Done

### Feature: setup

- [x] Init project structure
- **Test strategy: none**: visual verification

### Feature: design

- [x] Configure design tokens
- **Test strategy: none**: visual verification

### Feature: storage

- [x] Define data schemas
- **Test strategy: unit**: schema validation

### Feature: ui

- [x] Build prompt list component
- **Test strategy: unit**: component logic

### Feature: options

- [x] Scaffold options page
- **Test strategy: unit**: form logic

### Feature: content

- [x] Detect chat inputs
- **Test strategy: integration**: real DOM

### Feature: dropdown

- [x] Inject dropdown UI
- **Test strategy: integration**: keyboard interaction

### Feature: insertion

- [x] Insert prompt at cursor
- **Test strategy: integration**: insertion logic

### Feature: icons

- [x] Add extension icons
- **Test strategy: none**: visual verification

### Feature: export

- [x] Export prompts as JSON
- **Test strategy: unit**: parse logic
EOF

  git add . && git commit -m "chore(tasks): seed tasks with completed items" -q

  log_step "Scenario ready: 2 completed feature blocks in Up next, Done at 10 entries"
  log_info "Context: auth and api fully done in Up next; Done at cap with setup and design as oldest"
  log_info "Action:  gemini tasks:flush"
  log_info "Expect:  auth and api moved to Done; setup and design archived to TASKS-ARCHIVE.md"
}
