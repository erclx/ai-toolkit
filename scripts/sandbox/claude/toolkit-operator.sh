#!/usr/bin/env bash
set -e
set -o pipefail

source "$PROJECT_ROOT/scripts/lib/sandbox-fixtures.sh"

use_config() {
  export SANDBOX_SKIP_AUTO_COMMIT="true"
}

stage_setup() {
  select_or_route_scenario "Which scenario?" "fresh" "installed" "unmigrated" "audits" "gitignore"

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
  "audits")
    mkdir -p .claude/context .claude/plans
    cat <<'EOF' >.claude/context/billing.md
---
title: Billing
description: Subscription state, the invoice job, and the two retry paths
---

# Billing

## Overview

Subscriptions renew nightly and the invoice job writes one row per renewal.
EOF
    cat <<'EOF' >.claude/context/index.md
---
title: Context
description: Per-domain narrative loaded on demand
---

# Context

- [Billing](billing.md): subscription state and the invoice job
EOF
    cat <<'EOF' >.claude/plans/feature-invoice-retry.md
# Feature: Invoice retry

The invoice job drops a renewal when the payment provider times out.

## Summary

- Retry a timed-out renewal once before the job records it as failed.
EOF
    cat <<'EOF' >package.json
{
  "name": "sandbox-operator-audits",
  "version": "1.0.0",
  "private": true,
  "type": "module"
}
EOF

    # The arm scores which audits are offered, so it stages the surfaces two of
    # the four read and none of the surface the third reads. A tree carrying
    # source anywhere would make an offer of every audit indistinguishable from
    # a correct one conditioned on what is present. The test matches the two
    # languages `aitk comments scan` measures rather than a conventional source
    # folder, since the offer turns on the files rather than on their location.
    local sources
    sources=$(find . -path ./.git -prune -o -type f \( -name "*.ts" -o -name "*.sh" \) -print | wc -l | tr -d ' ')
    if [ "$sources" -ne 0 ]; then
      log_error "Fixture staged $sources source files. The arm cannot score a comments-scan offer it did not withhold."
      return 1
    fi

    git add . && git commit -m "chore(sandbox): context and plans without source for toolkit-operator" --no-verify -q

    log_step "Scenario ready: toolkit-operator skill on a target carrying two of four audit surfaces"
    log_info "Context: .claude/context/ and .claude/plans/ present, no TypeScript or shell source"
    log_info "Action:  /aitk:toolkit-operator then 'what can you measure about this project'"
    log_info "Expect:  offers the context and records audits, withholds the comment scan"
    log_info "Assert:  declared in fixtures/claude/toolkit-operator/audits/expect.toml"
    ;;
  "gitignore")
    cat <<'EOF' >package.json
{
  "name": "sandbox-operator-gitignore",
  "version": "1.0.0",
  "private": true,
  "type": "module"
}
EOF
    cp .gitignore .gitignore.pre
    AITK_NON_INTERACTIVE=1 bun "$PROJECT_ROOT/src/cli.ts" tooling inject base . >/dev/null

    # The row this arm scores reads the leaf off the recorded chain. Without the
    # stamp the operator correctly reports the chain as unrecorded, and the
    # failure would read as a defect in the skill rather than in the fixture.
    if ! grep -q '"chain"' .claude/aitk.json 2>/dev/null; then
      log_error "Fixture recorded no stack chain. The arm would score a row with nothing to read."
      return 1
    fi

    # Restores the file to what provisioning wrote before the inject, which is
    # the drift the ignore-only mode exists to close. Truncating instead would
    # drop the sandbox's own entries too, leaving `node_modules` tracked. The
    # configs, seeds, and manifest edits stay, so a run reaching for a full sync
    # rewrites more than it was asked to.
    mv .gitignore.pre .gitignore

    git add . && git commit -m "chore(sandbox): stacked project with emptied gitignore for toolkit-operator" --no-verify -q

    log_step "Scenario ready: toolkit-operator skill on a stacked project missing its ignore entries"
    log_info "Context: base stack installed and stamped, .gitignore emptied"
    log_info "Action:  /aitk:toolkit-operator then 'my gitignore is missing the toolkit entries'"
    log_info "Expect:  reads base off the recorded chain, routes to aitk tooling inject --gitignore"
    log_info "Assert:  declared in fixtures/claude/toolkit-operator/gitignore/expect.toml"
    ;;
  *)
    log_error "Unknown scenario: $SELECTED_OPTION"
    ;;
  esac
}
