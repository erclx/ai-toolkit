#!/bin/bash
set -e
set -o pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="${PROJECT_ROOT:-$(cd "$SCRIPT_DIR/../.." && pwd)}"

source "$PROJECT_ROOT/scripts/lib/ui.sh"

TMP_ROOT="$PROJECT_ROOT/.claude/.tmp/install-check"
CLONE_DIR="$TMP_ROOT/clone"
TARGET_DIR="$TMP_ROOT/target"
KEEP=0

for arg in "$@"; do
  case "$arg" in
  --keep) KEEP=1 ;;
  --help | -h)
    cat <<HELP
Usage: scripts/core/install-check.sh [--keep]

Verifies the README install path end to end:
  1. Clones this repo into .claude/.tmp/install-check/clone
  2. Runs bun install in the clone
  3. Runs the CLI with --help to confirm it executes
  4. Scaffolds a fresh project in .claude/.tmp/install-check/target
  5. Runs aitk init and asserts a scaffold landed

Flags:
  --keep    Keep the tmp tree on exit for inspection
HELP
    exit 0
    ;;
  esac
done

cleanup() {
  if [ "$KEEP" = "1" ]; then
    log_info "Kept artifacts at $TMP_ROOT"
  else
    rm -rf "$TMP_ROOT"
  fi
  close_timeline
}
trap cleanup EXIT

rm -rf "$TMP_ROOT"
mkdir -p "$TMP_ROOT"

open_timeline "Install verification"

log_step "Clone"
git clone --quiet "$PROJECT_ROOT" "$CLONE_DIR" 2>&1 | pipe_output || true
log_info "Cloned to $CLONE_DIR"

log_step "Install dependencies"
(cd "$CLONE_DIR" && bun install --silent 2>&1 | pipe_output) || log_error "bun install failed"
log_info "Dependencies installed"

log_step "Confirm CLI runs"
(cd "$CLONE_DIR" && bun run src/cli.ts --help >/dev/null) || log_error "aitk --help failed"
log_info "aitk --help ran clean"

log_step "Scaffold fresh project"
mkdir -p "$TARGET_DIR"
(cd "$TARGET_DIR" && git init --quiet)
log_info "Initialized git in $TARGET_DIR"

log_step "Run aitk init"
(cd "$TARGET_DIR" && AITK_NON_INTERACTIVE=1 bun run "$CLONE_DIR/src/cli.ts" init 2>&1 | pipe_output) || log_error "aitk init failed"
log_info "aitk init completed"

log_step "Assert scaffold"
for path in "CLAUDE.md" "snippets" "wiki/index.md" ".claude"; do
  if [ ! -e "$TARGET_DIR/$path" ]; then
    log_error "Missing after aitk init: $path"
  fi
  log_info "Found: $path"
done

log_step "Verification passed"
log_info "Manual check still needed: bun link and global aitk invocation"
