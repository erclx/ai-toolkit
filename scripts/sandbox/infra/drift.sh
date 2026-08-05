#!/usr/bin/env bash
set -e
set -o pipefail

source "$PROJECT_ROOT/scripts/lib/sandbox-fixtures.sh"

REPORT="drift-report.json"

use_config() {
  export SANDBOX_SKIP_AUTO_COMMIT="true"
  export SANDBOX_INJECT_STANDARDS="true"
  export SANDBOX_INJECT_SEEDS="true"
}

# Every arm runs unstamped. No target on disk carries `.claude/aitk.json`, so the
# git-history fallback is the path a real project takes and the stamped path is
# the rare one. An arm that stamped first would exercise the wrong branch.
write_report() {
  log_step "Running: aitk sync --check . --json"
  bun "$PROJECT_ROOT/src/cli.ts" sync --check . --json >"$REPORT"
  log_info "Report written to $REPORT"
}

# The newest top-level path history records a deletion under that the toolkit no
# longer ships. Read from history rather than hardcoded, so the arm stages a root
# the walk will actually recognize instead of a name that has since come back.
# `prompts` is preferred because it is the case measured in a real target, and
# any other dropped root exercises the same walk.
pick_dropped_root() {
  local preferred="prompts"
  local first=""
  local candidate

  while IFS= read -r candidate; do
    [ -e "$PROJECT_ROOT/$candidate" ] && continue
    [ "$candidate" = "$preferred" ] && {
      echo "$preferred"
      return 0
    }
    [ -n "$first" ] || first="$candidate"
  done < <(git -C "$PROJECT_ROOT" log --all --diff-filter=D --name-only --format= |
    awk -F/ 'NF > 1 { print $1 }' | sort -u)

  echo "$first"
}

# Restores one file's exact published bytes from the commit before it was
# deleted. Content is what the attribution matches on, so a file written by hand
# would report unattributed and the arm would assert the wrong verdict.
#
# Both reads take the whole listing through a process substitution rather than a
# pipeline ending in an early exit. `set -o pipefail` is on, and a `grep -m 1`
# that matches the first line closes the pipe while git is still writing, so the
# substitution returns git's SIGPIPE status and the arm fails on a listing it
# actually read.
restore_dropped_file() {
  local root="$1"
  local rel="" commit="" line

  while IFS= read -r line; do
    case "$line" in
    "$root"/*)
      rel="$line"
      break
      ;;
    esac
  done < <(git -C "$PROJECT_ROOT" log --all --diff-filter=D --name-only \
    --format= -- "$root/")

  [ -n "$rel" ] || return 1

  while IFS= read -r line; do
    commit="$line"
    break
  done < <(git -C "$PROJECT_ROOT" log --all --diff-filter=D --format=%H -- "$rel")

  [ -n "$commit" ] || return 1

  mkdir -p "$(dirname "$rel")"
  git -C "$PROJECT_ROOT" show "$commit^:$rel" >"$rel" || return 1

  echo "$rel"
}

stage_setup() {
  select_or_route_scenario "Which arm?" "stale" "retired" "unmigrated" "tooling" "unclaimed"

  case "$SELECTED_OPTION" in
  "stale")
    local -a stale=()
    while IFS= read -r file; do
      local filename
      filename=$(basename "$file")
      [ -f ".claude/standards/$filename" ] || continue
      echo "<!-- stale -->" >>".claude/standards/$filename"
      stale+=("$filename")
      [ "${#stale[@]}" -eq 2 ] && break
    done < <(find "$PROJECT_ROOT/standards" -maxdepth 1 -type f -name "*.md" ! -name "index.md" | sort)

    echo "" >>CLAUDE.md
    echo "## Project rule the seed never shipped" >>CLAUDE.md

    write_report

    log_step "Scenario ready: correct layout, content behind"
    log_info "Context: the state three of six real targets sit in"
    log_info "  Stale standards: ${stale[*]}"
    log_info "  CLAUDE.md carries a section the seed does not"
    log_info ""
    log_info "Expect:  declared in fixtures/infra/drift/stale/expect.toml"
    log_info "         Check it with: aitk sandbox check infra:drift stale"
    ;;

  "retired")
    printf '# Tasks\n\nOld single-file board.\n' >.claude/TASKS.md
    printf '# Diagrams\n\nOld single-file diagrams.\n' >.claude/DIAGRAMS.md
    printf '# Archive\n\nSuffixed variant the stem rule does not match.\n' >.claude/TASKS-ARCHIVE.md

    write_report

    log_step "Scenario ready: retired artifacts present"
    log_info "Context: the seed tree moved to folders and the target kept the files"
    log_info "  .claude/TASKS.md and .claude/DIAGRAMS.md are superseded"
    log_info "  .claude/TASKS-ARCHIVE.md is the suffixed variant, deliberately unmatched"
    log_info ""
    log_info "The report names these and proposes nothing. No command moves them,"
    log_info "because the content belongs to the project."
    log_info ""
    log_info "Expect:  declared in fixtures/infra/drift/retired/expect.toml"
    log_info "         Check it with: aitk sandbox check infra:drift retired"
    ;;

  "unmigrated")
    mkdir -p standards
    cp .claude/standards/*.md standards/
    rm -rf .claude/standards

    # The arm asserts that an unmigrated domain is reported. A copy that staged
    # nothing would produce a report correctly finding none, and the failure
    # would read as a defect in the detection rather than in the fixture.
    local staged
    staged=$(find standards -maxdepth 1 -name '*.md' | wc -l | tr -d ' ')
    if [ "$staged" -eq 0 ]; then
      log_error "Fixture staged no standards. The arm would assert against an empty root."
      return 1
    fi

    write_report

    log_step "Scenario ready: root layout, never migrated"
    log_info "Context: a project scaffolded before standards moved under .claude/"
    log_info "  standards/ holds $staged files"
    log_info "  .claude/standards/ does not exist"
    log_info ""
    log_info "Before this arm existed the report called this target clean, because"
    log_info "the domain scan lists only domains it finds installed."
    log_info ""
    log_info "Expect:  declared in fixtures/infra/drift/unmigrated/expect.toml"
    log_info "         Check it with: aitk sandbox check infra:drift unmigrated"
    ;;

  "tooling")
    write_report

    log_step "Scenario ready: standards installed, tooling never recorded"
    log_info "Context: every target installed before the tooling record shipped"
    log_info "  .claude/aitk.json carries no tooling chain"
    log_info ""
    log_info "The report names tooling unmeasured rather than counting zero"
    log_info "changes against it. A target that never installed tooling and one"
    log_info "whose tooling is current produce the same zero, so the count alone"
    log_info "is a claim rather than the absence of one."
    log_info ""
    log_info "Expect:  declared in fixtures/infra/drift/tooling/expect.toml"
    log_info "         Check it with: aitk sandbox check infra:drift tooling"
    ;;

  "unclaimed")
    local root
    root=$(pick_dropped_root)
    if [ -z "$root" ]; then
      log_error "History records no dropped root. The arm would assert against a target holding nothing."
      return 1
    fi

    local staged
    if ! staged=$(restore_dropped_file "$root"); then
      log_error "Could not restore a published file under $root/. The arm would assert the wrong verdict."
      return 1
    fi

    printf '# Ours\n\nWritten here, never shipped by the toolkit.\n' \
      >"$root/project-authored.md"

    write_report

    log_step "Scenario ready: a folder the toolkit stopped shipping"
    log_info "Context: the reverse of every other section, which asks only"
    log_info "whether the target matches what the toolkit currently ships"
    log_info "  $root/ holds $staged at its published bytes"
    log_info "  $root/project-authored.md is a sibling the toolkit never had"
    log_info ""
    log_info "The folder is reported as dropped upstream and named with the"
    log_info "commit it was last published at. It counts toward no gate, because"
    log_info "a dropped folder and one the project wrote are the same bytes at"
    log_info "the same path and only the user can tell them apart."
    log_info ""
    log_info "Expect:  declared in fixtures/infra/drift/unclaimed/expect.toml"
    log_info "         Check it with: aitk sandbox check infra:drift unclaimed"
    ;;
  esac
}
