#!/bin/bash
set -e
set -o pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="${PROJECT_ROOT:-$(dirname "$SCRIPT_DIR")}"

source "$PROJECT_ROOT/scripts/lib/ui.sh"

RULES_DIR="$PWD/.cursor/rules"
TEMPLATE_FILE="$PROJECT_ROOT/scripts/templates/master-prompt.template"
OUTPUT_DIR="$PWD/.gemini/.tmp"
OUTPUT_FILE="$OUTPUT_DIR/master-prompt.md"
PLACEHOLDER="{{GOVERNANCE_RULES}}"

show_help() {
  echo -e "${GREY}┌${NC}"
  log_step "Prompt Manager"
  echo -e "${GREY}│${NC}  ${WHITE}Usage:${NC} gdev prompt [command]"
  echo -e "${GREY}│${NC}"
  echo -e "${GREY}│${NC}  ${WHITE}Commands:${NC}"
  echo -e "${GREY}│${NC}    generate    ${GREY}# Build master prompt from installed cursor rules${NC}"
  echo -e "${GREY}│${NC}"
  echo -e "${GREY}│${NC}  ${WHITE}Options:${NC}"
  echo -e "${GREY}│${NC}    -h, --help  ${GREY}# Show this help message${NC}"
  echo -e "${GREY}│${NC}"
  echo -e "${GREY}│${NC}  ${WHITE}Prerequisites:${NC}"
  echo -e "${GREY}│${NC}    Run 'gdev gov rules' first to install rules for your stack."
  echo -e "${GREY}└${NC}"
  exit 0
}

check_dependencies() {
  if [ ! -d "$RULES_DIR" ] || ! ls "$RULES_DIR"/*.mdc >/dev/null 2>&1; then
    log_error "No rules found at .cursor/rules/. Run 'gdev gov rules' first."
  fi

  if [ ! -f "$TEMPLATE_FILE" ]; then
    log_error "Template not found at: $TEMPLATE_FILE"
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
    strip_frontmatter "$file" >>"$payload_file"
    echo "" >>"$payload_file"
    echo "" >>"$payload_file"
  done < <(find "$RULES_DIR" -type f -name "*.mdc" | sort)

  echo "$payload_file"
}

inject_into_template() {
  local payload_file="$1"

  local split_line
  split_line=$(grep -n -F "$PLACEHOLDER" "$TEMPLATE_FILE" | cut -d: -f1)

  if [ -z "$split_line" ]; then
    log_error "Placeholder $PLACEHOLDER not found in template."
  fi

  local head_lines=$((split_line - 1))

  mkdir -p "$OUTPUT_DIR"

  head -n "$head_lines" "$TEMPLATE_FILE" >"$OUTPUT_FILE"
  cat "$payload_file" >>"$OUTPUT_FILE"
  echo "" >>"$OUTPUT_FILE"
  tail -n +$((split_line + 1)) "$TEMPLATE_FILE" >>"$OUTPUT_FILE"
}

cmd_generate() {
  log_step "Reading Rules"

  local count
  count=$(find "$RULES_DIR" -type f -name "*.mdc" | wc -l | tr -d ' ')
  log_info "$count rules found"

  while IFS= read -r file; do
    log_info "$(basename "$file")"
  done < <(find "$RULES_DIR" -type f -name "*.mdc" | sort)

  log_step "Building Master Prompt"

  local payload_file
  payload_file=$(build_rules_payload)

  inject_into_template "$payload_file"
  rm "$payload_file"

  log_info "Output: .gemini/.tmp/master-prompt.md"
}

main() {
  if [[ "$1" == "-h" || "$1" == "--help" ]]; then
    show_help
  fi

  local command="${1:-generate}"

  echo -e "${GREY}┌${NC}"

  check_dependencies

  case "$command" in
  generate)
    cmd_generate
    ;;
  *)
    log_error "Unknown command: $command. Use 'generate' or --help."
    ;;
  esac

  echo -e "${GREY}└${NC}\n"
  echo -e "${GREEN}✓ Master prompt ready${NC}"
}

main "$@"
