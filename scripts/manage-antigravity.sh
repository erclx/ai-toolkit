#!/bin/bash
set -e
set -o pipefail

SCRIPT_DIR="$(cd "$(dirname "$(readlink -f "${BASH_SOURCE[0]}")")" && pwd)"
PROJECT_ROOT="${PROJECT_ROOT:-$(dirname "$SCRIPT_DIR")}"
export PROJECT_ROOT

source "$PROJECT_ROOT/scripts/lib/ui.sh"

WORKFLOWS_SOURCE="$PROJECT_ROOT/antigravity/workflows"
MANIFEST="$PROJECT_ROOT/antigravity/workflows.toml"

show_help() {
  echo -e "${GREY}┌${NC}"
  echo -e "${GREY}├${NC} ${WHITE}Usage:${NC} aitk antigravity [command] [group] [target-path]"
  echo -e "${GREY}│${NC}"
  echo -e "${GREY}│${NC}  ${WHITE}Commands:${NC}"
  echo -e "${GREY}│${NC}    install [group] [path]   ${GREY}# Copy workflows to a project${NC}"
  echo -e "${GREY}│${NC}    sync [path]              ${GREY}# Update already-installed workflows${NC}"
  echo -e "${GREY}│${NC}"
  echo -e "${GREY}│${NC}  ${WHITE}Groups:${NC}"
  echo -e "${GREY}│${NC}    git      ${GREY}# git-branch, git-commit, git-pr, git-ship, git-split, git-stage${NC}"
  echo -e "${GREY}│${NC}    docs     ${GREY}# docs-sync${NC}"
  echo -e "${GREY}│${NC}    review   ${GREY}# claude-docs, claude-feature, claude-review, claude-ui-test${NC}"
  echo -e "${GREY}│${NC}    all      ${GREY}# Everything in workflows.toml${NC}"
  echo -e "${GREY}│${NC}"
  echo -e "${GREY}│${NC}  ${WHITE}Examples:${NC}"
  echo -e "${GREY}│${NC}    aitk antigravity install git ../my-app"
  echo -e "${GREY}│${NC}    aitk antigravity install all ../my-app"
  echo -e "${GREY}│${NC}    aitk antigravity sync ../my-app"
  echo -e "${GREY}└${NC}"
  exit 0
}

validate_target() {
  local target="$1"
  [ -z "$target" ] && target="."
  if [ ! -d "$target" ]; then
    log_error "Target directory not found: $target"
  fi
  echo "$target"
}

list_groups() {
  grep '^\[groups\.' "$MANIFEST" | sed 's/\[groups\.\(.*\)\]/\1/'
}

get_group_workflows() {
  local group="$1"
  awk "/^\[groups\.$group\]/{found=1} found && /^workflows/{p=1} p && /\"/{gsub(/[\"[:space:],]/, \"\"); if(\$0 ~ /\.md$/) print; if(\$0 ~ /^\]/) p=0}" "$MANIFEST"
}

collect_files_for_group() {
  local group="$1"
  local -n _files=$2

  if [ "$group" = "all" ]; then
    while IFS= read -r f; do
      _files+=("$WORKFLOWS_SOURCE/$f")
    done < <(get_group_workflows_all)
    return
  fi

  local found=false
  while IFS= read -r g; do
    [ "$g" = "$group" ] && found=true && break
  done < <(list_groups)

  if [ "$found" = false ]; then
    log_error "Group not found: $group. Available: $(list_groups | tr '\n' ' ')"
  fi

  while IFS= read -r wf; do
    local filepath="$WORKFLOWS_SOURCE/$wf"
    if [ -f "$filepath" ]; then
      _files+=("$filepath")
    else
      log_warn "$wf (not found in source, skipping)"
    fi
  done < <(get_group_workflows "$group")
}

get_group_workflows_all() {
  local seen=()
  while IFS= read -r group; do
    while IFS= read -r wf; do
      local already=false
      for s in "${seen[@]}"; do [ "$s" = "$wf" ] && already=true && break; done
      if [ "$already" = false ]; then
        echo "$wf"
        seen+=("$wf")
      fi
    done < <(get_group_workflows "$group")
  done < <(list_groups)
}

select_group() {
  local groups=()
  mapfile -t groups < <(list_groups)
  select_option "Select group to install:" "all" "${groups[@]}"
  echo "$SELECTED_OPTION"
}

open_diffs() {
  while IFS= read -r entry; do
    local src="${entry%%|*}"
    local dest="${entry##*|}"
    code --diff "$src" "$dest"
  done <"$DRIFTED_FILE"
}

apply_changes() {
  local target="$1"
  log_step "Applying changes"
  while IFS= read -r entry; do
    local src="${entry%%|*}"
    local dest="${entry##*|}"
    mkdir -p "$(dirname "$dest")"
    cp "$src" "$dest"
    log_add "${dest#"$target/"}"
  done <"$PENDING_FILE"
}

cmd_install() {
  local group="$1"
  local target="${2:-.}"
  target=$(validate_target "$target")

  if [ -z "$group" ]; then
    group=$(select_group)
  fi

  local files=()
  collect_files_for_group "$group" files

  if [ "${#files[@]}" -eq 0 ]; then
    log_warn "No workflows found for group: $group"
    exit 0
  fi

  local dest_dir="$target/.agent/workflows"

  log_step "Resolving group: $group"
  for f in "${files[@]}"; do
    log_info "$(basename "$f")"
  done

  select_option "Install ${#files[@]} workflows to $dest_dir?" "Yes" "No"
  if [ "$SELECTED_OPTION" = "No" ]; then
    log_warn "Cancelled"
    exit 0
  fi

  log_step "Installing workflows"
  mkdir -p "$dest_dir"
  for f in "${files[@]}"; do
    local dest
    dest="$dest_dir/$(basename "$f")"
    cp "$f" "$dest"
    log_add ".agent/workflows/$(basename "$f")"
  done

  trap - EXIT
  echo -e "${GREY}└${NC}\n"
  echo -e "${GREEN}✓ Workflows installed${NC} ${GREY}(${#files[@]} files)${NC}"
}

collect_sync_changes() {
  local target_dir="$1"
  local workflows_target="$target_dir/.agent/workflows"
  local count=0

  if [ ! -d "$workflows_target" ]; then
    log_warn "No .agent/workflows/ found in target. Run 'aitk antigravity install' first."
    echo "0"
    return
  fi

  while IFS= read -r dest_file; do
    local filename
    filename=$(basename "$dest_file")
    local src_file="$WORKFLOWS_SOURCE/$filename"

    if [ ! -f "$src_file" ]; then
      log_warn "$filename (not in toolkit source, skipping)"
      continue
    fi

    if ! diff -q "$src_file" "$dest_file" >/dev/null 2>&1; then
      log_warn ".agent/workflows/$filename"
      echo "$src_file|$dest_file" >>"$PENDING_FILE"
      echo "$src_file|$dest_file" >>"$DRIFTED_FILE"
      count=$((count + 1))
    else
      log_info ".agent/workflows/$filename"
    fi
  done < <(find "$workflows_target" -type f -name "*.md" | sort)

  echo "$count"
}

cmd_sync() {
  local target="${1:-.}"
  target=$(validate_target "$target")
  guard_root "$target"

  PENDING_FILE=$(mktemp)
  DRIFTED_FILE=$(mktemp)
  trap 'rm -f "$PENDING_FILE" "$DRIFTED_FILE"; close_timeline' EXIT

  log_step "Scanning workflows"
  local count
  count=$(collect_sync_changes "$target")

  if [ "$count" -eq 0 ]; then
    trap - EXIT
    echo -e "${GREY}└${NC}\n"
    echo -e "${GREEN}✓ Everything up to date${NC}"
    exit 0
  fi

  local has_diffs=false
  [ -s "$DRIFTED_FILE" ] && has_diffs=true

  if [ "$has_diffs" = true ]; then
    select_option "Apply $count changes?" "Review diffs" "Apply all" "No"
  else
    select_option "Apply $count changes?" "Yes" "No"
  fi

  case "$SELECTED_OPTION" in
  "Review diffs")
    open_diffs
    select_option "Apply $count changes?" "Yes" "No"
    [ "$SELECTED_OPTION" == "No" ] && {
      log_warn "Sync cancelled"
      exit 0
    }
    ;;
  "No")
    log_warn "Sync cancelled"
    exit 0
    ;;
  esac

  apply_changes "$target"

  trap - EXIT
  echo -e "${GREY}└${NC}\n"
  echo -e "${GREEN}✓ Sync complete${NC} ${GREY}($count workflows)${NC}"
}

main() {
  if [ "$1" = "-h" ] || [ "$1" = "--help" ]; then
    show_help
  fi

  echo -e "${GREY}┌${NC}"
  echo -e "${GREY}│${NC} ${WHITE}aitk antigravity${NC}"
  trap close_timeline EXIT

  local command="$1"

  if [ -z "$command" ]; then
    select_option "Antigravity command?" "install" "sync"
    command="$SELECTED_OPTION"
  else
    shift
  fi

  case "$command" in
  install)
    cmd_install "$@"
    ;;
  sync)
    cmd_sync "$@"
    ;;
  *)
    log_error "Unknown command: $command. Use 'install', 'sync', or --help."
    ;;
  esac
}

main "$@"
