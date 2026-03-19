#!/bin/bash
set -e
set -o pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="${PROJECT_ROOT:-$(dirname "$(dirname "$SCRIPT_DIR")")}"

source "$PROJECT_ROOT/scripts/lib/ui.sh"
source "$PROJECT_ROOT/scripts/lib/gov.sh"
trap close_timeline EXIT

RULES_DIR="$PWD/.cursor/rules"
IMPLEMENTER_TEMPLATE="$PWD/.claude/IMPLEMENTER.md"
PLANNER_TEMPLATE="$PWD/.claude/PLANNER.md"
OUTPUT_DIR="$PWD/.claude/.tmp"
CLAUDE_DIR="$PWD/.claude"

show_help() {
  echo -e "${GREY}┌${NC}"
  echo -e "${GREY}├${NC} ${WHITE}Usage:${NC} aitk claude prompt"
  echo -e "${GREY}│${NC}"
  echo -e "${GREY}│${NC}  Generates master prompts from installed cursor rules."
  echo -e "${GREY}│${NC}  Reads templates from .claude/PLANNER.md and .claude/IMPLEMENTER.md."
  echo -e "${GREY}│${NC}  Writes output to .claude/.tmp/."
  echo -e "${GREY}│${NC}  Copies REVIEWER.md to .claude/.tmp/REVIEWER.md."
  echo -e "${GREY}│${NC}"
  echo -e "${GREY}│${NC}  ${WHITE}Prerequisites:${NC}"
  echo -e "${GREY}│${NC}    Run 'aitk claude init' to seed PLANNER.md and IMPLEMENTER.md"
  echo -e "${GREY}│${NC}    Run 'aitk gov sync' to install rules for your stack"
  echo -e "${GREY}│${NC}"
  echo -e "${GREY}│${NC}  ${WHITE}Options:${NC}"
  echo -e "${GREY}│${NC}    -h, --help    ${GREY}# Show this help message${NC}"
  echo -e "${GREY}└${NC}"
  exit 0
}

check_dependencies() {
  if [ ! -d "$RULES_DIR" ] || ! ls "$RULES_DIR"/*.mdc >/dev/null 2>&1; then
    log_error "No rules found at .cursor/rules/. Run \`aitk gov install\` first."
  fi

  if [ ! -f "$IMPLEMENTER_TEMPLATE" ]; then
    log_error "IMPLEMENTER.md not found at .claude/IMPLEMENTER.md. Run \`aitk claude init\` first."
  fi

  if [ ! -f "$PLANNER_TEMPLATE" ]; then
    log_error "PLANNER.md not found at .claude/PLANNER.md. Run \`aitk claude init\` first."
  fi
}

substitute_placeholder() {
  local placeholder="$1"
  local content_file="$2"
  local target_file="$3"
  local tmp_file
  tmp_file=$(mktemp)

  local split_line
  split_line=$(grep -n -F "$placeholder" "$target_file" | cut -d: -f1 || true)

  if [ -z "$split_line" ]; then
    rm "$tmp_file"
    return
  fi

  head -n $((split_line - 1)) "$target_file" >"$tmp_file"
  cat "$content_file" >>"$tmp_file"
  tail -n +$((split_line + 1)) "$target_file" >>"$tmp_file"
  mv "$tmp_file" "$target_file"
}

inject_placeholder_file() {
  local name="$1"
  local placeholder="$2"
  local target_file="$3"
  local src="$CLAUDE_DIR/$name"

  if [ ! -f "$src" ]; then
    log_warn "$name not found, skipping"
    return
  fi

  if ! grep -qF "$placeholder" "$target_file" 2>/dev/null; then
    log_warn "$placeholder not found in template, skipping $name"
    return
  fi

  substitute_placeholder "$placeholder" "$src" "$target_file"
  log_info "$name"
}

build_implementer() {
  local payload_file
  payload_file=$(build_rules_payload "$RULES_DIR")

  local output_file="$OUTPUT_DIR/IMPLEMENTER.md"
  cp "$IMPLEMENTER_TEMPLATE" "$output_file"

  substitute_placeholder "{{GOVERNANCE_RULES}}" "$payload_file" "$output_file"
  rm "$payload_file"

  log_step "Injecting Implementer context"
  inject_placeholder_file "TASKS.md" "{{TASKS}}" "$output_file"
  inject_placeholder_file "REQUIREMENTS.md" "{{REQUIREMENTS}}" "$output_file"
  inject_placeholder_file "ARCHITECTURE.md" "{{ARCHITECTURE}}" "$output_file"
}

build_planner() {
  local output_file="$OUTPUT_DIR/PLANNER.md"
  cp "$PLANNER_TEMPLATE" "$output_file"

  log_step "Injecting Planner context"

  local prose_src="$PROJECT_ROOT/standards/prose.md"
  if [ -f "$prose_src" ] && grep -qF "{{PROSE}}" "$output_file" 2>/dev/null; then
    substitute_placeholder "{{PROSE}}" "$prose_src" "$output_file"
    log_info "prose.md"
  elif ! [ -f "$prose_src" ]; then
    log_warn "standards/prose.md not found, skipping"
  fi

  local planner_stack="$PROJECT_ROOT/.cursor/stacks/planner.toml"
  if [ -f "$planner_stack" ] && grep -qF "{{GOV_PLANNER}}" "$output_file" 2>/dev/null; then
    local stack_filter
    stack_filter=$(grep '^rules' "$planner_stack" | sed 's/rules = \[//;s/\]//' | tr -d '"' | tr ',' ' ' | xargs)
    local gov_payload
    gov_payload=$(build_rules_payload "$RULES_DIR" "$stack_filter")
    substitute_placeholder "{{GOV_PLANNER}}" "$gov_payload" "$output_file"
    rm -f "$gov_payload"
    log_info "GOV-PLANNER (planner stack)"
  elif ! [ -f "$planner_stack" ]; then
    log_warn "planner stack not found, skipping {{GOV_PLANNER}}"
  fi

  inject_placeholder_file "TASKS.md" "{{TASKS}}" "$output_file"
  inject_placeholder_file "REQUIREMENTS.md" "{{REQUIREMENTS}}" "$output_file"
  inject_placeholder_file "ARCHITECTURE.md" "{{ARCHITECTURE}}" "$output_file"
  inject_placeholder_file "DESIGN.md" "{{DESIGN}}" "$output_file"
  inject_placeholder_file "WIREFRAMES.md" "{{WIREFRAMES}}" "$output_file"
}

main() {
  if [[ "$1" == "-h" || "$1" == "--help" ]]; then
    show_help
  fi

  check_dependencies

  local count
  count=$(find "$RULES_DIR" -type f -name "*.mdc" | wc -l | tr -d ' ')

  echo -e "${GREY}┌${NC}"
  echo -e "${GREY}├${NC} ${WHITE}Reading .cursor/rules ($count found)${NC}"

  while IFS= read -r file; do
    log_info "$(basename "$file")"
  done < <(find "$RULES_DIR" -type f -name "*.mdc" | sort)

  select_option "Generate master prompts from $count rules?" "Yes" "No"

  if [ "$SELECTED_OPTION" = "No" ]; then
    log_warn "Cancelled"
    exit 0
  fi

  mkdir -p "$OUTPUT_DIR"

  build_planner
  build_implementer

  if [ -f "$CLAUDE_DIR/REVIEWER.md" ]; then
    cp "$CLAUDE_DIR/REVIEWER.md" "$OUTPUT_DIR/REVIEWER.md"
  fi

  log_step "Output"
  log_info ".claude/.tmp/PLANNER.md"
  log_info ".claude/.tmp/IMPLEMENTER.md"
  log_info ".claude/.tmp/REVIEWER.md"

  trap - EXIT
  echo -e "${GREY}└${NC}\n"
  echo -e "${GREEN}✓ Master prompts ready${NC}"
}

main "$@"
