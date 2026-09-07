#!/usr/bin/env bash
set -e

use_config() {
  export SANDBOX_SKIP_AUTO_COMMIT="true"
}

stage_setup() {
  select_or_route_scenario "Which scenario?" "no-readme" "scaffold-readme" "authored-readme"

  mkdir -p src

  cat <<'EOF' >package.json
{
  "name": "sample-cli",
  "version": "0.1.0",
  "bin": { "sample-cli": "./src/cli.js" }
}
EOF

  case "$SELECTED_OPTION" in
  "no-readme")
    log_step "Scenario ready: no README exists"
    git add . && git commit -m "chore: seed a CLI package with no README" -q
    log_info "Context: package.json declares a bin entry, no README.md anywhere"
    log_info "Action:  /canon:draft-readme write the project README"
    log_info "Expect:  drafted at README.md, CLI content covered, confirmed before write"
    ;;

  "scaffold-readme")
    cat <<'EOF' >README.md
This is a sample project bootstrapped with a generator.

## Getting Started

Run the dev server.

## Learn More

See the generator's own docs.
EOF
    git add . && git commit -m "chore: seed a scaffold-written README" -q
    log_step "Scenario ready: README is unedited scaffold output"
    log_info "Context: README.md carries no H1 and only the generator's own headings"
    log_info "Action:  /canon:draft-readme write the project README"
    log_info "Expect:  drafts over the scaffold page rather than refusing toward docs-sync"
    ;;

  "authored-readme")
    cat <<'EOF' >README.md
# Sample CLI

A command-line tool for doing the sample thing.

## Installation

    npm install -g sample-cli

## Usage

    sample-cli run

## Support

Open an issue for bug reports.
EOF
    git add . && git commit -m "chore: seed an authored README" -q
    log_step "Scenario ready: README is already authored"
    log_info "Context: README.md carries an H1 naming the project"
    log_info "Action:  /canon:draft-readme write the project README"
    log_info "Expect:  refuses toward /canon:docs-sync, since README.md already covers the project"
    ;;
  *)
    log_error "Unknown scenario: $SELECTED_OPTION"
    ;;
  esac
}
