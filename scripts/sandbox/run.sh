#!/usr/bin/env bash
set -e
set -o pipefail

# Headless skill-test harness. Provisions a sandbox scenario, then drives a
# plugin skill through `claude -p` non-interactively and emits the run envelope
# on stdout so a calling agent can judge the result without a human session.

SCRIPT_DIR="$(cd "$(dirname "$(readlink -f "${BASH_SOURCE[0]}")")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
export PROJECT_ROOT

source "$PROJECT_ROOT/scripts/config.sh"
source "$PROJECT_ROOT/scripts/lib/ui.sh"

# Pinned for reproducibility and cost control. Override per run via env.
MODEL="${AITK_SKILL_TEST_MODEL:-sonnet}"
ALLOWED_TOOLS="${AITK_SKILL_TEST_TOOLS:-Bash,Read,Glob,Grep,Edit,Write}"
MAX_TURNS="${AITK_SKILL_TEST_MAX_TURNS:-20}"

show_help() {
  echo -e "${GREY}┌${NC}"
  echo -e "${GREY}├${NC} ${WHITE}Usage:${NC} run.sh <cat:cmd> <prompt> [scenario]"
  echo -e "${GREY}│${NC}"
  echo -e "${GREY}│${NC}  ${WHITE}Arguments:${NC}"
  echo -e "${GREY}│${NC}    cat:cmd   ${GREY}# Scenario to provision (e.g. git:commit)${NC}"
  echo -e "${GREY}│${NC}    prompt    ${GREY}# Skill invocation (e.g. \"/toolkit:git-commit\")${NC}"
  echo -e "${GREY}│${NC}    scenario  ${GREY}# Optional named scenario arm${NC}"
  echo -e "${GREY}│${NC}"
  echo -e "${GREY}│${NC}  ${WHITE}Env overrides:${NC}"
  echo -e "${GREY}│${NC}    AITK_SKILL_TEST_MODEL      ${GREY}# default sonnet${NC}"
  echo -e "${GREY}│${NC}    AITK_SKILL_TEST_TOOLS      ${GREY}# default Bash,Read,Glob,Grep,Edit,Write${NC}"
  echo -e "${GREY}│${NC}    AITK_SKILL_TEST_MAX_TURNS  ${GREY}# default 20${NC}"
  echo -e "${GREY}│${NC}"
  echo -e "${GREY}│${NC}  ${WHITE}Examples:${NC}"
  echo -e "${GREY}│${NC}    run.sh git:commit \"/toolkit:git-commit\""
  echo -e "${GREY}│${NC}    run.sh claude:feature \"/toolkit:claude-feature add a widget\" small"
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
  [ -z "$prompt" ] && log_error "Missing prompt. Pass the skill invocation, e.g. \"/toolkit:git-commit\"."

  # Provision fresh. manage-sandbox wipes and re-seeds .sandbox on every run.
  log_step "Provisioning $target"
  bash "$PROJECT_ROOT/scripts/manage-sandbox.sh" --no-header "$target" "$scenario" >&2

  # Drive the skill from the provisioned sandbox. --plugin-dir resolves any
  # skill, changed on the branch or not. stdout carries the JSON envelope.
  log_step "Running $prompt on $MODEL"
  local out
  out="$(cd "$PROJECT_ROOT/.sandbox" && claude -p "$prompt" \
    --plugin-dir "$PROJECT_ROOT/claude" \
    --model "$MODEL" \
    --output-format json \
    --permission-mode acceptEdits \
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

  trap - EXIT
  close_timeline
  # Machine-readable envelope for the calling agent.
  printf '%s\n' "$out"
}

main "$@"
