#!/usr/bin/env bash
# Fills assets/hero.html.tmpl from the CLI catalogs and writes assets/hero.html.
#
# Only the HTML regenerates here. The PNG beside it is a chromium render whose
# bytes move with the browser version, so asserting it in verify.sh would fail
# on a machine whose chromium differs rather than on a stale count. Rebuild the
# image with `aitk capture assets/hero.html` after this script reports a change.
# The frame carries no version. `package.json` is bumped on main by the release
# tooling, so embedding it drifts every open branch on the next release and the
# stage then fails for work that touched nothing.
#
# Clone-only. `src/capture` is excluded from the published tarball, and this
# script reads the repository's own catalogs, so a registry install has neither.
set -e
set -o pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="${PROJECT_ROOT:-$(cd "$SCRIPT_DIR/../.." && pwd)}"

TEMPLATE="$PROJECT_ROOT/assets/hero.html.tmpl"
OUTPUT="$PROJECT_ROOT/assets/hero.html"
LISTED=10

# `bun src/cli.ts` rather than `aitk`, since a globally linked binary resolves to
# the main checkout no matter which worktree is running.
catalog() {
  (cd "$PROJECT_ROOT" && AITK_NON_INTERACTIVE=1 bun src/cli.ts "$@" --json 2>/dev/null)
}

if [ ! -f "$TEMPLATE" ]; then
  echo "regen-hero: missing template at $TEMPLATE" >&2
  exit 1
fi

SKILLS_JSON="$(catalog claude skills list)"
GOV_JSON="$(catalog gov list)"
STANDARDS_JSON="$(catalog standards list)"
SNIPPETS_JSON="$(catalog snippets list)"
TOOLING_JSON="$(catalog tooling list)"

for payload in "$SKILLS_JSON" "$GOV_JSON" "$STANDARDS_JSON" "$SNIPPETS_JSON" "$TOOLING_JSON"; do
  if [ -z "$payload" ]; then
    echo "regen-hero: a catalog returned nothing, refusing to write a zeroed hero" >&2
    exit 1
  fi
done

# The catalogs reach the eval as files rather than as environment entries. Linux
# caps a single env string at 128KB, and the standards payload crossed it, which
# fails the exec with E2BIG before any stage can report a stale count. A file
# path is bounded whatever the catalogs grow to.
PAYLOAD_DIR="$(mktemp -d)"
trap 'rm -rf "$PAYLOAD_DIR"' EXIT

printf '%s' "$SKILLS_JSON" >"$PAYLOAD_DIR/skills.json"
printf '%s' "$GOV_JSON" >"$PAYLOAD_DIR/gov.json"
printf '%s' "$STANDARDS_JSON" >"$PAYLOAD_DIR/standards.json"
printf '%s' "$SNIPPETS_JSON" >"$PAYLOAD_DIR/snippets.json"
printf '%s' "$TOOLING_JSON" >"$PAYLOAD_DIR/tooling.json"

export PAYLOAD_DIR
export TEMPLATE OUTPUT LISTED PROJECT_ROOT

bun --eval '
const { readFileSync } = require("node:fs")

const { PAYLOAD_DIR, TEMPLATE, OUTPUT, LISTED, PROJECT_ROOT } = process.env

const payload = (name) => readFileSync(PAYLOAD_DIR + "/" + name + ".json", "utf8")

const SKILLS_JSON = payload("skills")
const GOV_JSON = payload("gov")
const STANDARDS_JSON = payload("standards")
const SNIPPETS_JSON = payload("snippets")
const TOOLING_JSON = payload("tooling")

const listed = Number(LISTED)
const skills = JSON.parse(SKILLS_JSON).skills.map((entry) => entry.name)
const gov = JSON.parse(GOV_JSON)
// Rule names carry a numeric prefix that orders the load, not the identity a
// reader knows them by, so the frame shows the slug alone.
const rules = gov.rules.map((entry) => entry.name.replace(/^\d+-/, ""))
const standards = JSON.parse(STANDARDS_JSON).standards.map((entry) => entry.name)
const snippets = new Set(
  JSON.parse(SNIPPETS_JSON).categories.flatMap((category) => category.entries),
)
const toolingStacks = JSON.parse(TOOLING_JSON).stacks

const escape = (value) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")

// Even spacing across the sorted catalog rather than its first N. The skill
// names are prefixed by domain, so an alphabetical head returns eight
// `claude-*` entries and reads as a narrower catalog than the one that ships.
const sample = (names) => {
  if (names.length <= listed) return names
  const step = names.length / listed
  return Array.from({ length: listed }, (_, i) => names[Math.floor(i * step)])
}

const entries = (names) =>
  sample(names)
    .map((name) => `            <div class="entry">${escape(name)}</div>`)
    .join("\n")

const remaining = (names) => String(Math.max(0, names.length - listed))

// An empty array is well-formed JSON, so the shell guard on an empty payload
// does not catch a catalog whose tree went missing. A zeroed count would ship a
// frame claiming the domain has nothing in it.
for (const [label, list] of [
  ["skills", skills], ["rules", rules], ["standards", standards],
  ["snippets", [...snippets]], ["tooling stacks", toolingStacks], ["gov stacks", gov.stacks],
]) {
  if (list.length === 0) {
    console.error(`regen-hero: the ${label} catalog is empty, refusing to write a zeroed hero`)
    process.exit(1)
  }
}

const values = {
  SKILL_COUNT: String(skills.length),
  RULE_COUNT: String(rules.length),
  STANDARD_COUNT: String(standards.length),
  SNIPPET_COUNT: String(snippets.size),
  GOV_STACK_COUNT: String(gov.stacks.length),
  TOOLING_STACK_COUNT: String(toolingStacks.length),
  SKILL_ENTRIES: entries(skills),
  RULE_ENTRIES: entries(rules),
  STANDARD_ENTRIES: entries(standards),
  SKILL_MORE: remaining(skills),
  RULE_MORE: remaining(rules),
  STANDARD_MORE: remaining(standards),
}

let html = await Bun.file(TEMPLATE).text()
for (const [key, value] of Object.entries(values)) {
  html = html.replaceAll(`{{${key}}}`, value)
}

const unresolved = html.match(/{{[A-Z_]+}}/g)
if (unresolved) {
  console.error(`regen-hero: unresolved placeholders ${[...new Set(unresolved)].join(", ")}`)
  process.exit(1)
}

await Bun.write(OUTPUT, html)
'
