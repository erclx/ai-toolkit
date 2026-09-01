#!/usr/bin/env bash
# Fills every assets/*.html.tmpl from the CLI catalogs and the design source,
# writing the .html beside each one.
#
# The name says hero because the hero was the only template when it was written
# and every citation of it across docs/, .claude/context/, and src/ spells that
# name. Renaming the file is a sweep across roughly twenty surfaces for a
# cosmetic gain, so the file keeps its name and the loop below covers whatever
# templates the folder holds.
#
# The palette arrives the same way the counts do. `canon design css
# --no-components` emits the custom properties from src/design/tokens.ts and
# they land on the {{TOKENS}} placeholder, so neither frame carries its own copy
# of a hex value and a token moved at the source moves both captures. The
# component half is left out on purpose: it is a scrollbar and a status marker,
# and a static capture frame renders neither.
#
# Only the HTML regenerates here. The PNG beside it is a chromium render whose
# bytes move with the browser version, so asserting it in verify.sh would fail
# on a machine whose chromium differs rather than on a stale count. Rebuild the
# images with `canon capture assets --selector .window` after this script
# reports a change. The selector has no default, since the element a capture
# crops to belongs to the page rather than to the command, and `.window` is the
# class this repository's own two sources declare.
# That capture also writes a .stamp beside each PNG, which records the digest of
# the markup it rendered and is what the Hero stage compares, so a frame's three
# files commit together. The frame carries no version. `package.json` is bumped on main by the release
# tooling, so embedding it drifts every open branch on the next release and the
# stage then fails for work that touched nothing.
#
# Clone-only. `canon capture` ships now, but this script reads the repository's
# own catalogs, which a registry install does not carry.
set -e
set -o pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="${PROJECT_ROOT:-$(cd "$SCRIPT_DIR/../.." && pwd)}"

ASSET_DIR="$PROJECT_ROOT/assets"
LISTED=10

# `bun src/cli.ts` rather than `canon`, since a globally linked binary resolves to
# the main checkout no matter which worktree is running.
catalog() {
  (cd "$PROJECT_ROOT" && CANON_NON_INTERACTIVE=1 bun src/cli.ts "$@" --json 2>/dev/null)
}

TEMPLATES=("$ASSET_DIR"/*.html.tmpl)
if [ ! -f "${TEMPLATES[0]}" ]; then
  echo "regen-hero: no templates under $ASSET_DIR" >&2
  exit 1
fi

# Not routed through `catalog`, since the design emitter writes CSS on stdout
# rather than a `--json` record.
TOKEN_CSS="$(cd "$PROJECT_ROOT" && CANON_NON_INTERACTIVE=1 bun src/cli.ts design css --no-components)"
if [ -z "$TOKEN_CSS" ]; then
  echo "regen-hero: the design source emitted nothing, refusing to write an unstyled frame" >&2
  exit 1
fi

# The commands have no `--json` catalog of their own, so the count comes from
# `canon gov counts`, which already reads the registration block in the CLI
# entry point to judge a document stating its own command count. Reading that
# figure here rather than re-deriving it with a second regex is what keeps the
# two readings of `src/cli.ts` from drifting apart unwatched, which is the
# defect `canon gov counts` itself exists to catch.
# `gov counts` exits non-zero on an ordinary finding, unlike every `list` verb
# below, so its output is read past that under `set -e` rather than aborting
# a hero rebuild for a stale count somewhere unrelated in the tree.
COUNTS_JSON="$(catalog gov counts || true)"
SKILLS_JSON="$(catalog claude skills list)"
GOV_JSON="$(catalog gov list)"
STANDARDS_JSON="$(catalog standards list)"
SNIPPETS_JSON="$(catalog snippets list)"
TOOLING_JSON="$(catalog tooling list)"

for payload in "$COUNTS_JSON" "$SKILLS_JSON" "$GOV_JSON" "$STANDARDS_JSON" "$SNIPPETS_JSON" "$TOOLING_JSON"; do
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

printf '%s' "$COUNTS_JSON" >"$PAYLOAD_DIR/counts.json"
printf '%s' "$SKILLS_JSON" >"$PAYLOAD_DIR/skills.json"
printf '%s' "$GOV_JSON" >"$PAYLOAD_DIR/gov.json"
printf '%s' "$STANDARDS_JSON" >"$PAYLOAD_DIR/standards.json"
printf '%s' "$SNIPPETS_JSON" >"$PAYLOAD_DIR/snippets.json"
printf '%s' "$TOOLING_JSON" >"$PAYLOAD_DIR/tooling.json"
printf '%s' "$TOKEN_CSS" >"$PAYLOAD_DIR/tokens.css"

export PAYLOAD_DIR
export ASSET_DIR LISTED PROJECT_ROOT

bun --eval '
const { readFileSync, readdirSync } = require("node:fs")

const { PAYLOAD_DIR, ASSET_DIR, LISTED, PROJECT_ROOT } = process.env

const payload = (name) => readFileSync(PAYLOAD_DIR + "/" + name + ".json", "utf8")

// Indented to the depth a rule inside the `<style>` block sits at, so the
// emitted file passes the same formatter every other committed asset does.
const tokenCss = readFileSync(PAYLOAD_DIR + "/tokens.css", "utf8")
  .trimEnd()
  .split("\n")
  .map((line) => (line === "" ? "" : "      " + line))
  .join("\n")

const COUNTS_JSON = payload("counts")
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
const slug = (entry) => entry.name.replace(/^\d+-/, "")
const rules = gov.rules.map(slug)
// A rule no stack names is opt-in behind `--add`, so featuring one advertises
// an entry no ordinary `canon gov install` delivers. The column samples the
// stack-reached subset while its count and remainder describe the whole catalog.
const stacked = new Set(gov.stacks.flatMap((stack) => stack.rules))
const deliveredRules = gov.rules.filter((entry) => stacked.has(entry.name)).map(slug)
const standards = JSON.parse(STANDARDS_JSON).standards.map((entry) => entry.name)
const snippets = new Set(
  JSON.parse(SNIPPETS_JSON).categories.flatMap((category) => category.entries),
)
const toolingStacks = JSON.parse(TOOLING_JSON).stacks
const commandCount = JSON.parse(COUNTS_JSON).catalogs.commands
if (!commandCount) {
  console.error("regen-hero: gov counts read no commands catalog, refusing to write a zeroed hero")
  process.exit(1)
}

const MARK_SVG = (await Bun.file(`${PROJECT_ROOT}/assets/brand/mark.svg`).text()).trim()
if (!MARK_SVG) {
  console.error("regen-hero: assets/brand/mark.svg read empty, refusing to write a hero with no mark")
  process.exit(1)
}

const escape = (value) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")

// Even spacing across the sorted catalog rather than its first N, so a column
// whose names share a prefix does not read as a narrower catalog than the one
// that ships. Rules and standards sample. Skills do not, because the even step
// lands on the entries closest to commodity and on none of the workflow the
// toolkit exists to carry.
const sample = (names) => {
  if (names.length <= listed) return names
  const step = names.length / listed
  return Array.from({ length: listed }, (_, i) => names[Math.floor(i * step)])
}

// The first seven are the method and exist nowhere else. The last three are
// recognizable on sight and are what keeps a column of chosen names from
// reading as an all-`claude-` catalog, which is the failure the sampler above
// was written against.
const FEATURED_SKILLS = [
  "claude-feature",
  "claude-groundwork",
  "claude-intake",
  "claude-orchestrate",
  "claude-autoship",
  "claude-pr-review",
  "claude-tasks",
  "git-ship",
  "setup-init",
  "systematic-debugging",
]

// A chosen name is maintained by hand where a sample never goes stale, so a
// rename has to fail the run rather than quietly shrink the column. This is
// what makes the trade acceptable.
//
// The length is asserted because the `+N more` figure below counts down from
// `listed` rather than from what this returns, so a list of any other length
// renders a remainder that is wrong by the difference.
const featured = (names, chosen) => {
  if (chosen.length !== listed) {
    console.error(`regen-hero: ${chosen.length} featured skills, expected ${listed}`)
    process.exit(1)
  }
  const catalog = new Set(names)
  const missing = chosen.filter((name) => !catalog.has(name))
  if (missing.length > 0) {
    console.error(`regen-hero: featured skills missing from the catalog: ${missing.join(", ")}`)
    process.exit(1)
  }
  return chosen
}

const markup = (names) =>
  names
    .map((name) => `            <div class="entry">${escape(name)}</div>`)
    .join("\n")

const entries = (names) => markup(sample(names))

const remaining = (names) => String(Math.max(0, names.length - listed))

// An empty array is well-formed JSON, so the shell guard on an empty payload
// does not catch a catalog whose tree went missing. A zeroed count would ship a
// frame claiming the domain has nothing in it.
for (const [label, list] of [
  ["skills", skills], ["rules", rules], ["standards", standards],
  ["snippets", [...snippets]], ["tooling stacks", toolingStacks], ["gov stacks", gov.stacks],
  ["stack-delivered rules", deliveredRules],
]) {
  if (list.length === 0) {
    console.error(`regen-hero: the ${label} catalog is empty, refusing to write a zeroed hero`)
    process.exit(1)
  }
}

const values = {
  TOKENS: tokenCss,
  SKILL_COUNT: String(skills.length),
  RULE_COUNT: String(rules.length),
  STANDARD_COUNT: String(standards.length),
  SNIPPET_COUNT: String(snippets.size),
  GOV_STACK_COUNT: String(gov.stacks.length),
  TOOLING_STACK_COUNT: String(toolingStacks.length),
  COMMAND_COUNT: String(commandCount),
  MARK_SVG,
  SKILL_ENTRIES: markup(featured(skills, FEATURED_SKILLS)),
  RULE_ENTRIES: entries(deliveredRules),
  STANDARD_ENTRIES: entries(standards),
  SKILL_MORE: remaining(skills),
  RULE_MORE: remaining(rules),
  STANDARD_MORE: remaining(standards),
}

// Every template takes the same value map, so one carrying no count placeholder
// simply resolves none of them. What a template must not do is name a
// placeholder nobody fills, which the unresolved check below catches per file.
const templates = readdirSync(ASSET_DIR)
  .filter((name) => name.endsWith(".html.tmpl"))
  .sort()

if (templates.length === 0) {
  console.error(`regen-hero: no templates under ${ASSET_DIR}`)
  process.exit(1)
}

for (const template of templates) {
  let html = await Bun.file(ASSET_DIR + "/" + template).text()
  for (const [key, value] of Object.entries(values)) {
    html = html.replaceAll(`{{${key}}}`, value)
  }

  const unresolved = html.match(/{{[A-Z_]+}}/g)
  if (unresolved) {
    console.error(`regen-hero: ${template} carries unresolved placeholders ${[...new Set(unresolved)].join(", ")}`)
    process.exit(1)
  }

  await Bun.write(ASSET_DIR + "/" + template.replace(/\.tmpl$/, ""), html)
}
'
