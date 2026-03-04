#!/bin/bash
set -e
set -o pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="${PROJECT_ROOT:-$(dirname "$(dirname "$SCRIPT_DIR")")}"

source "$PROJECT_ROOT/scripts/lib/ui.sh"

OUTPUT_DIR="$PWD/.claude/.tmp"
OUTPUT_FILE="$OUTPUT_DIR/review.md"
TASKS_FILE="$PWD/.claude/TASKS.md"

show_help() {
  echo -e "${GREY}┌${NC}"
  log_step "Claude Review"
  echo -e "${GREY}│${NC}  ${WHITE}Usage:${NC} aitk claude review"
  echo -e "${GREY}│${NC}"
  echo -e "${GREY}│${NC}  Wraps Gemini output into a review prompt."
  echo -e "${GREY}│${NC}  Reads clipboard, pulls context from .claude/TASKS.md."
  echo -e "${GREY}│${NC}  Writes to .claude/.tmp/review.md ready to paste into fresh chat."
  echo -e "${GREY}│${NC}"
  echo -e "${GREY}│${NC}  ${WHITE}Prerequisites:${NC}"
  echo -e "${GREY}│${NC}    Copy Gemini response to clipboard before running"
  echo -e "${GREY}│${NC}    Requires xclip or xsel"
  echo -e "${GREY}│${NC}"
  echo -e "${GREY}│${NC}  ${WHITE}Options:${NC}"
  echo -e "${GREY}│${NC}    -h, --help    ${GREY}# Show this help message${NC}"
  echo -e "${GREY}└${NC}"
  exit 0
}

check_dependencies() {
  if command -v xclip >/dev/null 2>&1; then
    CLIPBOARD_CMD="xclip -selection clipboard -o"
  elif command -v xsel >/dev/null 2>&1; then
    CLIPBOARD_CMD="xsel --clipboard --output"
  else
    log_error "No clipboard tool found. Install xclip or xsel."
  fi

  if [ ! -f "$TASKS_FILE" ]; then
    log_error "TASKS.md not found at .claude/TASKS.md. Run \`aitk claude init\` first."
  fi
}

read_clipboard() {
  local content
  content=$(eval "$CLIPBOARD_CMD" 2>/dev/null)

  if [ -z "$content" ]; then
    log_error "Clipboard is empty. Copy Gemini response first."
  fi

  echo "$content"
}

read_tasks_context() {
  local in_progress
  in_progress=$(awk '/^## In Progress/{f=1; next} /^## /{f=0} f && NF' "$TASKS_FILE")

  if [ -z "$in_progress" ]; then
    in_progress=$(awk '/^## Up Next/{f=1; next} /^## /{f=0} f && NF' "$TASKS_FILE")
  fi

  echo "$in_progress"
}

write_review() {
  local gemini_output="$1"
  local tasks_context="$2"

  mkdir -p "$OUTPUT_DIR"

  {
    echo "# Review"
    echo ""
    echo "## Prompt"
    echo ""
    echo '```'
    echo "You are reviewing code for a feature. Your job is to produce a findings report only — no fixes, no rewrites."
    echo ""
    echo "[TASK]"
    echo "$tasks_context"
    echo ""
    echo "[GEMINI OUTPUT]"
    echo "$gemini_output"
    echo ""
    echo "Review for:"
    echo "1. Bugs and edge cases"
    echo "2. Error handling gaps"
    echo "3. Logic flaws that will cause problems when this code is extended"
    echo "4. Security issues"
    echo ""
    echo "Format findings as:"
    echo "- critical: must fix before moving to next feature"
    echo "- should-fix: fix in same session, not a blocker"
    echo "- minor: log and revisit, not worth fixing now"
    echo ""
    echo "Skip style comments. Be direct. If nothing is wrong, say so."
    echo '```'
  } >"$OUTPUT_FILE"
}

main() {
  if [[ "$1" == "-h" || "$1" == "--help" ]]; then
    show_help
  fi

  echo -e "${GREY}┌${NC}"

  check_dependencies

  log_step "Reading Clipboard"
  local gemini_output
  gemini_output=$(read_clipboard)
  log_info "Clipboard read"

  log_step "Reading TASKS.md"
  local tasks_context
  tasks_context=$(read_tasks_context)
  if [ -z "$tasks_context" ]; then
    log_warn "No active tasks found in TASKS.md — review will have no task context"
  else
    log_info "Task context loaded"
  fi

  log_step "Writing Review"
  write_review "$gemini_output" "$tasks_context"
  log_info "Written to .claude/.tmp/review.md"

  echo -e "${GREY}└${NC}\n"
  echo -e "${GREEN}✓ Review ready — paste .claude/.tmp/review.md into fresh Gemini chat${NC}"
}

main "$@"
