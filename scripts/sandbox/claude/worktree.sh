#!/bin/bash
set -e
set -o pipefail

use_config() {
  export SANDBOX_SKIP_AUTO_COMMIT="true"
  export SANDBOX_INJECT_SEEDS="true"
}

stage_setup() {
  log_info "matched-plan : branch feat/foo + matching plan, skill picks feat-foo without prompting"
  log_info "multi-plan   : default branch + two plans, skill falls to tier 3 and asks which plan"
  log_info "branch-only  : branch feat/bar + no plans, skill uses feat-bar"
  select_or_route_scenario "Which scenario?" "matched-plan" "multi-plan" "branch-only"

  mkdir -p .claude/plans

  case "$SELECTED_OPTION" in
  "matched-plan")
    cat <<'EOF' >.claude/plans/feature-feat-foo.md
# Feature: feat-foo

Stub plan seeded for the matched-plan tier. Exercises name derivation when the current branch has a same-name plan file.
EOF

    git add . && git commit -m "feat(plans): seed feat-foo plan" --no-verify -q
    git checkout -b feat/foo -q

    log_step "Scenario ready: matched-plan tier (Step 2, tier 1)"
    log_info "Branch: feat/foo"
    log_info "Plan:   .claude/plans/feature-feat-foo.md"
    log_info "Action:  /toolkit:claude-worktree"
    log_info "Expect:  skill derives feat-foo from tier 1, no prompt"
    log_info "         worktree at .claude/worktrees/feat-foo/, branch feat-foo post-rename"
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
    log_info "Action:  /toolkit:claude-worktree"
    log_info "Expect:  skill falls to tier 3 and asks which plan"
    log_info "         respond with alpha or bravo to pick the slug"
    ;;
  "branch-only")
    git checkout -b feat/bar -q

    log_step "Scenario ready: branch-only tier (Step 2, tier 4)"
    log_info "Branch: feat/bar"
    log_info "Plans:  none"
    log_info "Action:  /toolkit:claude-worktree"
    log_info "Expect:  skill falls to tier 4 and uses feat-bar"
    log_info "         worktree at .claude/worktrees/feat-bar/, branch feat-bar post-rename"
    ;;
  *)
    log_error "Unknown scenario: $SELECTED_OPTION"
    ;;
  esac

  log_info ""
  log_info "Cleanup: run 'aitk sandbox clean' after the test to wipe the worktree and its branch refs."
}
