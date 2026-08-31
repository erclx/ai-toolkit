#!/usr/bin/env bash
# Repairs `core.bare`, which Claude Code's worktree entry leaves set in the
# shared config with nothing restoring it. The flag strands the main worktree
# and breaks the git reads that scope a verification run, so this runs ahead of
# every stage rather than as one of them.
#
# The rule itself lives in `scripts/lib/worktree.sh`, the one bash function in
# this repository under test, so this file is the invocation and never a second
# copy of the guard that spares a genuinely bare repository.
set -e
set -o pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="${PROJECT_ROOT:-$(cd "$SCRIPT_DIR/../.." && pwd)}"

source "$PROJECT_ROOT/scripts/lib/ui.sh"
source "$PROJECT_ROOT/scripts/lib/worktree.sh"

repair_bare_flag "$PROJECT_ROOT"
