#!/usr/bin/env bash
set -e
set -o pipefail

use_config() {
  export SANDBOX_SKIP_AUTO_COMMIT="true"
}

stage_setup() {
  mkdir -p install
  touch install/.gitkeep
  mkdir -p sync/.claude/standards

  local src_standards="$PROJECT_ROOT/standards"

  while IFS= read -r file; do
    cp "$file" "sync/.claude/standards/$(basename "$file")"
  done < <(find "$src_standards" -maxdepth 1 -type f -name "*.md" | sort)

  local drifted
  drifted=$(find "$src_standards" -maxdepth 1 -type f -name "*.md" -not -name "index.md" | sort | head -n 2)
  while IFS= read -r file; do
    echo "<!-- stale -->" >>"sync/.claude/standards/$(basename "$file")"
  done <<<"$drifted"

  printf -- '---\ntitle: Project own\ndescription: A standard this project authored\n---\n\n# Project own\n' \
    >"sync/.claude/standards/project-own.md"
  echo "<!-- stale index -->" >>"sync/.claude/standards/index.md"

  git add .
  git commit -m "chore(sandbox): scaffold standards test directories" --no-verify -q

  log_step "Standards sandbox"
  log_info "install/ : clean target, no standards present"
  log_info "sync/    : two drifted standards, a project-authored one, a stale index"
  log_info "           headless runs refuse to apply, since standards are seeds projects edit"
  log_info "list     : read-only catalog dump, no target needed"
  log_info "read     : resolves one standard from install/, where neither project"
  log_info "           spelling exists, so only the package corpus can answer"

  select_or_route_scenario "Which scenario?" "install" "sync" "list" "read"

  case "$SELECTED_OPTION" in
  "install")
    log_step "Running: aitk standards install"
    exec bun "$PROJECT_ROOT/src/cli.ts" standards install install/
    ;;
  "sync")
    log_step "Running: aitk standards sync"
    exec bun "$PROJECT_ROOT/src/cli.ts" standards sync sync/
    ;;
  "read")
    # Run from `install/` rather than from the sandbox root. The root carries
    # `sync/.claude/standards/`, and a reader checking the premise by eye would
    # have to know the resolve never walks upward to tell the two apart.
    #
    # Both streams land on disk because `aitk sandbox check` reads the tree and
    # nothing else. The frame carries the root that answered and the body carries
    # the document, so splitting them is what lets the arm assert the resolve
    # separately from the read.
    # The status is held rather than left to `set -e`. A miss writes its warning
    # and the whole catalog to the log file, so an abort here would kill the
    # scenario with the one diagnostic the command produced sitting unread. The
    # three arms above `exec` and leave theirs on the terminal.
    log_step "Running: aitk standards skill (from install/, which holds none)"
    local read_status=0
    (
      cd install
      bun "$PROJECT_ROOT/src/cli.ts" standards skill \
        >read-body.md 2>read-frame.log
    ) || read_status=$?
    cat install/read-frame.log >&2
    [ "$read_status" -eq 0 ] || log_error "The read exited $read_status. The frame above says why."
    log_info "install/read-frame.log names the root that answered"
    log_info "install/read-body.md  is the document that root returned"
    log_info "Expect: declared in fixtures/infra/standards/read/expect.toml"
    log_info "        Check it with: aitk sandbox check infra:standards read"
    ;;
  "list")
    log_step "Running: aitk standards list"
    "$PROJECT_ROOT/scripts/standards/list.sh"
    log_step "Running: aitk standards list --json | jq '.standards[0] | keys'"
    "$PROJECT_ROOT/scripts/standards/list.sh" --json | jq '.standards[0] | keys'
    log_info "Expect keys: description, name, target, content"
    ;;
  *)
    log_error "Unknown scenario: $SELECTED_OPTION"
    ;;
  esac
}
