#!/bin/bash
set -e
set -o pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="${PROJECT_ROOT:-$(dirname "$SCRIPT_DIR")}"

source "$PROJECT_ROOT/scripts/lib/ui.sh"

show_help() {
  echo -e "${GREY}┌${NC}"
  echo -e "${GREY}├${NC} ${WHITE}Usage:${NC} aitk init [target-path]"
  echo -e "${GREY}│${NC}"
  echo -e "${GREY}│${NC}  Bootstrap a project with base tooling and toolkit domains."
  echo -e "${GREY}│${NC}  Installs base configs, Claude workflow, governance, snippets, and wiki."
  echo -e "${GREY}│${NC}  Optionally installs standards, prompts, and antigravity."
  echo -e "${GREY}│${NC}"
  echo -e "${GREY}│${NC}  ${WHITE}Arguments:${NC}"
  echo -e "${GREY}│${NC}    target-path   Target directory (default: current directory)"
  echo -e "${GREY}│${NC}"
  echo -e "${GREY}│${NC}  ${WHITE}Options:${NC}"
  echo -e "${GREY}│${NC}    -h, --help    ${GREY}# Show this help message${NC}"
  echo -e "${GREY}│${NC}"
  echo -e "${GREY}│${NC}  ${WHITE}Examples:${NC}"
  echo -e "${GREY}│${NC}    aitk init"
  echo -e "${GREY}│${NC}    aitk init ../my-app"
  echo -e "${GREY}└${NC}"
  exit 0
}

run_domain() {
  local label="$1"
  shift
  log_step "$label"
  if "$@"; then
    log_info "Done"
  else
    log_warn "Failed — run manually"
  fi
}

main() {
  if [ "$1" = "-h" ] || [ "$1" = "--help" ]; then
    show_help
  fi

  local target="${1:-.}"

  if [ ! -d "$target" ]; then
    log_error "Target directory not found: $target"
  fi

  guard_root "$target"

  echo -e "${GREY}┌${NC}"
  echo -e "${GREY}│${NC} ${WHITE}aitk init${NC}"
  trap close_timeline EXIT

  log_step "Core domains"
  log_info "base tooling (configs, seeds, deps, scripts)"
  log_info "claude (workflow docs, settings)"
  log_info "governance (cursor rules, GOV.md)"
  log_info "snippets (all categories)"
  log_info "wiki (index and reference pages)"

  log_step "Optional domains"
  local optional=()
  local opt_labels=("standards" "prompts" "antigravity")

  for label in "${opt_labels[@]}"; do
    select_option "Install ${label}?" "No" "Yes"
    if [ "$SELECTED_OPTION" = "Yes" ]; then
      optional+=("$label")
      log_add "$label"
    fi
  done

  local total=$((5 + ${#optional[@]}))
  select_option "Install $total domains to $target?" "Yes" "Cancel"

  if [ "$SELECTED_OPTION" = "Cancel" ]; then
    log_warn "Cancelled"
    exit 0
  fi

  run_domain "Base tooling" \
    bash "$PROJECT_ROOT/scripts/tooling/sync.sh" "base" "$target" </dev/null

  run_domain "Claude workflow" \
    bash "$PROJECT_ROOT/scripts/manage-claude.sh" "init" "$target" </dev/null

  run_domain "Governance" \
    bash "$PROJECT_ROOT/scripts/manage-gov.sh" "install" "$target" </dev/null

  run_domain "Snippets" \
    bash "$PROJECT_ROOT/scripts/manage-snippets.sh" "install" "all" "$target" </dev/null

  run_domain "Wiki" \
    bash "$PROJECT_ROOT/scripts/manage-wiki.sh" "init" "$target" </dev/null

  for label in "${optional[@]}"; do
    case "$label" in
    standards)
      run_domain "Standards" \
        bash "$PROJECT_ROOT/scripts/manage-standards.sh" "install" "$target" </dev/null
      ;;
    prompts)
      run_domain "Prompts" \
        bash "$PROJECT_ROOT/scripts/manage-prompts.sh" "install" "$target" </dev/null
      ;;
    antigravity)
      run_domain "Antigravity" \
        bash "$PROJECT_ROOT/scripts/manage-antigravity.sh" "install" "$target" </dev/null
      ;;
    esac
  done

  trap - EXIT
  echo -e "${GREY}└${NC}\n"
  echo -e "${GREEN}✓ Project initialized ($total domains)${NC}"
}

main "$@"
