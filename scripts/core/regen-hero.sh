#!/usr/bin/env bash
# Fills assets/hero.html.tmpl from the CLI catalogs and writes assets/hero.html.
#
# Only the HTML regenerates here. The PNG beside it is a chromium render whose
# bytes move with the browser version, so asserting it in verify.sh would fail
# on a machine whose chromium differs rather than on a stale count. Rebuild the
# image with `aitk capture assets/hero.html` after this script reports a change.
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

export SKILLS_JSON GOV_JSON STANDARDS_JSON SNIPPETS_JSON TOOLING_JSON
export TEMPLATE OUTPUT LISTED PROJECT_ROOT

bun --eval '
const {
  SKILLS_JSON, GOV_JSON, STANDARDS_JSON, SNIPPETS_JSON, TOOLING_JSON,
  TEMPLATE, OUTPUT, LISTED, PROJECT_ROOT,
} = process.env

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

const version = JSON.parse(
  await Bun.file(`${PROJECT_ROOT}/package.json`).text(),
).version

const values = {
  VERSION: version,
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
