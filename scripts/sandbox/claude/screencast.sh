#!/bin/bash
set -e
set -o pipefail

use_config() {
  export SANDBOX_SKIP_AUTO_COMMIT="true"
  export SANDBOX_INJECT_SEEDS="true"
}

stage_setup() {
  select_or_route_scenario "Which scenario?" "with-context" "bare"

  case "$SELECTED_OPTION" in
  "with-context")
    cat <<'EOF' >CLAUDE.md
# Notes App

Markdown note-taking app. v2 launch adds inline edit on click.
EOF

    mkdir -p .claude
    cat <<'EOF' >.claude/REQUIREMENTS.md
# Requirements

## Audience

Power users evaluating note-taking tools.

## v2 scope

- Inline edit on click, no modal
- Save indicator per note
- Keyboard nav across the note list
EOF

    cat <<'EOF' >.claude/TASKS.md
# Tasks

### Record v2 launch screencast

Walk through the inline edit flow end to end. The hero moment is save-on-blur with the indicator updating in place under 400ms.

- [ ] Outcome: 75-90s recording covering click -> edit -> save indicator
- [ ] Outcome: distribution to social and canonical hosts
EOF

    git add . && git commit -m "feat(notes): v2 scope notes" --no-verify -q

    log_step "Scenario ready: screencast draft (with project context)"
    log_info "Context: notes app v2 launch with REQUIREMENTS, TASKS, and CLAUDE.md present"
    log_info "Action:  /claude-screencast 'v2 inline edit launch'"
    log_info "Expect:  4 discovery questions with seeded defaults, then draft to .claude/.tmp/screencast/<slug>.md with 8 sections and 5 pre-seeded beats"
    ;;
  "bare")
    cat <<'EOF' >README.md
# My Tool

A small CLI for organizing notes.
EOF

    git add . && git commit -m "chore: initial state" --no-verify -q

    log_step "Scenario ready: screencast draft (no project context)"
    log_info "Context: bare repo, no CLAUDE.md or TASKS.md"
    log_info "Action:  /claude-screencast 'cli onboarding walkthrough'"
    log_info "Expect:  discovery falls back to generic defaults, draft still written, no software or font names appear"
    ;;
  *)
    log_error "Unknown scenario: $SELECTED_OPTION"
    ;;
  esac
}
