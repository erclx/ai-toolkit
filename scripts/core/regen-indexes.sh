#!/usr/bin/env bash
set -e
set -o pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="${PROJECT_ROOT:-$(cd "$SCRIPT_DIR/../.." && pwd)}"

source "$PROJECT_ROOT/scripts/lib/ui.sh"

# Invoked by path rather than the global `aitk` so a linked worktree
# regenerates with its own CLI instead of the main checkout's.
bun "$PROJECT_ROOT/src/cli.ts" indexes regen --root "$PROJECT_ROOT" --json >/dev/null
