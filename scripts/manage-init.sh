#!/usr/bin/env bash
set -e
set -o pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="${PROJECT_ROOT:-$(dirname "$SCRIPT_DIR")}"

source "$PROJECT_ROOT/scripts/lib/ui.sh"

show_help() {
  echo -e "${GREY}┌${NC}"
  echo -e "${GREY}├${NC} ${WHITE}Usage:${NC} aitk init [target-path] [options]"
  echo -e "${GREY}│${NC}"
  echo -e "${GREY}│${NC}  Bootstrap a project with base tooling and toolkit domains."
  echo -e "${GREY}│${NC}  Installs base configs, Claude workflow, governance, standards, snippets, and wiki."
  echo -e "${GREY}│${NC}"
  echo -e "${GREY}│${NC}  ${WHITE}Arguments:${NC}"
  echo -e "${GREY}│${NC}    target-path       Target directory (default: current directory)"
  echo -e "${GREY}│${NC}"
  echo -e "${GREY}│${NC}  ${WHITE}Options:${NC}"
  echo -e "${GREY}│${NC}    --stack <name>    ${GREY}# Governance stack (e.g., base, astro, react)${NC}"
  echo -e "${GREY}│${NC}    --add <rules>     ${GREY}# Comma-separated governance rules to layer on${NC}"
  echo -e "${GREY}│${NC}    --snippets <cat>  ${GREY}# Snippets preset, category, or 'all' (default: essentials)${NC}"
  echo -e "${GREY}│${NC}    --skip <list>     ${GREY}# Skip core domains: wiki, standards${NC}"
  echo -e "${GREY}│${NC}    -h, --help        ${GREY}# Show this help message${NC}"
  echo -e "${GREY}│${NC}"
  echo -e "${GREY}│${NC}  Passing any option skips the confirmation prompt."
  echo -e "${GREY}│${NC}"
  echo -e "${GREY}│${NC}  ${WHITE}Examples:${NC}"
  echo -e "${GREY}│${NC}    aitk init"
  echo -e "${GREY}│${NC}    aitk init ../my-app"
  echo -e "${GREY}│${NC}    aitk init --stack astro --add 260-shadcn ../my-app"
  echo -e "${GREY}└${NC}"
  exit 0
}

FAILED_DOMAINS=()

run_domain() {
  local label="$1"
  shift
  log_step "$label"
  if AITK_NON_INTERACTIVE=1 "$@"; then
    log_info "Done"
  else
    log_warn "Failed, run manually"
    FAILED_DOMAINS+=("$label")
  fi
}

parse_csv_into() {
  local csv="$1"
  local -n _out=$2
  local allowed="$3"
  local label="$4"
  [ -z "$csv" ] && return
  local IFS_BACKUP="$IFS"
  IFS=',' read -ra items <<<"$csv"
  IFS="$IFS_BACKUP"
  for item in "${items[@]}"; do
    item="${item# }"
    item="${item% }"
    [ -z "$item" ] && continue
    if [[ ",${allowed}," != *",${item},"* ]]; then
      log_warn "Unknown ${label} value: ${item} (ignoring)"
      continue
    fi
    _out[$item]=1
  done
}

main() {
  if [ "$1" = "-h" ] || [ "$1" = "--help" ]; then
    show_help
  fi

  local target=""
  local stack=""
  local add_rules=""
  local snippets_cat="essentials"
  local skip_csv=""
  local flags_provided=0

  while [[ $# -gt 0 ]]; do
    case "$1" in
    --stack)
      stack="$2"
      flags_provided=1
      shift 2
      ;;
    --stack=*)
      stack="${1#--stack=}"
      flags_provided=1
      shift
      ;;
    --add)
      add_rules="$2"
      flags_provided=1
      shift 2
      ;;
    --add=*)
      add_rules="${1#--add=}"
      flags_provided=1
      shift
      ;;
    --snippets)
      snippets_cat="$2"
      flags_provided=1
      shift 2
      ;;
    --snippets=*)
      snippets_cat="${1#--snippets=}"
      flags_provided=1
      shift
      ;;
    --skip)
      skip_csv="$2"
      flags_provided=1
      shift 2
      ;;
    --skip=*)
      skip_csv="${1#--skip=}"
      flags_provided=1
      shift
      ;;
    -*)
      log_error "Unknown flag: $1"
      ;;
    *)
      if [ -z "$target" ]; then
        target="$1"
      else
        log_error "Unexpected argument: $1"
      fi
      shift
      ;;
    esac
  done

  target="${target:-.}"

  open_timeline "aitk init"
  trap close_timeline EXIT

  if [ ! -d "$target" ]; then
    log_error "Target directory not found: $target"
  fi

  guard_root "$target"

  local -A skip_set=()
  parse_csv_into "$skip_csv" skip_set "wiki,standards" "--skip"

  log_step "Core domains"
  log_info "base tooling (configs, seeds, deps, scripts)"
  log_info "claude (workflow docs, settings)"
  if [ -n "$stack" ]; then
    if [ -n "$add_rules" ]; then
      log_info "governance (stack: $stack, extras: $add_rules)"
    else
      log_info "governance (stack: $stack)"
    fi
  else
    log_warn "governance (skipped: no --stack)"
  fi
  if [ -z "${skip_set[standards]:-}" ]; then
    log_info "standards (authoring conventions)"
  fi
  log_info "snippets ($snippets_cat)"
  if [ -z "${skip_set[wiki]:-}" ]; then
    log_info "wiki (index and reference pages)"
  fi

  local core_count=6
  if [ -n "${skip_set[wiki]:-}" ]; then
    core_count=$((core_count - 1))
  fi
  if [ -n "${skip_set[standards]:-}" ]; then
    core_count=$((core_count - 1))
  fi
  if [ -z "$stack" ]; then
    core_count=$((core_count - 1))
  fi
  local total=$core_count

  if [ "$flags_provided" -eq 0 ]; then
    select_option "Install $total domains to $target?" "Yes" "Cancel"
    if [ "$SELECTED_OPTION" = "Cancel" ]; then
      log_warn "Cancelled"
      exit 0
    fi
  fi

  run_domain "Base tooling" \
    bun "$PROJECT_ROOT/src/cli.ts" tooling sync base "$target" </dev/null

  run_domain "Claude workflow" \
    bash "$PROJECT_ROOT/scripts/manage-claude.sh" "init" "$target" </dev/null

  if [ -n "$stack" ]; then
    local gov_args=("install" "$stack")
    if [ -n "$add_rules" ]; then
      gov_args+=("--add" "$add_rules")
    fi
    gov_args+=("$target")
    run_domain "Governance" \
      bun "$PROJECT_ROOT/src/cli.ts" gov "${gov_args[@]}" </dev/null
  else
    log_step "Governance"
    log_warn "Skipped: no --stack provided. Run 'aitk gov install <stack> $target' to install rules."
  fi

  if [ -z "${skip_set[standards]:-}" ]; then
    run_domain "Standards" \
      bash "$PROJECT_ROOT/scripts/manage-standards.sh" "install" "$target" </dev/null
  fi

  run_domain "Snippets" \
    bash "$PROJECT_ROOT/scripts/manage-snippets.sh" "install" "$snippets_cat" "$target" </dev/null

  if [ -z "${skip_set[wiki]:-}" ]; then
    run_domain "Wiki" \
      bash "$PROJECT_ROOT/scripts/manage-wiki.sh" "init" "$target" </dev/null
  fi

  trap - EXIT
  echo -e "${GREY}└${NC}\n"
  if [ "${#FAILED_DOMAINS[@]}" -eq 0 ]; then
    echo -e "${GREEN}✓ Project initialized ($total domains)${NC}"
  else
    local failed_list
    failed_list=$(
      IFS=', '
      echo "${FAILED_DOMAINS[*]}"
    )
    echo -e "${YELLOW}! Project initialized with ${#FAILED_DOMAINS[@]} failure(s): ${failed_list}${NC}"
    exit 1
  fi
}

main "$@"
