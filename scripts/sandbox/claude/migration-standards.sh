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
    stage_toolkit_markdown "$PROJECT_ROOT/standards" standards 3
    stage_toolkit_markdown "$PROJECT_ROOT/snippets" snippets 2

    # Two files the project wrote, sitting in the same folder as the three the
    # toolkit installed. The report counts three and a folder listing counts
    # five, which is the one place the two detection paths disagree in output a
    # reader can see.
    cat <<'EOF' >standards/api-conventions.md
# API conventions

Route handlers return a discriminated union rather than throwing.
EOF
    cat <<'EOF' >standards/deploy-checklist.md
# Deploy checklist

Run the migration before promoting the build.
EOF

    mkdir -p docs
    cat <<'EOF' >docs/contributing.md
# Contributing

Open every change with the alignment prompt in `snippets/align.md`.
EOF

    printf '\n## Context entries\n\nFollow `standards/context.md` when writing one.\n' >>CLAUDE.md

    git add . && git commit -m "chore(sandbox): root-layout project with author-owned references" --no-verify -q

    log_step "Scenario ready: migration-standards on a project that never migrated"
    log_info "Context: standards/ and snippets/ at the root, nothing under .claude/"
    log_info "  standards/ holds 3 toolkit files and 2 the project wrote"
    log_info "  snippets/ holds 2 toolkit files"
    log_info "  CLAUDE.md and docs/contributing.md each cite a root path"
    log_info "Action:  /aitk:migration-standards"
    log_info "Expect:  proposes both git mv commands, reports 3 files for standards"
    log_info "         and surfaces both author-owned references as TODO lines"
    log_info "Assert:  declared in fixtures/claude/migration-standards/root-layout/expect.toml"
    ;;
  *)
    log_error "Unknown scenario: $SELECTED_OPTION"
    ;;
  esac
}
