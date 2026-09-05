#!/usr/bin/env bash
# Writes web/src/fixtures/agent-view.json from a real `canon sessions list
# --json` read of this repository's own worker sessions.
#
# The page it feeds re-creates an orchestrator dispatching workers, which is the
# one thing this toolkit does that no other surface here shows. A re-creation
# earns nothing if the rows behind it are invented, so the session half is a
# live listing and never a literal.
#
# Two fields cannot come from that listing and are transcribed by hand into the
# table below. The activity text is written by Claude Code into its own status
# line and no verb here reports it. The pull request number sits on a task file
# with nothing joining a session record to it, which the plan behind this script
# took as a trade rather than building the join. Both are recorded as
# transcribed in the fixture's own header, so a reader of the committed file can
# tell which half was measured and which was typed.
#
# The honesty cost this leaves open is the one assets/captures/install.html.tmpl
# already documents for the terminal frames: a hand-edit after generation
# defeats the discipline silently, and nothing here detects one.
#
# Clone-only. It reads this repository's own sessions, and a registry install
# carries no such listing.
set -e
set -o pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="${PROJECT_ROOT:-$(cd "$SCRIPT_DIR/../.." && pwd)}"

OUT="$PROJECT_ROOT/web/src/fixtures/agent-view.json"

# Transcribed half, keyed by branch. A branch is the stable identity here: a
# session name is derived from whatever the session turned out to be doing and
# moves within the hour, where the branch outlives the session that cut it.
#
# Each row is `branch|activity|pullRequest`. An empty pull request field is a
# branch whose task file recorded no number when the snapshot was taken, which
# is the ordinary state of a worker that has not reached its ship step yet.
# Re-transcribe this table against a fresh listing rather than editing the
# generated file.
TRANSCRIBED=(
  "feat/agent-view-and-deploy|Building the live agent view|"
  "feat/answer-gate-phrasing|Widening the plan answer gate|"
  "feat/labels-scan-body-file|Scanning label bodies from a file|"
  "feat/web-context-entry|Writing the web context entry|"
)

# The listing reports a session's repository as the main `.git` directory, which
# is what this resolves whether the script runs from the main checkout or from a
# linked worktree. Comparing against PROJECT_ROOT instead would match nothing
# from a worktree, where the two differ.
MAIN_GIT_DIR="$(cd "$PROJECT_ROOT" && git rev-parse --path-format=absolute --git-common-dir)"

# `bun src/cli.ts` rather than `canon`, since a globally linked binary resolves
# to the main checkout no matter which worktree is running, and this script is
# run from a worktree as often as not.
SESSIONS_JSON="$(cd "$PROJECT_ROOT" && CANON_NON_INTERACTIVE=1 bun src/cli.ts sessions list --json 2>/dev/null)"

if [ -z "$SESSIONS_JSON" ]; then
  echo "regen-agent-fixture: the session listing returned nothing, refusing to write an empty fixture" >&2
  exit 1
fi

# The listing crosses into the eval as a file rather than an environment entry,
# for the reason regen-hero.sh records: Linux caps a single env string at 128KB
# and a machine running many sessions can cross it, which fails the exec with
# E2BIG before any check can report a thing.
SESSIONS_FILE="$(mktemp)"
trap 'rm -f "$SESSIONS_FILE"' EXIT
printf '%s' "$SESSIONS_JSON" >"$SESSIONS_FILE"

TRANSCRIBED_ROWS="$(printf '%s\n' "${TRANSCRIBED[@]}")"
READ_AT="$(date -u +%Y-%m-%dT%H:%M:%SZ)"

export SESSIONS_FILE OUT PROJECT_ROOT READ_AT TRANSCRIBED_ROWS MAIN_GIT_DIR

bun --eval '
const { readFileSync } = require("node:fs")

const { SESSIONS_FILE, OUT, PROJECT_ROOT, READ_AT, TRANSCRIBED_ROWS, MAIN_GIT_DIR } =
  process.env

const listing = JSON.parse(readFileSync(SESSIONS_FILE, "utf8"))

// Keyed by branch for the reason the shell comment gives: a session name is
// derived from what the session turned out to be doing and goes stale inside
// the hour a build takes.
const transcribed = new Map(
  TRANSCRIBED_ROWS.split("\n")
    .filter((line) => line.trim() !== "")
    .map((line) => {
      const [branch, activity, pullRequest] = line.split("|")
      return [
        branch,
        { activity, pullRequest: pullRequest ? Number(pullRequest) : null },
      ]
    }),
)

// A worker of this repository is what the page is about. Every other row in the
// listing is another project on the same machine, and a page claiming them
// would be counting sessions rather than showing one dispatch.
const workers = listing.sessions.filter(
  (session) =>
    session.repository === MAIN_GIT_DIR &&
    typeof session.branch === "string" &&
    session.branch !== "main",
)

if (workers.length === 0) {
  console.error(
    "regen-agent-fixture: the listing carried no worker session for this repository, refusing to write an empty fixture",
  )
  process.exit(1)
}

const missing = workers.filter((session) => !transcribed.has(session.branch))
if (missing.length > 0) {
  console.error(
    "regen-agent-fixture: no transcribed activity for " +
      missing.map((session) => session.branch).join(", ") +
      ". Transcribe the activity text into the table in this script rather than editing the generated fixture.",
  )
  process.exit(1)
}

const sessions = workers
  .map((session) => {
    const hand = transcribed.get(session.branch)
    return {
      name: session.name,
      branch: session.branch,
      status: session.status,
      activity: hand.activity,
      pullRequest: hand.pullRequest,
    }
  })
  .sort((a, b) => a.branch.localeCompare(b.branch))

const fixture = {
  // Read by web/src/components/AgentView.astro. Every field below is either a
  // live read or a hand transcription, and this header is what says which.
  generatedBy: "scripts/core/regen-agent-fixture.sh",
  readAt: READ_AT,
  source: {
    command: "canon sessions list --json",
    live: ["name", "branch", "status"],
    transcribed: {
      activity:
        "written by Claude Code into its own status line, which no verb here reports",
      pullRequest:
        "read off a task file by hand, since nothing joins a session record to one",
    },
  },
  sessions,
}

await Bun.write(OUT, JSON.stringify(fixture, null, 2) + "\n")
console.error(
  `regen-agent-fixture: wrote ${sessions.length} session rows to ${OUT.replace(PROJECT_ROOT + "/", "")}`,
)
'
