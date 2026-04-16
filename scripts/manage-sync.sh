#!/bin/bash
set -e
set -o pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="${PROJECT_ROOT:-$(dirname "$SCRIPT_DIR")}"

source "$PROJECT_ROOT/scripts/lib/ui.sh"

show_help() {
  echo -e "${GREY}┌${NC}"
  echo -e "${GREY}├${NC} ${WHITE}Usage:${NC} aitk sync [target-path]"
  echo -e "${GREY}│${NC}"
  echo -e "${GREY}│${NC}  ${WHITE}Arguments:${NC}"
  echo -e "${GREY}│${NC}    target-path   Target directory (default: current directory)"
  echo -e "${GREY}│${NC}"
  echo -e "${GREY}│${NC}  ${WHITE}Options:${NC}"
  echo -e "${GREY}│${NC}    -h, --help    ${GREY}# Show this help message${NC}"
  echo -e "${GREY}│${NC}"
  echo -e "${GREY}│${NC}  ${WHITE}Examples:${NC}"
  echo -e "${GREY}│${NC}    aitk sync ../my-app"
  echo -e "${GREY}└${NC}"
  exit 0
}

validate_target() {
  local target="${1:-.}"
  if [ ! -d "$target" ]; then
    log_error "Target directory not found: $target"
  fi
  echo "$target"
}

check_clean_tree() {
  local target="$1"
  local status
  status=$(git -C "$target" status --short 2>/dev/null || true)
  if [ -n "$status" ]; then
    log_error "Working tree has uncommitted changes. Commit or stash before syncing."
  fi
  log_info "Working tree clean"
}

detect_domains() {
  local target="$1"
  local found=0

  if [ -d "$target/standards" ]; then
    log_info "standards"
    found=$((found + 1))
  else
    log_warn "standards (not installed, skipping)"
  fi

  if [ -d "$target/snippets" ]; then
    log_info "snippets"
    found=$((found + 1))
  else
    log_warn "snippets (not installed, skipping)"
  fi

  if [ -d "$target/prompts" ]; then
    log_info "prompts"
    found=$((found + 1))
  else
    log_warn "prompts (not installed, skipping)"
  fi

  if [ -d "$target/.cursor" ]; then
    log_info "governance"
    found=$((found + 1))
  else
    log_warn "governance (not installed, skipping)"
  fi

  if [ -d "$target/.agent/workflows" ]; then
    log_info "antigravity"
    found=$((found + 1))
  else
    log_warn "antigravity (not installed, skipping)"
  fi

  if [ -d "$target/.claude" ]; then
    log_info "claude"
    found=$((found + 1))
  else
    log_warn "claude (not installed, skipping)"
  fi

  echo "$found"
}

run_syncs() {
  local target="$1"

  if [ -d "$target/standards" ]; then
    bash "$PROJECT_ROOT/scripts/manage-standards.sh" sync "$target"
  fi

  if [ -d "$target/snippets" ]; then
    bash "$PROJECT_ROOT/scripts/manage-snippets.sh" sync "$target"
  fi

  if [ -d "$target/prompts" ]; then
    bash "$PROJECT_ROOT/scripts/manage-prompts.sh" sync "$target"
  fi

  if [ -d "$target/.cursor" ]; then
    bash "$PROJECT_ROOT/scripts/manage-gov.sh" sync "$target"
    if [ -f "$target/.claude/GOV.md" ]; then
      AITK_NON_INTERACTIVE=1 bash "$PROJECT_ROOT/scripts/manage-claude.sh" gov "$target"
    fi
  fi

  if [ -d "$target/.agent/workflows" ]; then
    bash "$PROJECT_ROOT/scripts/manage-antigravity.sh" sync "$target"
  fi

  if [ -d "$target/.claude" ]; then
    AITK_NON_INTERACTIVE=1 bash "$PROJECT_ROOT/scripts/manage-claude.sh" sync "$target"
  fi
}

get_changed_names() {
  local target="$1"
  shift
  local paths=("$@")
  git -C "$target" status --short -- "${paths[@]}" 2>/dev/null |
    awk '{print $NF}' |
    while IFS= read -r f; do basename "$f"; done |
    sort -u
}

get_domain_verb() {
  local target="$1"
  shift
  local paths=("$@")

  local status_output
  status_output=$(git -C "$target" status --short -- "${paths[@]}" 2>/dev/null)

  local has_modify=0 has_new=0 has_delete=0
  while IFS= read -r line; do
    [ -z "$line" ] && continue
    local code="${line:0:2}"
    case "$code" in
    "??") has_new=1 ;;
    " D" | "D " | "DD") has_delete=1 ;;
    *) has_modify=1 ;;
    esac
  done <<<"$status_output"

  if [ "$has_modify" -eq 0 ] && [ "$has_delete" -eq 0 ] && [ "$has_new" -eq 1 ]; then
    echo "Add"
  elif [ "$has_modify" -eq 0 ] && [ "$has_new" -eq 0 ] && [ "$has_delete" -eq 1 ]; then
    echo "Remove"
  else
    echo "Update"
  fi
}

format_file_list() {
  local -a files=("$@")
  local count=${#files[@]}
  local max=3

  if [ "$count" -eq 0 ]; then
    echo ""
    return
  fi

  if [ "$count" -le "$max" ]; then
    local result
    result=$(printf "%s, " "${files[@]}")
    echo "${result%, }"
  else
    local -a head=("${files[@]:0:$max}")
    local remaining=$((count - max))
    local result
    result=$(printf "%s, " "${head[@]}")
    echo "${result%, }, and $remaining more"
  fi
}

run_git_workflow() {
  local target="$1"

  if [ ! -d "$target/.git" ]; then
    return
  fi

  if ! command -v gh >/dev/null 2>&1; then
    log_warn "gh CLI not found (skipping PR). Install from https://cli.github.com"
    return
  fi

  local remote_check
  remote_check=$(git -C "$target" ls-remote --heads origin chore/toolkit-sync 2>/dev/null || true)
  if [ -n "$remote_check" ]; then
    log_warn "chore/toolkit-sync already exists on remote (skipping). Merge or delete it first."
    return
  fi

  local local_check
  local_check=$(git -C "$target" branch --list "chore/toolkit-sync" 2>/dev/null || true)
  if [ -n "$local_check" ]; then
    log_warn "chore/toolkit-sync already exists locally (skipping). Delete it first."
    return
  fi

  local -a changed_domains=()
  declare -A changed_files
  declare -A domain_verbs

  local -a std_names
  mapfile -t std_names < <(get_changed_names "$target" "standards/")
  if [ "${#std_names[@]}" -gt 0 ] && [ -n "${std_names[0]}" ]; then
    changed_domains+=("standards")
    changed_files["standards"]="${std_names[*]}"
    domain_verbs["standards"]=$(get_domain_verb "$target" "standards/")
  fi

  local -a snp_names
  mapfile -t snp_names < <(get_changed_names "$target" "snippets/")
  if [ "${#snp_names[@]}" -gt 0 ] && [ -n "${snp_names[0]}" ]; then
    changed_domains+=("snippets")
    changed_files["snippets"]="${snp_names[*]}"
    domain_verbs["snippets"]=$(get_domain_verb "$target" "snippets/")
  fi

  local -a prm_names
  mapfile -t prm_names < <(get_changed_names "$target" "prompts/")
  if [ "${#prm_names[@]}" -gt 0 ] && [ -n "${prm_names[0]}" ]; then
    changed_domains+=("prompts")
    changed_files["prompts"]="${prm_names[*]}"
    domain_verbs["prompts"]=$(get_domain_verb "$target" "prompts/")
  fi

  local -a gov_names
  mapfile -t gov_names < <(get_changed_names "$target" ".cursor/" ".claude/GOV.md")
  if [ "${#gov_names[@]}" -gt 0 ] && [ -n "${gov_names[0]}" ]; then
    changed_domains+=("governance")
    changed_files["governance"]="${gov_names[*]}"
    domain_verbs["governance"]=$(get_domain_verb "$target" ".cursor/" ".claude/GOV.md")
  fi

  local -a ag_names
  mapfile -t ag_names < <(get_changed_names "$target" ".agent/workflows/")
  if [ "${#ag_names[@]}" -gt 0 ] && [ -n "${ag_names[0]}" ]; then
    changed_domains+=("antigravity")
    changed_files["antigravity"]="${ag_names[*]}"
    domain_verbs["antigravity"]=$(get_domain_verb "$target" ".agent/workflows/")
  fi

  local -a cl_names
  mapfile -t cl_names < <(get_changed_names "$target" ".claude/PLANNER.md" ".claude/IMPLEMENTER.md" ".claude/REVIEWER.md")
  if [ "${#cl_names[@]}" -gt 0 ] && [ -n "${cl_names[0]}" ]; then
    changed_domains+=("claude")
    changed_files["claude"]="${cl_names[*]}"
    domain_verbs["claude"]=$(get_domain_verb "$target" ".claude/PLANNER.md" ".claude/IMPLEMENTER.md" ".claude/REVIEWER.md")
  fi

  if [ "${#changed_domains[@]}" -eq 0 ]; then
    return
  fi

  local domain_list
  domain_list=$(printf "%s, " "${changed_domains[@]}")
  domain_list="${domain_list%, }"

  local commit_msg="chore(sync): update $domain_list from toolkit"
  local branch="chore/toolkit-sync"

  local pr_body="## Summary\n\nSync $domain_list from toolkit.\n\n## Key Changes\n"

  local files_str="" verb="" file_list=""
  local -a files_arr=()

  for domain in "${changed_domains[@]}"; do
    files_str="${changed_files[$domain]}"
    files_arr=()
    read -r -a files_arr <<<"$files_str"
    verb="${domain_verbs[$domain]}"
    file_list=$(format_file_list "${files_arr[@]}")
    pr_body+="\n- $verb \`$domain/\` $file_list."
  done

  echo -e "${GREY}┌${NC}" >&2
  echo -e "${GREY}│${NC} ${WHITE}aitk sync → git${NC}" >&2
  trap close_timeline EXIT

  log_step "Preview"
  log_info "Domains: $domain_list"
  log_info "Branch:  $branch"
  log_info "Commit:  $commit_msg"

  log_step "PR body"
  printf "%b\n" "$pr_body" | pipe_output

  select_option "Review changes, then?" "Commit and open PR" "Commit only" "Cancel"
  case "$SELECTED_OPTION" in
  "Cancel")
    log_warn "Skipped"
    trap - EXIT
    echo -e "${GREY}└${NC}" >&2
    return
    ;;
  esac

  log_step "Committing"
  git -C "$target" add -A
  git -C "$target" commit -m "$commit_msg"
  git -C "$target" checkout -b "$branch"

  if [ "$SELECTED_OPTION" = "Commit only" ]; then
    trap - EXIT
    echo -e "${GREY}└${NC}\n" >&2
    echo -e "${GREEN}✓ Committed to $branch. Push and open a PR when ready.${NC}" >&2
    return
  fi

  git -C "$target" push -u origin "$branch"

  log_step "Opening PR"

  local pr_body_file
  pr_body_file=$(mktemp)
  printf "%b" "$pr_body" >"$pr_body_file"

  local pr_url
  pr_url=$(cd "$target" && gh pr create --title "$commit_msg" --body-file "$pr_body_file")
  rm -f "$pr_body_file"

  trap - EXIT
  echo -e "${GREY}└${NC}\n" >&2
  echo -e "${GREEN}✓ Synced: $pr_url${NC}" >&2
}

main() {
  if [[ "$1" == "-h" || "$1" == "--help" ]]; then
    show_help
  fi

  local target
  target=$(validate_target "${1:-}")
  guard_root "$target"

  echo -e "${GREY}┌${NC}"
  echo -e "${GREY}│${NC} ${WHITE}aitk sync${NC}"
  trap close_timeline EXIT

  log_step "Checking working tree"
  check_clean_tree "$target"

  log_step "Detecting domains"

  local found
  found=$(detect_domains "$target")

  if [ "$found" -eq 0 ]; then
    trap - EXIT
    echo -e "${GREY}└${NC}\n"
    echo -e "${YELLOW}! No domains installed in target. Run domain install commands first.${NC}"
    exit 0
  fi

  trap - EXIT
  echo -e "${GREY}└${NC}\n"

  run_syncs "$target"
  run_git_workflow "$target"

  if [ -d "$target/.claude" ]; then
    echo -e "${GREY}Tip: run \`/claude-seed-sync\` to audit seed drift.${NC}" >&2
  fi
}

main "$@"
