#!/usr/bin/env bash
set -e
set -o pipefail

SCRIPT_DIR="$(cd "$(dirname "$(readlink -f "${BASH_SOURCE[0]}")")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
export PROJECT_ROOT

source "$PROJECT_ROOT/scripts/config.sh"
source "$PROJECT_ROOT/scripts/lib/ui.sh"
source "$PROJECT_ROOT/scripts/lib/sandbox-path.sh"

# The agent pushes from inside the sandbox on its own, in a session this script
# spawns, so the guard has to reach that environment and not only provisioning.
export GIT_TERMINAL_PROMPT=0

MODEL="${AITK_SKILL_TEST_MODEL:-sonnet}"
ALLOWED_TOOLS="${AITK_SKILL_TEST_TOOLS:-Bash,Read,Glob,Grep,Edit,Write}"
# The only budget. `max_turns` in an arm's `expect.toml` is a ceiling asserted
# after the run, not a cap enforced during it, so a declaration cannot raise what
# it runs under. An arm needing more than this truncates, and a truncated run
# fails the same assertions a reasoning miss does with nothing to separate them.
MAX_TURNS="${AITK_SKILL_TEST_MAX_TURNS:-30}"

# `bypassPermissions` is the only mode that lets a run write under `.claude/`,
# which most arms need. The scoping the permission layer would have given comes
# from `write_scope` instead, asserted after the run rather than enforced during
# it, so a skill that writes where it should not still wrote there.
PERMISSION_MODE="${AITK_SKILL_TEST_PERMISSION_MODE:-bypassPermissions}"

# Records `hash<TAB>path` per file so the post-run comparison can name what the
# session wrote. A diff against `refs/sandbox/baseline` cannot stand in for this:
# an arm that sets SANDBOX_SKIP_AUTO_COMMIT leaves its last stage uncommitted, so
# the fixtures the harness staged would read as session writes.
snapshot_tree() {
  local dir="$1"
  local manifest="$2"
  (cd "$dir" && find . -type f -not -path "./.git/*" -exec sha1sum {} +) |
    sed "s|\./||" | sort -k2 >"$manifest"
}

# Reports both sides of a change, so a deletion is a write. Emitting only the
# after side would let a file removed outside the declared scope produce no
# assertion at all, which is the one way this check stayed weaker than the
# permission scoping it replaced. A modified file appears on both sides and
# collapses to one path once the hash field is stripped.
#
# `diff` exits 1 when the manifests differ, which is the normal case, so the
# pipeline swallows it or `set -e` kills the run before the verdict prints.
writes_between() {
  local before="$1"
  local after="$2"
  { diff --unchanged-group-format="" --old-group-format="%<" \
    --new-group-format="%>" --changed-group-format="%<%>" \
    "$before" "$after" || true; } |
    awk '{ $1=""; sub(/^ /, ""); print }' | sort -u
}

# The roots a run must not write shared session scratch to. `snapshot_tree` reads
# the sandbox alone, so before this a session that resolved that scratch against
# a toolkit root wrote where no manifest looked: the run reported success, the
# write list came back empty, and `write_scope` had nothing to assert against.
#
# It makes an escape visible rather than impossible. A session can write to a
# home directory, to a sibling worktree, or to any path outside these roots, and
# none of that is watched. The standing limits in
# `.claude/context/sandbox/overview.md` carry what stays invisible.
escape_roots() {
  printf '%s\n' "$PROJECT_ROOT"

  # A linked worktree is the normal place to develop this repository, and the
  # rule an escaping session follows sends scratch to the main root rather than to
  # the worktree it was launched from. Watching only `$PROJECT_ROOT` would miss
  # the escape in exactly the case it was measured in.
  local main_root
  main_root="$(git -C "$PROJECT_ROOT" worktree list --porcelain 2>/dev/null |
    grep -m 1 '^worktree ' | cut -d' ' -f2-)"
  if [ -n "$main_root" ] && [ "$main_root" != "$PROJECT_ROOT" ]; then
    printf '%s\n' "$main_root"
  fi

  return 0
}

# The four directories the seed's shared-scratch rule names, and the whole of
# where an escape lands. A session that resolves that rule against a toolkit root
# writes here and nowhere else, so watching these rather than the whole root
# costs no detection.
#
# It buys the difference between a signal and noise. Nothing distinguishes the
# spawned session's writes from the operator's own, so a watch over the whole
# root reports ordinary editing during a run as an escape. Measured 2026-08-02:
# three runs against the relocated sandbox all wrote their report to the right
# place, and two of the three still reported an escape under the wide watch,
# naming a context entry being edited in the session that launched them.
# Narrowing to these four leaves the report readable without discarding any
# destination the failure reaches.
ESCAPE_SCRATCH_DIRS=(.claude/plans .claude/review .claude/memory .claude/tasks)

# The scope stated for an arm author rather than left to infer from the name
# above. `escape_roots` times two, `ESCAPE_SCRATCH_DIRS` times four: this watch
# reaches nothing past those eight destinations, so a nested run's own escape,
# such as a live session record `aitk sandbox check` cannot see, is invisible
# here whether or not an arm declares `escape_scope`.
#
# An arm whose skill is meant to reach past the sandbox tree declares
# `escape_scope` in its `expect.toml`, a set of globs matched against this
# watch's own findings the way `write_scope` matches the write list. A declared
# scope turns what was an unattributed warning into a mechanical result: a
# write matching a glob passes as expected, anything else fails, and `claude:
# aitk-rollout` is the first arm to declare one, at an empty list, since its
# only tested path is the refusal that must leave this watch's roots untouched.
#
# It bounds a legitimate write, not the run. Nothing here stops a session from
# writing outside these eight destinations, and nothing separates this run's
# writes from a sibling's within them, so a scoped pass says the declared
# destinations held and nothing more. Read `.claude/context/sandbox/overview.md`
# and `.claude/context/sandbox/coverage.md` before writing a claim past that.

# Set whenever any watched root holds at least one of the four directories,
# across every call this run makes. A root with none of them contributes no
# manifest and no diff, which reads identically to a watch that ran clean, so
# `checkEscapeScope` needs this to tell "watched and clean" from "nothing to
# watch" apart.
escape_watched=0

snapshot_root() {
  local dir="$1"
  local manifest="$2"

  local -a targets=()
  local sub
  for sub in "${ESCAPE_SCRATCH_DIRS[@]}"; do
    [ -d "$dir/$sub" ] && targets+=("./$sub")
  done

  : >"$manifest"
  [ ${#targets[@]} -eq 0 ] && return 0
  escape_watched=1

  (cd "$dir" && find "${targets[@]}" -type f -exec sha1sum {} +) |
    sed "s|\./||" | sort -k2 >"$manifest"
}

# Keeps what re-scoring needs. `aitk sandbox check` recovers the tree assertions
# from surviving sandbox state, but `max_turns` reads the envelope and
# `write_scope` reads the writes list, both of which die with the temp files.
#
# Writes to stderr and disk only, since `docs/agents/output-shape.md` makes stdout the data
# contract, so a failure here warns and lets the verdict print regardless.
record_run() {
  local target="$1"
  local scenario="$2"
  local merged="$3"
  local writes="$4"

  local runs_dir record stamp
  runs_dir="$PROJECT_ROOT/.claude/.tmp/sandbox-runs"
  stamp="$(date +%Y%m%dT%H%M%S)"
  record="$runs_dir/$(printf '%s' "${target}${scenario:+-$scenario}" | tr ':' '-')-$stamp.json"

  if ! mkdir -p "$runs_dir" 2>/dev/null; then
    log_warn "Could not create $runs_dir. The run was not recorded."
    return 0
  fi

  if printf '%s' "$merged" |
    jq --argjson writes "$(jq -R -s 'split("\n") | map(select(length > 0))' "$writes")" \
      '. + {writes: $writes}' >"$record" 2>/dev/null; then
    log_info "Run recorded at ${record#"$PROJECT_ROOT"/}"
  else
    rm -f "$record"
    log_warn "Could not record the run at $record."
  fi
}

show_help() {
  echo -e "${GREY}┌${NC}"
  echo -e "${GREY}├${NC} ${WHITE}Usage:${NC} run.sh <cat:cmd> <prompt> [scenario]"
  echo -e "${GREY}│${NC}"
  echo -e "${GREY}│${NC}  ${WHITE}Arguments:${NC}"
  echo -e "${GREY}│${NC}    cat:cmd   ${GREY}# Scenario to provision (e.g. git:commit)${NC}"
  echo -e "${GREY}│${NC}    prompt    ${GREY}# Skill invocation (e.g. \"/aitk:git-commit\")${NC}"
  echo -e "${GREY}│${NC}    scenario  ${GREY}# Optional named scenario arm${NC}"
  echo -e "${GREY}│${NC}"
  echo -e "${GREY}│${NC}  ${WHITE}Env overrides:${NC}"
  echo -e "${GREY}│${NC}    AITK_SKILL_TEST_MODEL      ${GREY}# default sonnet${NC}"
  echo -e "${GREY}│${NC}    AITK_SKILL_TEST_TOOLS      ${GREY}# default Bash,Read,Glob,Grep,Edit,Write${NC}"
  echo -e "${GREY}│${NC}    AITK_SKILL_TEST_MAX_TURNS  ${GREY}# default 30${NC}"
  echo -e "${GREY}│${NC}    AITK_SKILL_TEST_PERMISSION_MODE ${GREY}# default bypassPermissions${NC}"
  echo -e "${GREY}│${NC}"
  echo -e "${GREY}│${NC}  ${WHITE}Examples:${NC}"
  echo -e "${GREY}│${NC}    run.sh git:commit \"/aitk:git-commit\""
  echo -e "${GREY}│${NC}    run.sh claude:feature \"/aitk:claude-feature add a widget\" small"
  echo -e "${GREY}└${NC}"
  exit 0
}

main() {
  if [[ "${1:-}" == "-h" || "${1:-}" == "--help" || -z "${1:-}" ]]; then
    show_help
  fi

  open_timeline "aitk skill-test"
  trap close_timeline EXIT

  if [[ "$PWD" != "$PROJECT_ROOT"* ]]; then
    log_error "Run this from inside the toolkit repository."
  fi
  command -v claude >/dev/null 2>&1 || log_error "claude CLI not found on PATH."

  local target="$1"
  local prompt="${2:-}"
  local scenario="${3:-}"

  [[ "$target" != *":"* ]] && log_error "Invalid target. Use <category>:<command>, e.g. git:commit."
  [ -z "$prompt" ] && log_error "Missing prompt. Pass the skill invocation, e.g. \"/aitk:git-commit\"."

  # Minted here, in this shell rather than inside a `$(...)` capture, so the
  # export survives into the two children below: manage-sandbox.sh resolves
  # the same tree during provisioning, and the `sandbox check` at the end
  # resolves it again to score what that provisioning produced.
  mint_sandbox_run_id

  local sandbox
  sandbox="$(resolve_sandbox_dir)"
  log_step "Sandbox: $sandbox"

  log_step "Provisioning $target"
  bash "$PROJECT_ROOT/scripts/manage-sandbox.sh" --no-header "$target" "$scenario" >&2

  local before after envelope writes escapes
  before="$(mktemp)"
  after="$(mktemp)"
  envelope="$(mktemp)"
  writes="$(mktemp)"
  escapes="$(mktemp)"
  snapshot_tree "$sandbox" "$before"

  local -a escape_dirs=() escape_manifests=()
  local root manifest
  while IFS= read -r root; do
    [ -d "$root" ] || continue
    manifest="$(mktemp)"
    snapshot_root "$root" "$manifest"
    escape_dirs+=("$root")
    escape_manifests+=("$manifest")
  done < <(escape_roots)

  log_step "Running $prompt on $MODEL"
  local out
  out="$(cd "$sandbox" && claude -p "$prompt" \
    --plugin-dir "$PROJECT_ROOT/claude" \
    --model "$MODEL" \
    --output-format json \
    --permission-mode "$PERMISSION_MODE" \
    --allowedTools "$ALLOWED_TOOLS" \
    --max-turns "$MAX_TURNS")"

  local is_error result cost turns denials
  is_error="$(printf '%s' "$out" | jq -r '.is_error' 2>/dev/null || echo "unknown")"
  result="$(printf '%s' "$out" | jq -r '.result' 2>/dev/null || echo "")"
  cost="$(printf '%s' "$out" | jq -r '.total_cost_usd' 2>/dev/null || echo "?")"
  turns="$(printf '%s' "$out" | jq -r '.num_turns' 2>/dev/null || echo "?")"
  denials="$(printf '%s' "$out" | jq -r '.permission_denials | length' 2>/dev/null || echo "?")"

  log_step "Result: error=$is_error turns=$turns cost=\$$cost denials=$denials"
  printf '%s\n' "$result" >&2

  snapshot_tree "$sandbox" "$after"
  writes_between "$before" "$after" >"$writes"
  printf '%s' "$out" >"$envelope"

  # Taken before the verdict runs, since `aitk sandbox check` and `record_run`
  # both write under a watched root themselves.
  local index=0 after_manifest
  : >"$escapes"
  for root in "${escape_dirs[@]}"; do
    after_manifest="$(mktemp)"
    snapshot_root "$root" "$after_manifest"
    writes_between "${escape_manifests[$index]}" "$after_manifest" |
      sed "s|^|${root%/}/|" >>"$escapes"
    rm -f "${escape_manifests[$index]}" "$after_manifest"
    index=$((index + 1))
  done

  # The verdict decides the outcome. The envelope can only fail a run the
  # expectations would otherwise have passed, never pass one on its own.
  local -a watched_flag=()
  [ "$escape_watched" -eq 1 ] && watched_flag=(--escapes-watched)

  local verdict_code=0 verdict_json
  verdict_json="$(bun "$PROJECT_ROOT/src/cli.ts" sandbox check "$target" "$scenario" \
    --envelope "$envelope" --writes "$writes" --escapes "$escapes" \
    "${watched_flag[@]}" --json)" || verdict_code=$?

  # The envelope stays on stdout so existing readers keep working, with the
  # verdict merged in. An agent reads the verdict here rather than parsing the
  # framed stderr, per the stream contract in `docs/agents/output-shape.md`. A run that
  # returned output that does not parse still emits its verdict rather than both
  # to a jq error, since a silent stdout would read as a run that never happened.
  #
  # An escape rides alongside the verdict rather than inside it. The verdict
  # answers what the sandbox contains, and a file the session put somewhere else
  # is not in that tree to be asserted over.
  #
  # It reports without failing, which is the same relationship `write_scope` has
  # to the writes it names. Nothing here distinguishes the spawned session's
  # writes from the operator's own, and on a machine running parallel sessions
  # the watched directories are rarely quiet: of five runs on 2026-08-02, three
  # reported an escape and every one named a file another session was writing.
  # Failing on that would trade the silence this replaced for a red verdict that
  # says nothing about the skill, which is the flaky arm the whole task exists to
  # avoid. What enforces the scope is that the sandbox now sits outside the
  # repository, so a correct run has nothing to escape with.
  local escapes_json
  escapes_json="$(jq -R -s 'split("\n") | map(select(length > 0))' "$escapes")"

  if [ -s "$escapes" ]; then
    log_warn "Shared scratch changed under a toolkit root during this run:"
    while IFS= read -r path; do
      [ -n "$path" ] && log_rem "$path"
    done <"$escapes"
    log_warn "No assertion covers these. Check them against what else was running."
  fi

  local merged
  if ! merged="$(printf '%s' "$out" |
    jq --argjson verdict "${verdict_json:-null}" \
      --argjson escapes "$escapes_json" \
      '. + {verdict: $verdict, escapes: $escapes}' 2>/dev/null)"; then
    log_warn "Envelope was not valid JSON. Emitting the verdict alone."
    merged="$(printf '{"is_error":true,"verdict":%s,"escapes":%s}' \
      "${verdict_json:-null}" "$escapes_json")"
    verdict_code=1
  fi

  record_run "$target" "$scenario" "$merged" "$writes"
  rm -f "$before" "$after" "$envelope" "$writes" "$escapes"

  trap - EXIT
  close_timeline

  printf '%s\n' "$merged"

  return "$verdict_code"
}

main "$@"
