#!/usr/bin/env bash
set -e
set -o pipefail

use_config() {
  export SANDBOX_SKIP_AUTO_COMMIT="true"
  export SANDBOX_INJECT_SEEDS="true"
}

stage_setup() {
  select_or_route_scenario "Which scenario?" "draft" "update"

  case "$SELECTED_OPTION" in
  "draft")
    cat <<'EOF' >CLAUDE.md
# Habit Tracker

Local-first habit tracking web app.

## Commands

- `bun run check`: lint and typecheck
EOF

    mkdir -p .claude
    cat <<'EOF' >.claude/REQUIREMENTS.md
# Requirements

## Problem

People lose habit streaks because logging is friction. Make logging one tap and make progress visible.

## Goals

- Log a habit in one action
- See streaks and trends at a glance
- Work offline, sync later

## MVP features

1. Log entry: mark a habit done for today with one tap
2. Streak view: show current and longest streak per habit
3. Trend chart: weekly and monthly completion chart, reads from logged entries
4. Offline sync: queue entries offline and reconcile on reconnect
5. Reminders: local notification per habit at a chosen time

## Tech stack

- Vite, React, TypeScript
- IndexedDB for local storage

## Constraints

- No account required for the core loop
EOF

    git add . && git commit -m "docs(project): initial requirements" --no-verify -q

    log_step "Scenario ready: roadmap draft (no existing roadmap)"
    log_info "Context: REQUIREMENTS.md with five MVP features, no .claude/ROADMAP.md yet"
    log_info "Action:  /claude-roadmap"
    log_info "Expect:  .claude/ROADMAP.md written, features grouped into sequenced versions"
    log_info "         streak/trend ordered after log entry (they consume its data), offline sync de-risked early"
    log_info "         no task-level steps or file lists in the output"
    ;;
  "update")
    cat <<'EOF' >CLAUDE.md
# Habit Tracker

Local-first habit tracking web app.

## Commands

- `bun run check`: lint and typecheck
EOF

    mkdir -p .claude
    cat <<'EOF' >.claude/REQUIREMENTS.md
# Requirements

## MVP features

1. Log entry: mark a habit done for today with one tap
2. Streak view: show current and longest streak per habit
3. Trend chart: weekly and monthly completion chart
4. Shared habits: invite another person to a shared habit and see both streaks
EOF

    cat <<'EOF' >.claude/ROADMAP.md
# Roadmap

| Version | Status | Outcome | Features | Depends on |
| ------- | ------ | ------- | -------- | ---------- |
| v0.1 | Now | Log a habit and see the streak | Log entry, Streak view | none |
| v0.2 | Next | See completion trends over time | Trend chart | v0.1, for the logged entries |
EOF

    git add . && git commit -m "docs(project): roadmap through v0.2" --no-verify -q

    log_step "Scenario ready: roadmap update (new requirement added)"
    log_info "Context: existing ROADMAP.md through v0.2, a new 'Shared habits' feature added to REQUIREMENTS.md"
    log_info "Action:  /claude-roadmap"
    log_info "Expect:  v0.1 and v0.2 blocks preserved, a new sequenced version added for shared habits"
    log_info "         output names which versions changed"
    ;;
  *)
    log_error "Unknown scenario: $SELECTED_OPTION"
    ;;
  esac
}
