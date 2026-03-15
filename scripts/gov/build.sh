#!/bin/bash
set -e
set -o pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="${PROJECT_ROOT:-$(dirname "$(dirname "$SCRIPT_DIR")")}"

source "$PROJECT_ROOT/scripts/lib/ui.sh"
trap close_timeline EXIT
source "$PROJECT_ROOT/scripts/lib/gov.sh"

show_help() {
  echo -e "${GREY}┌${NC}"
  echo -e "${GREY}├${NC} ${WHITE}Usage:${NC} aitk gov build [target-path]"
  echo -e "${GREY}│${NC}"
  echo -e "${GREY}│${NC}  Concatenates installed rules into a single clean file."
  echo -e "${GREY}│${NC}  Strips frontmatter and writes to .cursor/.tmp/rules.md."
  echo -e "${GREY}│${NC}"
  echo -e "${GREY}│${NC}  ${WHITE}Arguments:${NC}"
  echo -e "${GREY}│${NC}    target-path   Target directory (default: current directory)"
  echo -e "${GREY}│${NC}"
  echo -e "${GREY}│${NC}  ${WHITE}Options:${NC}"
  echo -e "${GREY}│${NC}    -h, --help    ${GREY}# Show this help message${NC}"
  echo -e "${GREY}│${NC}"
  echo -e "${GREY}│${NC}  ${WHITE}Examples:${NC}"
  echo -e "${GREY}│${NC}    aitk gov build"
  echo -e "${GREY}│${NC}    aitk gov build ../my-app"
  echo -e "${GREY}└${NC}"
  exit 0
}

cmd_build() {
  local target="${1:-.}"
  local rules_dir="$target/.cursor/rules"
  local output_dir="$target/.cursor/.tmp"
  local output_file="$output_dir/rules.md"

  if [ ! -d "$rules_dir" ] || ! ls "$rules_dir"/*.mdc >/dev/null 2>&1; then
    log_error "No rules found at $rules_dir. Run \`aitk gov install\` first."
  fi

  local count
  count=$(find "$rules_dir" -type f -name "*.mdc" | wc -l | tr -d ' ')

  echo -e "${GREY}┌${NC}"
  echo -e "${GREY}├${NC} ${WHITE}Reading .cursor/rules ($count found)${NC}"

  while IFS= read -r file; do
    log_info "$(basename "$file")"
  done < <(find "$rules_dir" -type f -name "*.mdc" | sort)

  select_option "Build $count rules to .cursor/.tmp/rules.md?" "Yes" "No"

  if [ "$SELECTED_OPTION" = "No" ]; then
    log_warn "Cancelled"
    exit 0
  fi

  log_step "Building rules payload"
  local payload_file
  payload_file=$(build_rules_payload "$rules_dir")

  mkdir -p "$output_dir"
  mv "$payload_file" "$output_file"

  log_add ".cursor/.tmp/rules.md"

  trap - EXIT
  echo -e "${GREY}└${NC}\n"
  echo -e "${GREEN}✓ Rules built ($count rules → .cursor/.tmp/rules.md)${NC}"
}

main() {
  if [ "$1" = "-h" ] || [ "$1" = "--help" ]; then
    show_help
  fi

  cmd_build "$@"
}

main "$@"
