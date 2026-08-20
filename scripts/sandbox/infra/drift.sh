#!/usr/bin/env bash
set -e
set -o pipefail

source "$PROJECT_ROOT/scripts/lib/sandbox-fixtures.sh"

REPORT="drift-report.json"

use_config() {
  export SANDBOX_SKIP_AUTO_COMMIT="true"
  export SANDBOX_INJECT_SEEDS="true"
  # Governance is the scanned domain the arms stage against. Standards installs
  # into no target, so it leaves no copy to make stale and no root layout to
  # find unmigrated.
  export SANDBOX_INJECT_GOV="true"
}

# Every arm runs unstamped. No target on disk carries `.claude/aitk.json`, so the
# git-history fallback is the path a real project takes and the stamped path is
# the rare one. An arm that stamped first would exercise the wrong branch.
write_report() {
  log_step "Running: aitk sync --check . --json"
  bun "$PROJECT_ROOT/src/cli.ts" sync --check . --json >"$REPORT"
  log_info "Report written to $REPORT"
}

stage_setup() {
  select_or_route_scenario "Which arm?" "stale" "retired" "unmigrated" "tooling" "unclaimed"

  case "$SELECTED_OPTION" in
  "stale")
    local -a stale=()
    while IFS= read -r file; do
      echo "# stale" >>"$file"
      stale+=("${file#.claude/rules/}")
      [ "${#stale[@]}" -eq 2 ] && break
    done < <(find .claude/rules -type f -name "*.md" | sort)

    if [ "${#stale[@]}" -eq 0 ]; then
      log_error "Fixture staged no stale rule. The arm would assert against a clean target."
      return 1
    fi

    echo "" >>CLAUDE.md
    echo "## Project rule the seed never shipped" >>CLAUDE.md

    write_report

    log_step "Scenario ready: correct layout, content behind"
    log_info "Context: the state three of six real targets sit in"
    log_info "  Stale rules: ${stale[*]}"
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
    # Snippets is the one domain left that an older toolkit installed at the
    # root, so it is what `detectUnmigrated` still walks. The files are copied
    # flat, which is the layout the root install wrote and the layout
    # `countToolkitOwned` matches by basename.
    mkdir -p snippets
    find "$PROJECT_ROOT/snippets" -type f -name '*.md' ! -name 'index.md' \
      -exec cp {} snippets/ \;
    rm -rf .claude/snippets

    # The arm asserts that an unmigrated domain is reported. A copy that staged
    # nothing would produce a report correctly finding none, and the failure
    # would read as a defect in the detection rather than in the fixture.
    local staged
    staged=$(find snippets -maxdepth 1 -name '*.md' | wc -l | tr -d ' ')
    if [ "$staged" -eq 0 ]; then
      log_error "Fixture staged no snippets. The arm would assert against an empty root."
      return 1
    fi

    write_report

    log_step "Scenario ready: root layout, never migrated"
    log_info "Context: a project scaffolded before snippets moved under .claude/"
    log_info "  snippets/ holds $staged files"
    log_info "  .claude/snippets/ does not exist"
    log_info ""
    log_info "Before this arm existed the report called this target clean, because"
    log_info "the domain scan lists only domains it finds installed."
    log_info ""
    log_info "Expect:  declared in fixtures/infra/drift/unmigrated/expect.toml"
    log_info "         Check it with: aitk sandbox check infra:drift unmigrated"
    ;;

  "tooling")
    write_report

    log_step "Scenario ready: rules installed, tooling never recorded"
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
