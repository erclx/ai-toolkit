#!/usr/bin/env bash
set -e
set -o pipefail

use_config() {
  export SANDBOX_SKIP_AUTO_COMMIT="true"
}

# A record tree at whichever root the caller names, built by hand so one seeder
# serves both sides of the fallback. The arms below differ only in that argument,
# which is what keeps a difference in outcome attributable to the resolution
# rather than to two fixtures that drifted apart.
#
seed_records() {
  local root=$1 scratch=$2

  mkdir -p "$root/plans/archive" "$root/tasks" "$root/memory" "$root/$scratch"

  cat <<'PLAN' >"$root/plans/feature-live-row.md"
# Feature: A staged plan

One paragraph of intro so the plan carries a body.

## Summary

- One bullet describing the change.

**Files to touch:**

- `src/thing.ts`: the surface this would edit.

**Risks:**

- One risk, stated.

**Questions:**

1. Does this ship here?
   - Suggested: yes, since the fixture needs an answerable question.
   - Answer: yes
PLAN

  cat <<'INDEX' >"$root/tasks/index.md"
---
title: Tasks
subtitle: One file per task, ordered by phase label
---

# Tasks

One file per task, ordered by phase label
INDEX

  cat <<'TASK' >"$root/tasks/v1.1-staged-row.md"
---
title: 'v1.1: A staged row'
description: One line on what this task achieves
---

# v1.1: A staged row

Plan: [../plans/archive/feature-shipped-row.md](../plans/archive/feature-shipped-row.md)

Pull request: #1

## Outcomes

- [x] Outcome: it shipped

## Findings

- A note.
TASK

  # A second plan, already archived, is what the task points at. A live target
  # makes `tasks archive` refuse as `plan-unswept`, which is correct behavior and
  # answers nothing about which root either file resolved at. The live one beside
  # it is what gives `records validate plans` a record to count, since the walk
  # skips the archive.
  cp "$root/plans/feature-live-row.md" "$root/plans/archive/feature-shipped-row.md"

  printf 'scratch\n' >"$root/$scratch/note.txt"
}

run_cli() {
  local status=0
  bun "$PROJECT_ROOT/src/cli.ts" "$@" || status=$?
  log_info "Exit code: $status"
}

stage_setup() {
  log_step "Record root sandbox"
  log_info "migrated        : records staged at .canon/, every verb resolves there"
  log_info "unmigrated      : the same records at .claude/, the fallback's other branch"
  log_info "refusal         : neither root carries the folder, so both are named"
  log_info "migrate         : the verb moving an unmigrated tree, then re-running clean"
  log_info "migrate-refusal : the same tree with no .canon/ ignore entry to land under"

  select_or_route_scenario "Which scenario?" \
    "migrated" "unmigrated" "refusal" "migrate" "migrate-refusal"

  case "$SELECTED_OPTION" in
  "migrated")
    seed_records .canon tmp
    log_step "Running: canon records validate plans --root ."
    run_cli records validate plans --root . --json
    log_info "Expect: 1 record read, the live plan under .canon/plans"
    log_info "Expect: ok true rather than a no-folder refusal, which is the resolution"
    log_step "Running: canon records size --root . --json"
    run_cli records size --root . --json
    log_info "Expect: plans, tasks, and memory present, read under .canon/"
    log_info "Expect: the .tmp entry present, read from .canon/tmp"
    log_step "Running: canon tasks archive v1.1-staged-row --root ."
    run_cli tasks archive v1.1-staged-row --root . --json
    log_info "Expect: from and to both spelling .canon/tasks/, not a flat sibling"
    log_step "Reading the tree back"
    # `find` exits non-zero on an absent argument and the scenario runs under
    # `set -o pipefail`, so naming a directory this arm expects to be missing
    # would abort the run on the very fact it is asserting.
    find . -not -path './.git/*' | sort
    log_info "Expect: no .claude/ directory, since nothing on this branch creates one"
    ;;
  "unmigrated")
    seed_records .claude .tmp
    log_step "Running: canon records validate plans --root ."
    run_cli records validate plans --root . --json
    # This arm asserts the fallback, so the old root is the answer it checks for.
    # A sweep rewriting it leaves the branch reading as covered while checking
    # the migrated case twice.
    # canon-keep-record-root
    log_info "Expect: 1 record read, the live plan under .claude/plans"
    log_step "Running: canon tasks archive v1.1-staged-row --root ."
    run_cli tasks archive v1.1-staged-row --root . --json
    # canon-keep-record-root
    log_info "Expect: from and to both spelling .claude/tasks/, behavior unchanged"
    ;;

  "migrate")
    seed_records .claude .tmp
    printf '.canon/\n' >.gitignore
    log_step "Running: canon migrate records --root ."
    run_cli migrate records --root . --json
    log_info "Expect: 12 entries considered, the 4 on disk named as folders to move"
    log_info "Expect: exit 2 and nothing written, since --write was not passed"
    log_step "Running: canon migrate records --root . --write"
    run_cli migrate records --root . --write --json
    log_step "Reading the tree back"
    find . -not -path './.git/*' | sort
    # canon-keep-record-root
    log_info "Expect: plans, tasks, and memory now under .canon/, and .claude/.tmp as .canon/tmp"
    # canon-keep-record-root
    log_info "Expect: no .claude/ directory left, since every seeded entry moved"
    log_step "Running: canon records validate plans --root ."
    run_cli records validate plans --root . --json
    log_info "Expect: 1 record read, resolved at the root the move produced"
    log_step "Running: canon migrate records --root ."
    run_cli migrate records --root . --json
    log_info "Expect: 0 folders and 0 citations, which is the idempotence check"
    ;;

  "migrate-refusal")
    seed_records .claude .tmp
    printf 'node_modules/\n' >.gitignore
    log_step "Running: canon migrate records --root ."
    run_cli migrate records --root . --json
    log_info "Expect: exit 1 refusing, since this project does not ignore .canon/"
    log_info "Expect: the repair names canon tooling sync rather than an edit by hand"
    # canon-keep-record-root
    log_info "Expect: the records still under .claude/, untouched by a refused run"
    find . -not -path './.git/*' | sort
    ;;
  "refusal")
    seed_records .canon tmp
    rm -rf .canon/memory
    log_step "Running: canon records validate memory --root ."
    run_cli records validate memory --root . --json
    # canon-keep-record-root
    log_info "Expect: no-folder naming .canon/memory or .claude/memory"
    log_info "Expect: the creation default named second, which is where a write lands"
    ;;
  *)
    log_error "Unknown scenario: $SELECTED_OPTION"
    ;;
  esac
}
