#!/usr/bin/env bash
set -e
set -o pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="${PROJECT_ROOT:-$(cd "$SCRIPT_DIR/../.." && pwd)}"

# `.claude/rules/` is a subset rather than a mirror, so it resolves through the
# stack machinery. The record naming the subset is `internal/governance.toml`.
bun "$PROJECT_ROOT/src/cli.ts" gov regen --root "$PROJECT_ROOT"
