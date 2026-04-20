#!/bin/bash
set -e
set -o pipefail

use_config() {
  export SANDBOX_SKIP_AUTO_COMMIT="true"
}

stage_setup() {
  log_info "fresh     : clean repo, no prior experiment notes"
  log_info "collision : .claude/.tmp/stitch/notes.md pre-seeded, guard should fire"
  select_or_route_scenario "Which scenario?" "fresh" "collision"

  case "$SELECTED_OPTION" in
  "fresh")
    mkdir -p .claude
    cat <<'EOF' >.claude/.gitignore
.tmp/
EOF

    git add . && git commit -m "chore(sandbox): seed clean repo for experiment scaffold" --no-verify -q

    log_step "Scenario ready: experiment scaffold on a clean repo"
    log_info "Context: no .claude/.tmp/ entries, no prior experiments"
    log_info "Action:  /toolkit:experiment stitch"
    log_info "Expect:  .claude/.tmp/stitch/notes.md created, .claude/.tmp/stitch/evidence/ created,"
    log_info "         template body carries the ?-until-verified blockquote header and all seven phases"
    ;;
  "collision")
    mkdir -p .claude/.tmp/stitch/evidence
    cat <<'EOF' >.claude/.tmp/stitch/notes.md
# stitch experiment notes

> sentinel: existing notes, should not be overwritten
EOF

    cat <<'EOF' >.claude/.gitignore
.tmp/
EOF

    git add .claude/.gitignore && git commit -m "chore(sandbox): seed prior experiment notes for collision guard" --no-verify -q

    log_step "Scenario ready: experiment scaffold collision guard"
    log_info "Context: .claude/.tmp/stitch/notes.md already exists with sentinel content"
    log_info "Action:  /toolkit:experiment stitch"
    log_info "Expect:  guard fires with ❌ message, sentinel content untouched"
    ;;
  *)
    log_error "Unknown scenario: $SELECTED_OPTION"
    ;;
  esac
}
