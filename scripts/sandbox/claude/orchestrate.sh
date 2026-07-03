#!/usr/bin/env bash
set -e
set -o pipefail

use_config() {
  export SANDBOX_SKIP_AUTO_COMMIT="true"
}

stage_setup() {
  cat <<'EOF' >CLAUDE.md
# Habit Tracker

Local-first habit tracking web app.

## Commands

- `bun run check`: lint and typecheck
EOF

  mkdir -p .claude/plans
  cat <<'EOF' >.claude/REQUIREMENTS.md
# Requirements

## MVP features

1. Log entry: mark a habit done for today with one tap
2. Streak view: show current and longest streak per habit
3. Trend chart: weekly and monthly completion chart
EOF

  cat <<'EOF' >.claude/ROADMAP.md
# Roadmap

| Version | Status | Outcome | Features | Depends on |
| ------- | ------ | ------- | -------- | ---------- |
| v0.1 | Now | Log a habit and see the streak | Log entry, Streak view | none |
| v0.2 | Next | See completion trends over time | Trend chart | v0.1, for the logged entries |
EOF

  cat <<'EOF' >.claude/TASKS.md
# Tasks

## Up next

### v0.1: Log a habit with one tap

- [ ] Outcome: tapping a habit marks it done for today
- [ ] Outcome: a second tap the same day is a no-op

> Test strategy: component, tap toggles done state once per day
EOF

  cat <<'EOF' >.claude/plans/feature-log-entry.md
# Feature: log entry

Mark a habit done for today with one tap, idempotent per day.

**Files to touch:**

- `src/log.ts`: record a dated entry, no-op on repeat

**Risks:**

None identified.

**Questions:**

None identified.
EOF

  git add . && git commit -m "docs(project): roadmap, tasks, and log-entry plan" --no-verify -q

  log_step "Scenario ready: orchestrator board readout"
  log_info "Context: ROADMAP active at v0.1, one task queued, a plan for log-entry, none for streak-view"
  log_info "Action:  /claude-orchestrate"
  log_info "Expect:  state of play: active v0.1, log-entry ready to hand to a worker (has plan),"
  log_info "         streak-view needs /claude-feature first, and a single Next action"
  log_info "         In review is omitted (no open PRs in this fixture)"
}
