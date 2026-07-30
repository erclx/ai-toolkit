#!/usr/bin/env bash
set -e
set -o pipefail

source "$PROJECT_ROOT/scripts/lib/sandbox-fixtures.sh"

use_config() {
  export SANDBOX_SKIP_AUTO_COMMIT="true"
  export SANDBOX_INJECT_SEEDS="true"
}

stage_setup() {
  select_or_route_scenario "Which scenario?" "drift" "context-entries" "wireframe-coverage"

  case "$SELECTED_OPTION" in
  "drift")
    stage_fixtures claude docs drift 01-initial
    git add . && git commit -m "feat(api): initial task endpoints" --no-verify -q

    stage_fixtures claude docs drift 02-postgres
    git add . && git commit -m "feat(api): migrate storage to Postgres and scope tasks to users" --no-verify -q

    stage_fixtures claude docs drift 03-plans

    log_step "Scenario ready: docs drift after a session pivot"
    log_info "Context: planning docs are stale relative to HEAD"
    log_info "  ARCHITECTURE.md still says SQLite, but src/db.ts now uses Postgres"
    log_info "  REQUIREMENTS.md lists 'no multi-user support' as a non-goal, but createTask now takes userId"
    log_info "  .claude/tasks/ has 'Migrate storage to Postgres' open, but it shipped in HEAD"
    log_info "  .claude/plans/feature-postgres-migration.md is linked from that task and should be archived"
    log_info "  .claude/plans/feature-some-old-plan.md has no task backlink and should survive"
    log_info ""
    log_info "Before invoking the skill, narrate the pivot to Claude in chat:"
    log_info "  'We pivoted this session: switched storage from SQLite to Postgres,'"
    log_info "  'and promoted multi-user support from non-goal to in-scope.'"
    log_info ""
    log_info "Action:  /claude-docs"
    log_info "Expect:  declared in fixtures/claude/docs/drift/expect.toml"
    log_info "         Check it with: aitk sandbox check claude:docs drift"
    log_info "         Two prose expectations need a reader and report as unchecked."
    ;;
  "context-entries")
    stage_fixtures claude docs context-entries 01-initial
    git add . && git commit -m "feat(web): initial chat shell" --no-verify -q

    git checkout -b feat/provider-switch -q
    stage_fixtures claude docs context-entries 02-provider-switch
    git add . && git commit -m "feat(web): provider switch at the gate" --no-verify -q

    stage_fixtures claude docs context-entries 03-plan

    log_step "Scenario ready: docs refreshes context entry from diff"
    log_info "Context: feat/provider-switch branch with diff in src/features/chat/"
    log_info "         .claude/context/web.md already exists. Its Layer responsibilities section names src/features/chat/."
    log_info "Action:  /claude-docs"
    log_info "Expect:  Step 3 updates planning docs (none diverged here)"
    log_info "         Step 4 reads the diff, maps src/features/chat/api-key-gate.tsx to web.md (which references that path)"
    log_info "         Rewrites the relevant section of .claude/context/web.md from the diff content"
    log_info "         Does NOT create new entries (no auto-creation per design)"
    log_info "         Outputs a reminder line to run aitk indexes regen"
    ;;
  "wireframe-coverage")
    rm -f .claude/wireframes/feature-name.md
    stage_fixtures claude docs wireframe-coverage 01-initial
    git add . && git commit -m "feat(web): initial BYOK gate" --no-verify -q

    git checkout -b feat/widen-and-mock -q
    stage_fixtures claude docs wireframe-coverage 02-widen
    git add . && git commit -m "feat(web): widen BYOK to three providers and add mock demo strip" --no-verify -q

    log_step "Scenario ready: docs wireframe coverage sweep"
    log_info "Context: branch widens BYOK gate to three providers and adds a new mock demo surface"
    log_info "  .claude/wireframes/byok-gate.md still says Anthropic-only"
    log_info "  src/features/mock/MockDemoStrip.tsx has no matching wireframe surface"
    log_info ""
    log_info "Action:  /claude-docs"
    log_info "Expect:  Step 4 reports drift in .claude/wireframes/byok-gate.md (Anthropic-only contradicted)"
    log_info "         Step 4 stubs .claude/wireframes/mock-demo-strip.md with a TODO"
    log_info "         Operator resolves drift manually; auto-rewrite of prose is out of scope"
    ;;
  *)
    log_error "Unknown scenario: $SELECTED_OPTION"
    ;;
  esac
}
