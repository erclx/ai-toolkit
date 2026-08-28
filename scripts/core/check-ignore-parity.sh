#!/usr/bin/env bash
set -e
set -o pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="${PROJECT_ROOT:-$(cd "$SCRIPT_DIR/../.." && pwd)}"

GITIGNORE="$PROJECT_ROOT/.gitignore"
MANIFEST="$PROJECT_ROOT/tooling/claude/manifest.toml"
SECTION="# Claude"

# Divergences this repository has decided to keep, one `<entry>|<reason>` per
# line, matched after the trailing slash is stripped. Each names a path the
# enclosing repository ignores and the claude manifest deliberately does not
# ship, so a target keeps tracking it.
#
# This is the canonical list. `.gitignore` and the manifest carry a pointer
# beside their own entries rather than a second copy of the reason, and
# `.claude/context/tooling.md` carries the narrative behind both.
#
# A sanction that no longer describes a divergence fails the same as an
# unsanctioned one. An exception outliving its reason is what teaches the next
# reader to widen the list rather than to read it.
SANCTIONED=(
  ".claude/diagrams|a target that tracks its diagrams keeps the context audit's default coverage of them, which ignoring the folder for every target would take away. This repository backs the folder through its records remote instead."
  ".claude/README.md|the landing page a records pull writes back into a repository that set up a records remote. A target has not, so it never receives the file."
)

if [ ! -f "$GITIGNORE" ]; then
  echo "No .gitignore at ${GITIGNORE#"$PROJECT_ROOT/"}, ignore parity unverifiable." >&2
  exit 1
fi

if [ ! -f "$MANIFEST" ]; then
  echo "No claude manifest at ${MANIFEST#"$PROJECT_ROOT/"}, ignore parity unverifiable." >&2
  exit 1
fi

# A gitignore pattern and a manifest entry describe the same folder whether or
# not either spells the trailing slash, so presence is compared with it dropped.
# `.claude/.tmp` and `.claude/.tmp/` are the live instance of that pair.
normalize() {
  printf '%s\n' "${1%/}"
}

# Every pattern the file carries, comments and blank lines dropped. The whole
# file rather than one header, because `.claude/teach/` sits under a header of
# its own and reading the `# Claude` header alone would report it missing from a
# list that carries it.
gitignore_patterns() {
  awk '{ sub(/[[:space:]]+$/, "") } $0 ~ /^[[:space:]]*#/ || $0 == "" { next } { print }' "$GITIGNORE"
}

# Every entry of the named array in the manifest's `[gitignore]` table. The
# array is accumulated to its closing bracket before the quoted strings are read
# out, so a formatter wrapping it across lines does not silently empty this.
manifest_entries() {
  awk -v key="\"$SECTION\"" '
    /^\[/ { table = $0 }
    table != "[gitignore]" { next }
    index($0, key) == 1 { collecting = 1; buf = "" }
    collecting { buf = buf $0 }
    collecting && index($0, "]") > 0 {
      collecting = 0
      buf = substr(buf, index(buf, "["))
      count = split(buf, parts, "\"")
      for (i = 2; i <= count; i += 2) print parts[i]
    }
  ' "$MANIFEST"
}

contains() {
  local needle=$1
  shift
  local candidate
  for candidate in "$@"; do
    [ "$candidate" = "$needle" ] || continue
    return 0
  done
  return 1
}

ignored=()
while IFS= read -r pattern; do
  [ -n "$pattern" ] || continue
  ignored+=("$(normalize "$pattern")")
done < <(gitignore_patterns)

shipped=()
while IFS= read -r entry; do
  [ -n "$entry" ] || continue
  shipped+=("$(normalize "$entry")")
done < <(manifest_entries)

# An empty read on either side is a parse that failed rather than a repository
# ignoring nothing, and reporting parity off it would say the two lists agree
# having compared none of their entries.
if [ ${#ignored[@]} -eq 0 ]; then
  echo "No patterns read from .gitignore, ignore parity unverifiable." >&2
  exit 1
fi

if [ ${#shipped[@]} -eq 0 ]; then
  echo "No entries read from the \"$SECTION\" array in ${MANIFEST#"$PROJECT_ROOT/"}, ignore parity unverifiable." >&2
  exit 1
fi

failures=""
sanction_notes=""

# Entries the manifest ships that this repository does not ignore. A target is
# told to ignore a folder the toolkit itself tracks, which no decision sanctions,
# so this direction carries no exception list.
for entry in "${shipped[@]}"; do
  contains "$entry" "${ignored[@]}" && continue
  failures="$failures  $entry is shipped by the manifest and absent from .gitignore"$'\n'
done

# Claude-scoped patterns this repository ignores that the manifest does not
# ship. Scoped to `.claude/` because the manifest is the claude stack and says
# nothing about `node_modules/` or `.env`.
for pattern in "${ignored[@]}"; do
  case "$pattern" in
  .claude/*) ;;
  *) continue ;;
  esac
  contains "$pattern" "${shipped[@]}" && continue

  matched=false
  for sanction in "${SANCTIONED[@]}"; do
    [ "${sanction%%|*}" = "$pattern" ] || continue
    matched=true
    sanction_notes="$sanction_notes  $pattern stays out of the manifest: ${sanction#*|}"$'\n'
    break
  done

  if [ "$matched" = false ]; then
    failures="$failures  $pattern is ignored here and absent from the manifest"$'\n'
  fi
done

# A sanction naming a path that is no longer divergent, either because the
# manifest took it or because .gitignore dropped it.
for sanction in "${SANCTIONED[@]}"; do
  entry="${sanction%%|*}"
  if contains "$entry" "${ignored[@]}" && ! contains "$entry" "${shipped[@]}"; then
    continue
  fi
  failures="$failures  $entry is sanctioned as a divergence and is no longer one"$'\n'
done

if [ -n "$failures" ]; then
  echo "The ignore set a target receives disagrees with this repository's own:" >&2
  printf '%s' "$failures" >&2
  echo "Add the entry to the \"$SECTION\" array in ${MANIFEST#"$PROJECT_ROOT/"} and to .gitignore, or record it in SANCTIONED in scripts/core/check-ignore-parity.sh with the reason it stays apart." >&2
  exit 1
fi

if [ -n "$sanction_notes" ]; then
  echo "Sanctioned divergences from the ignore set a target receives:"
  printf '%s' "$sanction_notes"
fi
