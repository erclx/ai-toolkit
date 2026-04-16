#!/bin/bash
set -e
set -o pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="${PROJECT_ROOT:-$(cd "$SCRIPT_DIR/../.." && pwd)}"

source "$PROJECT_ROOT/scripts/lib/index.sh"

write_index "$PROJECT_ROOT/prompts" "$PROMPTS_INDEX_TITLE" "$PROMPTS_INDEX_SUBTITLE"
write_index "$PROJECT_ROOT/standards" "$STANDARDS_INDEX_TITLE" "$STANDARDS_INDEX_SUBTITLE"
