#!/usr/bin/env bash
set -e
set -o pipefail

SCRIPT_DIR="$(cd "$(dirname "$(readlink -f "${BASH_SOURCE[0]}")")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
export PROJECT_ROOT

source "$PROJECT_ROOT/scripts/config.sh"
source "$PROJECT_ROOT/scripts/lib/ui.sh"

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

# Keeps what re-scoring needs. `aitk sandbox check` recovers the tree assertions
# from surviving `.sandbox/` state, but `max_turns` reads the envelope and
# `write_scope` reads the writes list, both of which die with the temp files.
#
# Writes to stderr and disk only, since `docs/agents.md` makes stdout the data
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

  log_step "Provisioning $target"
  bash "$PROJECT_ROOT/scripts/manage-sandbox.sh" --no-header "$target" "$scenario" >&2

  local sandbox="$PROJECT_ROOT/.sandbox"
  local before after envelope writes
  before="$(mktemp)"
  after="$(mktemp)"
  envelope="$(mktemp)"
  writes="$(mktemp)"
  snapshot_tree "$sandbox" "$before"

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

  # The verdict decides the outcome. The envelope can only fail a run the
  # expectations would otherwise have passed, never pass one on its own.
  local verdict_code=0 verdict_json
  verdict_json="$(bun "$PROJECT_ROOT/src/cli.ts" sandbox check "$target" "$scenario" \
    --envelope "$envelope" --writes "$writes" --json)" || verdict_code=$?

  # The envelope stays on stdout so existing readers keep working, with the
  # verdict merged in. An agent reads the verdict here rather than parsing the
  # framed stderr, per the stream contract in `docs/agents.md`. A run that
  # returned output that does not parse still emits its verdict rather than both
  # to a jq error, since a silent stdout would read as a run that never happened.
  local merged
  if ! merged="$(printf '%s' "$out" |
    jq --argjson verdict "${verdict_json:-null}" '. + {verdict: $verdict}' 2>/dev/null)"; then
    log_warn "Envelope was not valid JSON. Emitting the verdict alone."
    merged="$(printf '{"is_error":true,"verdict":%s}' "${verdict_json:-null}")"
    verdict_code=1
  fi

  record_run "$target" "$scenario" "$merged" "$writes"
  rm -f "$before" "$after" "$envelope" "$writes"

  trap - EXIT
  close_timeline

  printf '%s\n' "$merged"

  return "$verdict_code"
}

main "$@"
