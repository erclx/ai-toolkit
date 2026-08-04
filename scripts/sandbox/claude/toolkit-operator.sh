#!/usr/bin/env bash
set -e
set -o pipefail

source "$PROJECT_ROOT/scripts/lib/sandbox-fixtures.sh"

use_config() {
  export SANDBOX_SKIP_AUTO_COMMIT="true"
}

stage_setup() {
  select_or_route_scenario "Which scenario?" "fresh" "installed" "unmigrated"

  case "$SELECTED_OPTION" in
  "fresh")
    cat <<'EOF' >package.json
{
  "name": "sandbox-operator-fresh",
  "version": "1.0.0",
  "private": true,
  "type": "module"
}
EOF
    git add . && git commit -m "chore(sandbox): fresh empty project for toolkit-operator" --no-verify -q

    log_step "Scenario ready: toolkit-operator skill on an empty repo"
    log_info "Context: package.json only, toolkit not yet installed"
    log_info "Action:  /aitk:toolkit-operator then 'help me set up this project'"
    log_info "Expect:  orients via aitk docs, routes first-time scaffold to setup-init"
    log_info "Assert:  declared in fixtures/claude/toolkit-operator/fresh/expect.toml"
    ;;
  "installed")
    stage_toolkit_markdown "$PROJECT_ROOT/standards" .claude/standards 2
    while IFS= read -r file; do
      echo "<!-- stale -->" >>"$file"
    done < <(find .claude/standards -maxdepth 1 -type f -name "*.md" | sort)
    cp "$PROJECT_ROOT/standards/index.md" .claude/standards/index.md

    git add . && git commit -m "chore(sandbox): project with stale standards for toolkit-operator" --no-verify -q

    log_step "Scenario ready: toolkit-operator skill on a project with installed standards"
    log_info "Context: .claude/standards/ present with two stale files"
    log_info "Action:  /aitk:toolkit-operator then 'sync my standards'"
    log_info "Expect:  orients via aitk docs, reads catalogs, routes to aitk standards sync"
    log_info "Assert:  declared in fixtures/claude/toolkit-operator/installed/expect.toml"
    ;;
  "unmigrated")
    stage_toolkit_markdown "$PROJECT_ROOT/standards" standards 3
    stage_toolkit_markdown "$PROJECT_ROOT/snippets" snippets 3

    # The arm scores a route the report drives, so a fixture staging nothing
    # would produce a report correctly finding no unmigrated domain and the
    # failure would read as a defect in the skill rather than in the fixture.
    local staged
    staged=$(find standards snippets -maxdepth 1 -type f -name "*.md" | wc -l | tr -d ' ')
    if [ "$staged" -eq 0 ]; then
      log_error "Fixture staged no root-layout files. The arm would score a route with nothing to route."
      return 1
    fi

    git add . && git commit -m "chore(sandbox): root-layout project for toolkit-operator" --no-verify -q

    log_step "Scenario ready: toolkit-operator skill on a root-layout project"
    log_info "Context: standards/ and snippets/ at the root, nothing under .claude/"
    log_info "  $staged toolkit-owned files across the two domains"
    log_info "  This is the state three of six real targets sit in"
    log_info "Action:  /aitk:toolkit-operator then 'what is this project behind on'"
    log_info "Expect:  diagnose reports both domains as unmigrated, routes to migration-standards"
    log_info "Assert:  declared in fixtures/claude/toolkit-operator/unmigrated/expect.toml"
    ;;
  *)
    log_error "Unknown scenario: $SELECTED_OPTION"
    ;;
  esac
}
