#!/bin/bash
set -e
set -o pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="${PROJECT_ROOT:-$(dirname "$SCRIPT_DIR")}"

source "$PROJECT_ROOT/scripts/lib/ui.sh"
source "$PROJECT_ROOT/scripts/lib/inject.sh"

CLAUDE_SEEDS_DIR="$PROJECT_ROOT/tooling/claude/seeds/.claude"
CLAUDE_SEED="$CLAUDE_SEEDS_DIR/SESSION.md"

show_help() {
  echo -e "${GREY}┌${NC}"
  log_step "Claude Workflow"
  echo -e "${GREY}│${NC}  ${WHITE}Usage:${NC} gdev claude [command] [target-path]"
  echo -e "${GREY}│${NC}"
  echo -e "${GREY}│${NC}  ${WHITE}Commands:${NC}"
  echo -e "${GREY}│${NC}    init      ${GREY}# Seed .claude/ workflow docs into a project${NC}"
  echo -e "${GREY}│${NC}    update    ${GREY}# Diff SESSION.md against seed and offer to apply${NC}"
  echo -e "${GREY}│${NC}"
  echo -e "${GREY}│${NC}  ${WHITE}Arguments:${NC}"
  echo -e "${GREY}│${NC}    target-path   Target directory (default: current directory)"
  echo -e "${GREY}│${NC}"
  echo -e "${GREY}│${NC}  ${WHITE}Options:${NC}"
  echo -e "${GREY}│${NC}    -h, --help    ${GREY}# Show this help message${NC}"
  echo -e "${GREY}│${NC}"
  echo -e "${GREY}│${NC}  ${WHITE}Examples:${NC}"
  echo -e "${GREY}│${NC}    gdev claude init"
  echo -e "${GREY}│${NC}    gdev claude init ../my-app"
  echo -e "${GREY}│${NC}    gdev claude update ../my-app"
  echo -e "${GREY}└${NC}"
  exit 0
}

validate_target() {
  local target="$1"
  local target_abs
  target_abs=$(cd "$target" && pwd)

  if [ "$target_abs" = "$PROJECT_ROOT" ]; then
    log_error "Cannot init claude workflow in ai-toolkit root."
  fi
}

seed_claude_docs() {
  local target="$1"
  local dest_dir="$target/.claude"

  mkdir -p "$dest_dir"

  while IFS= read -r file; do
    local name
    name=$(basename "$file")
    local dest="$dest_dir/$name"

    if [ -f "$dest" ]; then
      log_info "${GREY}Exists:  .claude/$name${NC}"
    else
      cp "$file" "$dest"
      log_add ".claude/$name"
    fi
  done < <(find "$CLAUDE_SEEDS_DIR" -maxdepth 1 -type f | sort)
}

cmd_init() {
  local target="${1:-.}"

  validate_target "$target"

  log_step "Seeding .claude/"
  seed_claude_docs "$target"

  log_step "Updating .gitignore"
  merge_gitignore "claude" "$target"
}

cmd_update() {
  local target="${1:-.}"

  validate_target "$target"

  local dest="$target/.claude/SESSION.md"

  if [ ! -f "$dest" ]; then
    log_error "SESSION.md not found at $target/.claude/. Run 'gdev claude init' first."
  fi

  if diff -q "$CLAUDE_SEED" "$dest" >/dev/null 2>&1; then
    log_info "SESSION.md already up to date"
    echo -e "${GREY}└${NC}"
    echo -e "${GREEN}✓ Claude workflow up to date${NC}"
    exit 0
  fi

  log_step "Reviewing Changes"
  code --diff "$CLAUDE_SEED" "$dest"

  select_option "Apply updated SESSION.md?" "Yes" "No"

  if [ "$SELECTED_OPTION" = "No" ]; then
    log_warn "Update cancelled"
    echo -e "${GREY}└${NC}"
    exit 0
  fi

  cp "$CLAUDE_SEED" "$dest"
  log_add "SESSION.md"
}

main() {
  if [ "$1" = "-h" ] || [ "$1" = "--help" ]; then
    show_help
  fi

  echo -e "${GREY}┌${NC}"

  local command="$1"

  if [ -z "$command" ]; then
    select_option "Claude command?" "init" "update"
    command="$SELECTED_OPTION"
  else
    shift
  fi

  case "$command" in
  init)
    cmd_init "$@"
    echo -e "${GREY}└${NC}\n"
    echo -e "${GREEN}✓ Claude workflow ready${NC}"
    ;;
  update)
    cmd_update "$@"
    echo -e "${GREY}└${NC}\n"
    echo -e "${GREEN}✓ Claude workflow updated${NC}"
    ;;
  *)
    log_error "Unknown command: $command. Use 'init' or 'update'."
    ;;
  esac
}

main "$@"
