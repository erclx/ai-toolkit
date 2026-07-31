#!/usr/bin/env bash
# Spec-quality test: can a session that has never seen a standard author a
# conforming artifact from that standard alone? Prints the artifact to stdout.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly SCRIPT_DIR
REPO_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
readonly REPO_ROOT

arm="${1:-context}"

case "$arm" in
context)
  standard="context.md"
  dest=".claude/context/feedwatch.md"
  surface="one entry for this codebase"
  armdir="ctx-arm"
  ;;
wireframes)
  standard="wireframes.md"
  dest=".claude/wireframes/feed-list.md"
  surface="one entry for the feed list surface"
  armdir="wf-arm"
  ;;
*)
  echo "usage: run.sh [context|wireframes]" >&2
  exit 1
  ;;
esac

# The fixture must live outside the repo. A fixture under the repo would load
# this project's CLAUDE.md through the ancestor chain and contaminate the run.
workdir="$(mktemp -d "${TMPDIR:-/tmp}/authoring-test-XXXXXX")"
trap 'rm -rf "$workdir"' EXIT

tar -xzf "$SCRIPT_DIR/fixture.tar.gz" -C "$workdir"
fixture="$workdir/$armdir/feedwatch"

mkdir -p "$fixture/.claude/standards" "$fixture/$(dirname "$dest")"
cp "$REPO_ROOT/standards/$standard" "$fixture/.claude/standards/$standard"
cp "$REPO_ROOT/standards/prose.md" "$fixture/.claude/standards/prose.md"

echo "→ arm: $arm, standard: $standard" >&2
echo "→ fixture: $fixture" >&2

prompt="This project has no $(dirname "$dest")/ entry yet. Read .claude/standards/$standard \
and author $surface at $dest, following that standard. Write the file."

# --permission-mode acceptEdits still blocks writes under .claude/, so the run
# returns the artifact in its final message instead of on disk. Judge stdout.
result="$(cd "$fixture" && claude -p "$prompt" --output-format json --permission-mode acceptEdits)"

python3 -c "
import json, sys
d = json.loads(sys.stdin.read())
print('cost_usd:', d.get('total_cost_usd'), '| turns:', d.get('num_turns'), file=sys.stderr)
print(d.get('result') or '')
" <<<"$result"
