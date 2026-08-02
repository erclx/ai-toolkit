#!/usr/bin/env bash
set -e
set -o pipefail

source "$PROJECT_ROOT/scripts/lib/sandbox-git.sh"

# The citation check reads the tree through `git ls-files`, so an arm that
# exercises it needs a repo. Without one the scan finds no files and reports a
# clean run, which is the false pass the arm exists to rule out.
seed_repo() {
  git init -q
  configure_sandbox_git_identity
}

write_entry() {
  local path=$1 title=$2
  mkdir -p "$(dirname "$path")"

  cat >"$path" <<ENTRY
---
title: $title
description: Narrative for the $title domain
---

# $title

## Overview

Owns the $title surface end to end.
ENTRY
}

seed_folder() {
  mkdir -p .claude/context

  cat <<'INDEX' >.claude/context/index.md
---
title: Context
subtitle: Per-domain narrative loaded on demand
---

# Context

Per-domain narrative loaded on demand

- [API](api.md): HTTP layer structure and request validation
- [Web](web.md): Client rendering and routing
INDEX

  write_entry .claude/context/api.md API
  write_entry .claude/context/web.md Web
}

list_entry() {
  local name=$1 title=$2
  printf -- '- [%s](%s): Narrative for the %s domain\n' \
    "$title" "$name" "$title" >>.claude/context/index.md
}

seed_citation() {
  mkdir -p docs
  printf 'Read `%s` before touching the routes.\n' \
    '.claude/context/api.md' >docs/onboarding.md
}

seed_stale_citation() {
  mkdir -p docs
  printf 'Read `%s` for the retrieval flow.\n' \
    '.claude/context/retrieval.md' >docs/onboarding.md
}

# Three shapes that display a path rather than pointing at one. Each is
# excluded by a different mechanism, so an arm that seeds all three fails
# loudly when any one of them regresses.
seed_illustrations() {
  mkdir -p docs scripts/sandbox/infra

  cat <<'STANDARD' >docs/prose.md
# Prose

A reference is written as inline code.

```markdown
Bad: See [.claude/context/retrieval.md](.claude/context/retrieval.md) for the flow.
Good: See `.claude/context/retrieval.md` for the flow.
```
STANDARD

  printf 'One `%s` per domain. <!-- audit-ignore-citations -->\n' \
    '.claude/context/<domain>.md' >docs/layout.md
  printf 'Names `%s` inside its own fixture tree.\n' \
    '.claude/context/pollers.md' >scripts/sandbox/infra/fake.sh
}

seed_deep_entry() {
  mkdir -p .claude/context

  {
    printf -- '---\ntitle: Deep\ndescription: An entry with one long unbroken run\n---\n\n'
    printf '# Deep\n\n## Overview\n\n'
    for i in $(seq 1 60); do printf 'Sentence %s of the run.\n' "$i"; done
    printf '\n## Peers\n\n'
    for i in $(seq 1 60); do printf -- '- Peer item %s\n' "$i"; done
  } >.claude/context/deep.md

  list_entry deep.md Deep
}

seed_tables() {
  mkdir -p .claude/context

  {
    printf -- '---\ntitle: Tables\ndescription: A growing catalog beside a fixed table\n---\n\n'
    printf '# Tables\n\n## Catalog\n\n'
    printf '| Command | Purpose |\n| --- | --- |\n'
    for i in $(seq 1 8); do printf '| `aitk thing-%s` | Does a thing |\n' "$i"; done
    printf '\n## Comparison\n\n'
    printf '| Concern | Tradeoff |\n| --- | --- |\n'
    for i in $(seq 1 8); do printf '| Concern %s | Some prose about it |\n' "$i"; done
  } >.claude/context/tables.md

  list_entry tables.md Tables
}

seed_drift() {
  seed_folder
  write_entry .claude/context/sandbox.md Sandbox
  rm .claude/context/web.md
}

run_audit() {
  local status=0
  bun "$PROJECT_ROOT/src/cli.ts" context audit "$@" || status=$?
  log_info "Exit code: $status"
}

stage_setup() {
  log_step "Context sandbox"
  log_info "clean         : a conforming folder reports no findings and exits 0"
  log_info "stale         : an unresolved citation fails the gate with exit 2"
  log_info "illustration  : fence, fixture, and marker exclusions hold"
  log_info "depth         : a long run reports and a peer list is exempt"
  log_info "tables        : a growing catalog reports, a fixed table does not"
  log_info "drift         : index and siblings disagree in both directions"
  log_info "json          : machine record on stdout, frame still on stderr"

  select_or_route_scenario "Which scenario?" \
    "clean" "stale" "illustration" "depth" "tables" "drift" "json"

  case "$SELECTED_OPTION" in
  "clean")
    seed_repo
    seed_folder
    seed_citation
    log_step "Running: aitk context audit"
    run_audit
    log_info "Expect: 2 entries, every cited path resolves, exit 0"
    log_info "Expect: no length, depth, table, or drift finding"
    ;;
  "stale")
    seed_repo
    seed_folder
    seed_stale_citation
    log_step "Running: aitk context audit --citations-only"
    run_audit --citations-only
    log_info "Expect: docs/onboarding.md flagged for retrieval.md, exit 2"
    log_info "Expect: the gate prints only the finding, with no frame above it"
    ;;
  "illustration")
    seed_repo
    seed_folder
    seed_illustrations
    log_step "Running: aitk context audit --citations-only"
    run_audit --citations-only
    log_info "Expect: silence and exit 0, since all three are illustrations"
    log_info "Expect: the fenced pair, the marked line, and the fixture excluded"
    ;;
  "depth")
    seed_repo
    seed_folder
    seed_deep_entry
    log_step "Running: aitk context audit"
    run_audit
    log_info "Expect: deep.md reports one run past the 40-line checkpoint"
    log_info "Expect: the 60-item peer list below it reports nothing"
    ;;
  "tables")
    seed_repo
    seed_folder
    seed_tables
    log_step "Running: aitk context audit"
    run_audit
    log_info "Expect: one candidate, the 8-row command catalog"
    log_info "Expect: the 8-row comparison table is not reported"
    ;;
  "drift")
    seed_repo
    seed_drift
    log_step "Running: aitk context audit"
    run_audit
    log_info "Expect: sandbox.md unlisted and web.md missing"
    log_info "Expect: exit 0, since index drift is advisory rather than gating"
    ;;
  "json")
    seed_repo
    seed_folder
    seed_citation
    log_step "Running: aitk context audit --json"
    exec bun "$PROJECT_ROOT/src/cli.ts" context audit --json
    ;;
  *)
    log_error "Unknown scenario: $SELECTED_OPTION"
    ;;
  esac
}
