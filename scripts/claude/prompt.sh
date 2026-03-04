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
CLAUDE_DIR="$PWD/.claude"

show_help() {
  echo -e "${GREY}┌${NC}"
  log_step "Claude Prompt"
  echo -e "${GREY}│${NC}  ${WHITE}Usage:${NC} aitk claude prompt"
  echo -e "${GREY}│${NC}"
  echo -e "${GREY}│${NC}  Generates master prompt from installed cursor rules."
  echo -e "${GREY}│${NC}  Reads template from .claude/IMPLEMENTER.md in cwd."
  echo -e "${GREY}│${NC}  Writes output to .claude/.tmp/IMPLEMENTER.md."
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

  local last_file
  last_file=$(find "$RULES_DIR" -type f -name "*.mdc" | sort | tail -n 1)

  while IFS= read -r file; do
    local filename
    filename=$(basename "$file" .mdc)

    echo "### $filename" >>"$payload_file"
    echo "" >>"$payload_file"
    echo '````md' >>"$payload_file"
    strip_frontmatter "$file" | sed -e '/./,$!d' -e :a -e '/^\n*$/{$d;N;ba' -e '}' >>"$payload_file"
    echo '````' >>"$payload_file"
    [[ "$file" != "$last_file" ]] && echo "" >>"$payload_file"
  done < <(find "$RULES_DIR" -type f -name "*.mdc" | sort)

  sed -i -e :a -e '/^\n*$/{$d;N;ba' -e '}' "$payload_file"

  echo "$payload_file"
}

substitute_placeholder() {
  local placeholder="$1"
  local content_file="$2"
  local tmp_file
  tmp_file=$(mktemp)

  local split_line
  split_line=$(grep -n -F "$placeholder" "$OUTPUT_FILE" | cut -d: -f1)

  if [ -z "$split_line" ]; then
    rm "$tmp_file"
    return
  fi

  head -n $((split_line - 1)) "$OUTPUT_FILE" >"$tmp_file"
  cat "$content_file" >>"$tmp_file"
  tail -n +$((split_line + 1)) "$OUTPUT_FILE" >>"$tmp_file"
  mv "$tmp_file" "$OUTPUT_FILE"
}

inject_placeholder_file() {
  local name="$1"
  local placeholder="$2"
  local src="$CLAUDE_DIR/$name"

  if [ ! -f "$src" ]; then
    log_warn "$name not found — skipping"
    return
  fi

  substitute_placeholder "$placeholder" "$src"
  log_info "$name"
}

build_output() {
  local payload_file
  payload_file=$(build_rules_payload)

  mkdir -p "$OUTPUT_DIR"
  cp "$TEMPLATE_FILE" "$OUTPUT_FILE"

  substitute_placeholder "{{GOVERNANCE_RULES}}" "$payload_file"
  rm "$payload_file"
}

main() {
  if [[ "$1" == "-h" || "$1" == "--help" ]]; then
    show_help
  fi

  check_dependencies

  local count
  count=$(find "$RULES_DIR" -type f -name "*.mdc" | wc -l | tr -d ' ')

  echo -e "${GREY}├${NC} ${WHITE}Reading .cursor/rules ($count found)${NC}"

  while IFS= read -r file; do
    log_info "$(basename "$file")"
  done < <(find "$RULES_DIR" -type f -name "*.mdc" | sort)

  select_option "Generate master prompt from $count rules?" "Yes" "No"

  if [ "$SELECTED_OPTION" = "No" ]; then
    log_warn "Cancelled"
    echo -e "${GREY}└${NC}"
    exit 0
  fi

  build_output

  log_step "Injecting Context"
  inject_placeholder_file "TASKS.md" "{{TASKS}}"
  inject_placeholder_file "REQUIREMENTS.md" "{{REQUIREMENTS}}"
  inject_placeholder_file "ARCHITECTURE.md" "{{ARCHITECTURE}}"

  log_step "Output"
  log_info ".claude/.tmp/IMPLEMENTER.md"

  echo -e "${GREY}└${NC}\n"
  echo -e "${GREEN}✓ Master prompt ready${NC}"
}

main "$@"
