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
# permissions is what remains.
#
# What makes that acceptable is not the fixture. The flag grants tool use
# across the filesystem, not within a directory, so a disposable fixture bounds
# the blast radius of nothing. What bounds it is the task: the cwd is the
# fixture, the prompt names one file to write, and no credential or repo path
# is in reach of the instruction. Copy the flag only where the same three hold.

echo "→ arm: $arm, standard: $standard" >&2
echo "→ fixture: $fixture" >&2

prompt="This project has no $(dirname "$dest")/ entry yet. Read .claude/standards/$standard \
and author $surface at $dest, following that standard. Write the file."

# Snapshot the fixture before the run so the artifact can be recovered by
# difference afterward, wherever the session decided to put it. The snapshot
# lives in the workdir rather than its own mktemp file, so the existing trap
# removes it even when the run below fails under set -e.
before="$workdir/.authoring-before"
find "$fixture" -type f | sort >"$before"

result="$(cd "$fixture" && claude -p "$prompt" --output-format json \
  --dangerously-skip-permissions </dev/null)"

jq -r '"cost_usd: \(.total_cost_usd) | turns: \(.num_turns)"' <<<"$result" >&2

# A session that cannot write the requested path may write somewhere else
# entirely, so recover from what the run actually created rather than trusting
# the path. Collect every new markdown file: picking one would silently drop the
# artifact whenever a run leaves notes beside it, and sort order does not track
# which file matters.
created_md=()
while IFS= read -r created; do
  case "$created" in
  *.md) created_md+=("$created") ;;
  esac
done < <(find "$fixture" -type f | sort | comm -13 "$before" -)

# The requested path first when the run used it, then everything else.
ordered=()
for candidate in ${created_md[@]+"${created_md[@]}"}; do
  [ "$candidate" = "$fixture/$dest" ] && ordered+=("$candidate")
done
for candidate in ${created_md[@]+"${created_md[@]}"}; do
  [ "$candidate" != "$fixture/$dest" ] && ordered+=("$candidate")
done

for candidate in ${ordered[@]+"${ordered[@]}"}; do
  rel="${candidate#"$fixture"/}"
  echo "→ artifact recovered from $rel" >&2
  echo "<!-- recovered: $rel -->"
  cat "$candidate"
  echo
done

[ ${#ordered[@]} -gt 0 ] && echo "<!-- run commentary follows -->"

jq -r '.result // ""' <<<"$result"
