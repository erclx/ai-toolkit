#!/usr/bin/env bash
set -e
set -o pipefail

source "$PROJECT_ROOT/scripts/lib/sandbox-fixtures.sh"

use_config() {
  export SANDBOX_SKIP_AUTO_COMMIT="true"
  export SANDBOX_INJECT_SEEDS="true"
}

stage_setup() {
  select_or_route_scenario "Which scenario?" "drift" "context-entries" "wireframe-coverage" "anchor-sweep" "board-sweep" "receipt-sweep"

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
    log_info "The narration drives the ARCHITECTURE.md and REQUIREMENTS.md rewrites only."
    log_info "Task marking reads the diff, so it must land whether or not you narrate."
    log_info ""
    log_info "Action:  /claude-docs"
    log_info "Expect:  declared in fixtures/claude/docs/drift/expect.toml"
    log_info "         Check it with: canon sandbox check claude:docs drift"
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
    log_info "         Outputs a reminder line to run canon indexes regen"
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
  "anchor-sweep")
    # The fixture record overwrites the seeded .claude/ARCHITECTURE.md in place.
    # No delete first, unlike an arm keying on a path entering the tree: nothing here keys on the file
    # being added, so the branch diff is the same either way.
    stage_fixtures claude docs anchor-sweep 01-initial
    # `git init` runs without `-b`, so the baseline branch follows the machine's
    # init.defaultBranch. The sweep resolves its diff against `main` by name, and
    # on a machine naming it otherwise the baseline comes out unusable, the
    # fallback set is empty because everything is committed, and Step 6 skips.
    git branch -M main
    git add -A && git commit -m "feat(gov): install rules into a target project" --no-verify -q

    git checkout -b feat/widen-the-catalog -q
    stage_fixtures claude docs anchor-sweep 02-widen
    git add . && git commit -m "feat(gov): widen the bundled catalog and scope sync to a stack" --no-verify -q

    log_step "Scenario ready: docs architecture anchor sweep"
    log_info "Context: the branch moves a number three decisions cite, two anchored and one not"
    log_info "  The install decision is anchored and cites src/gov/install.ts, which goes from 4 rules to 6"
    log_info "  The drift decision cites src/gov/sync.ts, which this branch also edits, and carries no anchor"
    log_info "  The planner decision is anchored and cites src/gov/plan.ts, which this branch never touches"
    log_info "  The one-file decision is anchored and cites CLAUDE.md, a root file going from 2 rules to 4"
    log_info ""
    log_info "Narrate nothing about the catalog. The arm fails if the sweep only"
    log_info "reaches an entry the prompt named, and it fails the other way if it"
    log_info "flags the unanchored entry or the entry no signal points at."
    log_info ""
    log_info "Action:  /claude-docs"
    log_info "Expect:  declared in fixtures/claude/docs/anchor-sweep/expect.toml"
    log_info "         Check it with: canon sandbox check claude:docs anchor-sweep"
    log_info "         Two reported entries, and .claude/ARCHITECTURE.md unwritten:"
    log_info "         no anchor refreshed, none added, no claim edited beside one"
    log_info "         Two expectations need a reader and report as unchecked."
    ;;
  "board-sweep")
    stage_fixtures claude docs board-sweep 01-initial
    git add . && git commit -m "feat(api): rate limit the task endpoints" --no-verify -q

    stage_fixtures claude docs board-sweep 02-pagination
    git add . && git commit -m "feat(api): paginate the task list" --no-verify -q

    stage_fixtures claude docs board-sweep 03-plans

    log_step "Scenario ready: plans sweep reaches a task the session never touched"
    log_info "Context: three tasks on the board, each citing a plan in .claude/plans/"
    log_info "  v02.0-pagination.md has open outcomes that HEAD ships, so this run closes it"
    log_info "  v01.0-rate-limit.md is already all [x], closed by an earlier session"
    log_info "  That earlier run never swept its plan, which is the defect this arm reproduces"
    log_info "  v03.0-search.md is the control. Its outcomes stay open and its plan must survive."
    log_info ""
    log_info "Narrate nothing about rate limiting. The arm fails if the sweep only"
    log_info "reaches the task the session or the prompt put in front of it, and it"
    log_info "fails the other way if the sweep archives the control's plan too."
    log_info ""
    log_info "Action:  /claude-docs"
    log_info "Expect:  declared in fixtures/claude/docs/board-sweep/expect.toml"
    log_info "         Check it with: canon sandbox check claude:docs board-sweep"
    log_info "         Two plans archived, two Plan: lines retargeted, the control untouched"
    log_info "         Runs under the default turn cap. A clean run cost 28 on 2026-07-31."
    ;;
  "receipt-sweep")
    stage_fixtures claude docs receipt-sweep 01-initial
    git add . && git commit -m "feat(notify): send a notification to one recipient" --no-verify -q

    stage_fixtures claude docs receipt-sweep 02-notify
    git add . && git commit -m "feat(notify): retry a delivery until the budget is spent" --no-verify -q

    stage_fixtures claude docs receipt-sweep 03-receipts

    log_step "Scenario ready: review sweep collects a resolved memory receipt"
    log_info "Context: two memory-review receipts in .claude/review/, neither named for this branch"
    log_info "  memory-review-legacy-inbox.md has every item decided, so it is collected"
    log_info "  Its two skips are the fold: one feedback entry takes a decline, one reference entry does not"
    log_info "  memory-review-stale-pen.md still carries a 📝 item and is the control. It must survive."
    log_info "  Neither slug matches the branch, which is what a slug-keyed sweep fails on"
    log_info ""
    log_info "Narrate nothing about the receipts. The arm fails if the sweep only"
    log_info "reaches a receipt named for the current branch, and it fails the other"
    log_info "way if it deletes the control or writes a decline onto the reference entry."
    log_info ""
    log_info "Action:  /claude-docs"
    log_info "Expect:  declared in fixtures/claude/docs/receipt-sweep/expect.toml"
    log_info "         Check it with: canon sandbox check claude:docs receipt-sweep"
    log_info "         One receipt deleted, one decline folded into a **Why:** line, the control untouched"
    log_info "         One expectation needs a reader and reports as unchecked."
    ;;
  *)
    log_error "Unknown scenario: $SELECTED_OPTION"
    ;;
  esac
}
