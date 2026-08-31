#!/usr/bin/env bash
set -e
set -o pipefail

source "$PROJECT_ROOT/scripts/lib/sandbox-fixtures.sh"

use_config() {
  export SANDBOX_SKIP_AUTO_COMMIT="true"
}

stage_setup() {
  select_or_route_scenario "Which scenario?" "retired"

  case "$SELECTED_OPTION" in
  "retired")
    mkdir -p .claude

    # The task shape. One file carrying what the folder now holds one file per
    # entry, with no phase label anywhere in it, which is the field the
    # destination convention requires and the retired file cannot supply.
    cat <<'EOF' >.claude/TASKS.md
# Tasks

## Retry a timed-out renewal

The invoice job drops a renewal when the payment provider times out.

- [ ] A timed-out renewal retries once before the job records it as failed
- [ ] The retry count is visible in the job log

## Split the billing webhook handler

One handler switches on six event types and no test covers the last three.

- [x] Each event type routes to its own handler
- [ ] The three uncovered types have tests
EOF

    # The diagram shape. Two kinds in one file, which the destination folder
    # splits across two fixed filenames rather than across names of its own.
    cat <<'EOF' >.claude/DIAGRAMS.md
# Diagrams

## System context

```mermaid
flowchart TB
    user[customer] --> app[billing app]
    app --> psp[payment provider]
```

The customer reaches the billing app and the app settles against one provider.

## Deployment

```mermaid
flowchart TB
    edge[edge proxy] --> api[api service]
    api --> db[(postgres)]
```

One API service behind a proxy, with a single database.
EOF

    # The third entry exists to be declined. `hooks` is in the seed subdirectory
    # set and no standard declares `appliesTo` over `.claude/hooks/`, so it is
    # the honest-degrade branch under assertion rather than left to a reader.
    cat <<'EOF' >.claude/HOOKS.md
# Hooks

The pre-commit hook runs the formatter and refuses a commit that reformats.
EOF

    git add . && git commit -m "chore(sandbox): retired .claude files before the folders replaced them" --no-verify -q

    # Committed first and ignored second, which is the order that produces the
    # tracked-while-ignored state. Appending rather than rewriting keeps the two
    # entries provisioning wrote, so nothing the sandbox depends on is dropped.
    printf '\n.claude/TASKS.md\n' >>.gitignore
    git add .gitignore && git commit -m "chore(sandbox): ignore the retired task file after it was committed" --no-verify -q

    # The state the arm exists to score. A file that is only ignored, or only
    # tracked, exercises no ordering, and the ignore entry landing before the
    # commit would leave the file untracked with the same two commits present.
    if ! git ls-files --error-unmatch .claude/TASKS.md >/dev/null 2>&1; then
      log_error "The retired task file is not tracked. The arm would score an ordering with nothing to order."
      return 1
    fi
    # `--no-index` for the reason the skill reads it that way. `check-ignore`
    # consults the index by default and calls a tracked path not ignored, which
    # is the exact state being staged, so the flagless form fails here against a
    # fixture that is correct.
    if ! git check-ignore -q --no-index .claude/TASKS.md; then
      log_error "The retired task file is not ignored. The arm would score an ordering with nothing to order."
      return 1
    fi

    # The destination shape is read through `canon standards <name>`, which is the
    # only route a target has now that no corpus installs into one. The guard
    # asserts the read resolves, since an arm whose standards were unreachable
    # would score a refusal rather than the proposal declared below.
    local missing=""
    for standard in tasks diagrams; do
      if ! CANON_NON_INTERACTIVE=1 canon standards "$standard" >/dev/null 2>&1; then
        missing="$missing $standard"
      fi
    done
    if [ -n "$missing" ]; then
      log_error "canon standards could not resolve$missing. The arm would score the unresolved refusal instead."
      return 1
    fi

    # The skill reads one field and stops when it is absent, so an older CLI
    # sends the run down the upgrade branch while every reply pin still names a
    # folder the run could have reached by walking the tree itself. Captured
    # whole rather than piped, since `pipefail` turns a matcher's early exit
    # into a SIGPIPE the guard would read as a missing section.
    local report
    report=$(CANON_NON_INTERACTIVE=1 canon sync --check . --json 2>/dev/null) || true

    case "$report" in
    *'"superseded"'*) ;;
    *)
      log_error "The canon on PATH reports no superseded section. Install a CLI at 0.46.0 or newer before running this arm."
      return 1
      ;;
    esac

    log_step "Scenario ready: migration-superseded on a target holding three retired files"
    log_info "Context: .claude/TASKS.md, .claude/DIAGRAMS.md, and .claude/HOOKS.md"
    log_info "  TASKS.md is tracked and ignored, so the untrack has to precede the entry"
    log_info "  DIAGRAMS.md carries two kinds the destination folder fixes filenames for"
    log_info "  HOOKS.md pairs to a folder no standard declares, so it earns no proposal"
    log_info "  Standards resolve through canon standards, which is the target's only route"
    log_info "Action:  /canon:migration-superseded"
    log_info "Expect:  proposes both splits from the resolved standards, declines the third,"
    log_info "         names git rm --cached ahead of the ignore entry, and writes nothing"
    log_info "Assert:  declared in fixtures/claude/migration-superseded/retired/expect.toml"
    ;;
  *)
    log_error "Unknown scenario: $SELECTED_OPTION"
    ;;
  esac
}
