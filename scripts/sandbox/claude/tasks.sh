#!/usr/bin/env bash
set -e
set -o pipefail

source "$PROJECT_ROOT/scripts/lib/sandbox-fixtures.sh"

use_config() {
  export SANDBOX_SKIP_AUTO_COMMIT="true"
  export SANDBOX_INJECT_SEEDS="true"
}

stage_setup() {
  log_info "create  : board with three tasks and an unlinked plan, no task for it yet"
  log_info "archive : board with one shipped task and one still open"

  select_or_route_scenario "Which scenario?" "create" "archive"

  case "$SELECTED_OPTION" in
  "create")
    stage_fixtures claude tasks create 01-initial
    git add . && git commit -m "feat(api): serve the task list" --no-verify -q

    log_step "Scenario ready: a task written onto a board that already has three"
    log_info "Context: .canon/tasks/ carries v01.0, v02.0, and v03.0 with no gaps"
    log_info "  .canon/plans/feature-csv-export.md exists and no task cites it"
    log_info "  The labels are contiguous, so the next one the board admits is v04.0"
    log_info ""
    log_info "Action:  /canon:task-board create a task for the CSV export endpoint,"
    log_info "         from the plan at .canon/plans/feature-csv-export.md"
    log_info "Expect:  declared in fixtures/claude/tasks/create/expect.toml"
    log_info "         Check it with: canon sandbox check claude:tasks create"
    log_info "         A v04.0 task carrying both frontmatter fields, a Plan: link"
    log_info "         relative to the board, an open outcome, and a test strategy."
    log_info "         The label is proposed from the board, not from a version file."
    log_info "         The three existing tasks survive untouched."
    log_info "         Two expectations need a reader and report as unchecked."
    ;;
  "archive")
    stage_fixtures claude tasks archive 01-initial
    git add . && git commit -m "feat(api): serve the task list" --no-verify -q

    stage_fixtures claude tasks archive 02-rate-limit
    git add . && git commit -m "feat(api): rate limit the task endpoints (#41)" --no-verify -q

    log_step "Scenario ready: one shipped task archived off a two-task board"
    log_info "Context: v01.0-rate-limit is all [x], names pull request #41, and its"
    log_info "  Plan: line points at a live .canon/plans/feature-rate-limit.md that"
    log_info "  no other task cites, so the archive carries the plan across with it"
    log_info "  HEAD carries the shipped work under a subject naming #41"
    log_info "  v02.0-pagination is the control. Its outcomes stay open, and both it"
    log_info "  and its live plan must end the run where they started."
    log_info ""
    log_info "The sandbox has no remote, so the work-reached-main check resolves"
    log_info "from the Pull request: line and the local log rather than origin/main."
    log_info ""
    log_info "Action:  /canon:task-board archive v01.0-rate-limit"
    log_info "Expect:  declared in fixtures/claude/tasks/archive/expect.toml"
    log_info "         Check it with: canon sandbox check claude:tasks archive"
    log_info "         The task moved under .canon/tasks/archive/ and its plan"
    log_info "         under .canon/plans/archive/, the archived task's Plan: line"
    log_info "         retargeted a folder deeper, its ordering row cleared, and"
    log_info "         the control and its plan left where they were."
    log_info "         Two expectations need a reader and report as unchecked."
    ;;
  *)
    log_error "Unknown scenario: $SELECTED_OPTION"
    ;;
  esac
}
