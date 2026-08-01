#!/usr/bin/env bash
set -e
set -o pipefail

use_config() {
  export SANDBOX_SKIP_AUTO_COMMIT="true"
}

stage_setup() {
  select_or_route_scenario "Which scenario?" "fresh" "installed"

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
    ;;
  "installed")
    mkdir -p .claude/standards
    local src_standards="$PROJECT_ROOT/standards"
    while IFS= read -r file; do
      local filename
      filename=$(basename "$file")
      cp "$file" ".claude/standards/$filename"
      echo "<!-- stale -->" >>".claude/standards/$filename"
    done < <(find "$src_standards" -type f -name "*.md" ! -name "index.md" | sort | head -n 2)
    cp "$src_standards/index.md" .claude/standards/index.md

    git add . && git commit -m "chore(sandbox): project with stale standards for toolkit-operator" --no-verify -q

    log_step "Scenario ready: toolkit-operator skill on a project with installed standards"
    log_info "Context: .claude/standards/ present with two stale files"
    log_info "Action:  /aitk:toolkit-operator then 'sync my standards'"
    log_info "Expect:  orients via aitk docs, reads catalogs, routes to aitk standards sync"
    ;;
  *)
    log_error "Unknown scenario: $SELECTED_OPTION"
    ;;
  esac
}
