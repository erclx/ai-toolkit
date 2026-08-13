#!/usr/bin/env bash
set -e
set -o pipefail

use_config() {
  export SANDBOX_SKIP_AUTO_COMMIT="true"
  export SANDBOX_INJECT_SEEDS="true"
}

stage_setup() {
  log_info "matched-plan : branch foo + matching plan, skill picks foo without prompting"
  log_info "multi-plan   : default branch + two plans, skill falls to tier 3 and asks which plan"
  log_info "branch-only  : branch bar + no plans, skill uses bar"
  log_info "typed-branch : branch feat/baz + matching plan, target collides and the skill stops before entry"
  log_info "no-deps      : branch qux + matching plan + a manifest with nothing installed, skill reports the install command"
  select_or_route_scenario "Which scenario?" "matched-plan" "multi-plan" "branch-only" "typed-branch" "no-deps"

  mkdir -p .claude/plans

  case "$SELECTED_OPTION" in
  "matched-plan")
    cat <<'EOF' >.claude/plans/feature-foo.md
# Feature: foo

Stub plan seeded for the matched-plan tier. Exercises name derivation when the current branch has a same-name plan file.
EOF

    git add . && git commit -m "feat(plans): seed foo plan" --no-verify -q
    git checkout -b foo -q

    log_step "Scenario ready: matched-plan tier (Step 2, tier 1)"
    log_info "Branch: foo"
    log_info "Plan:   .claude/plans/feature-foo.md"
    log_info "Action:  /aitk:claude-worktree"
    log_info "Expect:  skill derives foo from tier 1, no prompt"
    log_info "         worktree at .claude/worktrees/foo/, branch feat/foo post-rename"
    ;;
  "multi-plan")
    cat <<'EOF' >.claude/plans/feature-alpha.md
# Feature: alpha

Stub plan A. Seeded for the multi-plan tier.
EOF

    cat <<'EOF' >.claude/plans/feature-bravo.md
# Feature: bravo

Stub plan B. Seeded for the multi-plan tier.
EOF

    git add . && git commit -m "feat(plans): seed alpha and bravo plans" --no-verify -q

    log_step "Scenario ready: multi-plan tier (Step 2, tier 3)"
    log_info "Branch: default"
    log_info "Plans:  feature-alpha.md, feature-bravo.md"
    log_info "Action:  /aitk:claude-worktree"
    log_info "Expect:  skill falls to tier 3 and asks which plan"
    log_info "         respond with alpha or bravo to pick the slug"
    ;;
  "branch-only")
    git checkout -b bar -q

    log_step "Scenario ready: branch-only tier (Step 2, tier 4)"
    log_info "Branch: bar"
    log_info "Plans:  none"
    log_info "Action:  /aitk:claude-worktree"
    log_info "Expect:  skill falls to tier 4 and uses bar"
    log_info "         worktree at .claude/worktrees/bar/, branch feat/bar post-rename"
    ;;
  "typed-branch")
    cat <<'EOF' >.claude/plans/feature-baz.md
# Feature: baz

Stub plan seeded for the collision arm. The branch executing it already exists under its conventional name.
EOF

    git add . && git commit -m "feat(plans): seed baz plan" --no-verify -q
    git checkout -b feat/baz -q

    log_step "Scenario ready: target collision (Step 2)"
    log_info "Branch: feat/baz"
    log_info "Plan:   .claude/plans/feature-baz.md"
    log_info "Action:  /aitk:claude-worktree"
    log_info "Expect:  slug transform drops the type, so tier 1 derives baz"
    log_info "         target feat/baz already exists, so Step 2 stops"
    log_info "         no worktree is created and the existing branch is left alone"
    ;;
  "no-deps")
    cat <<'EOF' >.claude/plans/feature-qux.md
# Feature: qux

Stub plan seeded for the dependency report. The project declares a manifest and has never installed against it.
EOF

    cat <<'EOF' >package.json
{
  "name": "qux",
  "version": "0.1.0",
  "private": true
}
EOF

    git add . && git commit -m "feat(plans): seed qux plan and manifest" --no-verify -q
    git checkout -b qux -q

    log_step "Scenario ready: dependency report (Step 6)"
    log_info "Branch: qux"
    log_info "Plan:   .claude/plans/feature-qux.md"
    log_info "Action:  /aitk:claude-worktree"
    log_info "Expect:  entry proceeds, then Step 6 reports one line"
    log_info "         package.json present and node_modules missing, so it names bun install"
    log_info "         nothing is installed, since the step reports rather than runs"
    ;;
  *)
    log_error "Unknown scenario: $SELECTED_OPTION"
    ;;
  esac

  log_info ""
  log_info "Cleanup: run 'aitk sandbox clean' after the test to wipe the worktree and its branch refs."
}
