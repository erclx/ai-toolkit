#!/bin/bash
set -e
set -o pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="${PROJECT_ROOT:-$(dirname "$(dirname "$SCRIPT_DIR")")}"

source "$PROJECT_ROOT/scripts/lib/ui.sh"

RULES_DIR="$PWD/.cursor/rules"
TEMPLATE_FILE="$PWD/.claude/IMPLEMENTER.md"
OUTPUT_DIR="$PWD/.claude/.tmp"
OUTPUT_FILE="$OUTPUT_DIR/IMPLEMENTER.md"
PLACEHOLDER="{{GOVERNANCE_RULES}}"
SOURCE_PLACEHOLDER="[PASTE RELEVANT SOURCE FILES]"
CLAUDE_DIR="$PWD/.claude"

show_help() {
  echo -e "${GREY}┌${NC}"
  log_step "Claude Prompt"
  echo -e "${GREY}│${NC}  ${WHITE}Usage:${NC} aitk claude prompt"
  echo -e "${GREY}│${NC}"
  echo -e "${GREY}│${NC}  Generates master prompt from installed cursor rules."
  echo -e "${GREY}│${NC}  Reads template from .claude/IMPLEMENTER.md in cwd."
  echo -e "${GREY}│${NC}  Writes output to .claude/.tmp/master-prompt.md."
  echo -e "${GREY}│${NC}"
  echo -e "${GREY}│${NC}  ${WHITE}Prerequisites:${NC}"
  echo -e "${GREY}│${NC}    Run 'aitk claude init' to seed IMPLEMENTER.md"
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

  if [ ! -f "$TEMPLATE_FILE" ]; then
    log_error "IMPLEMENTER.md not found at .claude/IMPLEMENTER.md. Run \`aitk claude init\` first."
  fi
}

strip_frontmatter() {
  local file="$1"
  local in_frontmatter=0
  local past_frontmatter=0

  while IFS= read -r line; do
    if [ "$past_frontmatter" -eq 1 ]; then
      echo "$line"
      continue
    fi

    if [ "$in_frontmatter" -eq 0 ] && [ "$line" = "---" ]; then
      in_frontmatter=1
      continue
    fi

    if [ "$in_frontmatter" -eq 1 ] && [ "$line" = "---" ]; then
      past_frontmatter=1
      continue
    fi

    if [ "$in_frontmatter" -eq 0 ]; then
      echo "$line"
    fi
  done <"$file"
}

build_rules_payload() {
  local payload_file
  payload_file=$(mktemp)

  while IFS= read -r file; do
    local filename
    filename=$(basename "$file" .mdc)

    echo "---" >>"$payload_file"
    echo "" >>"$payload_file"
    echo "# $filename" >>"$payload_file"
    echo "" >>"$payload_file"

    strip_frontmatter "$file" | sed -e :a -e '/^\n*$/{$d;N;ba' -e '}' >>"$payload_file"

    echo "" >>"$payload_file"
  done < <(find "$RULES_DIR" -type f -name "*.mdc" | sort)

  echo "$payload_file"
}

inject_into_template() {
  local payload_file="$1"

  local split_line
  split_line=$(grep -n -F "$PLACEHOLDER" "$TEMPLATE_FILE" | cut -d: -f1)

  if [ -z "$split_line" ]; then
    log_error "Placeholder $PLACEHOLDER not found in .claude/IMPLEMENTER.md."
  fi

  local head_lines=$((split_line - 1))

  mkdir -p "$OUTPUT_DIR"

  head -n "$head_lines" "$TEMPLATE_FILE" >"$OUTPUT_FILE"
  cat "$payload_file" >>"$OUTPUT_FILE"
  echo "" >>"$OUTPUT_FILE"
  tail -n +$((split_line + 1)) "$TEMPLATE_FILE" >>"$OUTPUT_FILE"
}

inject_context_files() {
  local context_files=("TASKS.md" "REQUIREMENTS.md" "ARCHITECTURE.md")
  local source_line

  source_line=$(grep -n -F "$SOURCE_PLACEHOLDER" "$OUTPUT_FILE" | cut -d: -f1)

  if [ -z "$source_line" ]; then
    return
  fi

  local tmp_file
  tmp_file=$(mktemp)

  head -n $((source_line - 1)) "$OUTPUT_FILE" >"$tmp_file"

  for name in "${context_files[@]}"; do
    local src="$CLAUDE_DIR/$name"
    local section="${name%.md}"

    if [ ! -f "$src" ]; then
      log_warn "$name not found — skipping"
      continue
    fi

    echo "" >>"$tmp_file"
    echo "## $section" >>"$tmp_file"
    echo "" >>"$tmp_file"
    cat "$src" >>"$tmp_file"
    echo "" >>"$tmp_file"
    log_info "$name injected"
  done

  tail -n +"$source_line" "$OUTPUT_FILE" >>"$tmp_file"
  mv "$tmp_file" "$OUTPUT_FILE"
}

main() {
  if [[ "$1" == "-h" || "$1" == "--help" ]]; then
    show_help
  fi

  check_dependencies

  local count
  count=$(find "$RULES_DIR" -type f -name "*.mdc" | wc -l | tr -d ' ')

  echo -e "${GREY}┌${NC}"
  log_step "Reading .cursor/rules ($count found)"

  while IFS= read -r file; do
    log_info "$(basename "$file")"
  done < <(find "$RULES_DIR" -type f -name "*.mdc" | sort)

  select_option "Generate master prompt from $count rules?" "Yes" "No"

  if [ "$SELECTED_OPTION" = "No" ]; then
    log_warn "Cancelled"
    echo -e "${GREY}└${NC}"
    exit 0
  fi

  log_step "Building Master Prompt"

  local payload_file
  payload_file=$(build_rules_payload)

  inject_into_template "$payload_file"
  rm "$payload_file"

  log_step "Injecting Context"

  inject_context_files

  log_info "Written to .claude/.tmp/IMPLEMENTER.md"

  echo -e "${GREY}└${NC}\n"
  echo -e "${GREEN}✓ Master prompt ready${NC}"
}

main "$@"
