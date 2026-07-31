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
  arm_dir="ctx-arm"
  ;;
wireframes)
  standard="wireframes.md"
  dest=".claude/wireframes/feed-list.md"
  surface="one entry for the feed list surface"
  arm_dir="wf-arm"
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
fixture="$workdir/$arm_dir/feedwatch"

mkdir -p "$fixture/.claude/standards" "$fixture/$(dirname "$dest")"
cp "$REPO_ROOT/standards/$standard" "$fixture/.claude/standards/$standard"
cp "$REPO_ROOT/standards/prose.md" "$fixture/.claude/standards/prose.md"

# acceptEdits alone treats paths under .claude/ as sensitive and refuses them,
# which cost two inconclusive runs before it was diagnosed. Fixture-local
# settings do not fix it either, because an untrusted workspace makes Claude
# Code ignore permissions.allow, and a mktemp path is never trusted. Skipping
# permissions is the remaining option and it is safe here specifically: the
# fixture is synthetic, disposable, outside the repo, and deleted on exit, so
# the grant reaches nothing that outlives the run. Do not copy this flag into
# a script that runs against real project files.

echo "→ arm: $arm, standard: $standard" >&2
echo "→ fixture: $fixture" >&2

prompt="This project has no $(dirname "$dest")/ entry yet. Read .claude/standards/$standard \
and author $surface at $dest, following that standard. Write the file."

# Snapshot the fixture before the run so the artifact can be recovered by
# difference afterward, wherever the session decided to put it.
before="$(mktemp "${TMPDIR:-/tmp}/authoring-before-XXXXXX")"
find "$fixture" -type f | sort >"$before"

result="$(cd "$fixture" && claude -p "$prompt" --output-format json \
  --dangerously-skip-permissions </dev/null)"

jq -r '"cost_usd: \(.total_cost_usd) | turns: \(.num_turns)"' <<<"$result" >&2

# Writes under .claude/ are blocked even with acceptEdits, and a session that
# hits that block may route around it and write somewhere else entirely. Recover
# the artifact from whatever the run actually created rather than trusting the
# requested path, then fall back to the final message.
artifact=""
while IFS= read -r created; do
  case "$created" in
  *.md) artifact="$created" ;;
  esac
done < <(find "$fixture" -type f | sort | comm -13 "$before" -)
rm -f "$before"

if [ -n "$artifact" ]; then
  echo "→ artifact recovered from ${artifact#"$fixture"/}" >&2
  cat "$artifact"
  echo
  echo "<!-- run commentary follows -->"
fi

jq -r '.result // ""' <<<"$result"
