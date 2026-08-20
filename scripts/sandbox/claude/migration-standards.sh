#!/usr/bin/env bash
set -e
set -o pipefail

source "$PROJECT_ROOT/scripts/lib/sandbox-fixtures.sh"

use_config() {
  export SANDBOX_SKIP_AUTO_COMMIT="true"
  export SANDBOX_INJECT_SEEDS="true"
}

stage_setup() {
  select_or_route_scenario "Which scenario?" "root-layout"

  case "$SELECTED_OPTION" in
  "root-layout")
    stage_toolkit_markdown "$PROJECT_ROOT/snippets" snippets 3

    # Two files the project wrote, sitting in the same folder as the three the
    # toolkit installed. The report counts three and a folder listing counts
    # five, which is the one place the two detection paths disagree in output a
    # reader can see.
    cat <<'EOF' >snippets/api-conventions.md
# API conventions

Route handlers return a discriminated union rather than throwing.
EOF
    cat <<'EOF' >snippets/deploy-checklist.md
# Deploy checklist

Run the migration before promoting the build.
EOF

    # A root `standards/` folder the skill must leave alone. No corpus installs
    # there any more, so every file in it is the project's own and a proposal
    # naming it would move work nothing installed.
    mkdir -p standards
    cat <<'EOF' >standards/house-style.md
# House style

Prose here is the project's own, installed by nothing.
EOF

    mkdir -p docs
    cat <<'EOF' >docs/contributing.md
# Contributing

Open every change with the alignment prompt in `snippets/align.md`.
EOF

    printf '\n## Snippets\n\nOpen a review with `snippets/align.md`.\n' >>CLAUDE.md

    git add . && git commit -m "chore(sandbox): root-layout project with author-owned references" --no-verify -q

    log_step "Scenario ready: migration-standards on a project that never migrated"
    log_info "Context: snippets/ at the root, nothing under .claude/"
    log_info "  snippets/ holds 3 toolkit files and 2 the project wrote"
    log_info "  standards/ holds 1 project file the skill must not propose moving"
    log_info "  CLAUDE.md and docs/contributing.md each cite a root path"
    log_info "Action:  /aitk:migration-standards"
    log_info "Expect:  proposes the snippets git mv, reports 3 files for snippets,"
    log_info "         leaves standards/ alone, and surfaces both author-owned"
    log_info "         references as TODO lines"
    log_info "Assert:  declared in fixtures/claude/migration-standards/root-layout/expect.toml"
    ;;
  *)
    log_error "Unknown scenario: $SELECTED_OPTION"
    ;;
  esac
}
