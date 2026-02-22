#!/bin/bash
set -e
set -o pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="${PROJECT_ROOT:-$(dirname "$SCRIPT_DIR")}"

source "$PROJECT_ROOT/scripts/lib/ui.sh"

ENGINE_SCRIPT="$PROJECT_ROOT/scripts/lib/compiler.sh"

BUILD_TARGETS=(
  "Rules:.cursor/rules:mdc:gemini/commands/gov/rules.toml:scripts/templates/rules.toml.template:{{INJECT_ALL_RULES}}"
  "Standards:standards:md:gemini/commands/gov/standards.toml:scripts/templates/standards.toml.template:{{INJECT_STANDARDS}}"
)

TEMP_DIR=""

declare -A TARGET_CHANGED
declare -A TARGET_TEMPLATE_CHANGED
declare -A TARGET_MODIFIED_COUNT
declare -A TARGET_NEW_COUNT

show_help() {
  echo -e "${GREY}┌${NC}"
  log_step "Governance Build"
  echo -e "${GREY}│${NC}  ${WHITE}Usage:${NC} gdev build"
  echo -e "${GREY}│${NC}"
  echo -e "${GREY}│${NC}  Scans source rules and standards for changes,"
  echo -e "${GREY}│${NC}  recompiles .toml artifacts, and commits the"
  echo -e "${GREY}│${NC}  compiled output."
  echo -e "${GREY}└${NC}"
  exit 0
}

check_dependencies() {
  if [ ! -f "$ENGINE_SCRIPT" ]; then
    log_error "Compiler engine not found at: $ENGINE_SCRIPT"
  fi

  for target in "${BUILD_TARGETS[@]}"; do
    IFS=':' read -r label src_rel _ _ _ _ <<<"$target"
    if [ ! -d "$PROJECT_ROOT/$src_rel" ]; then
      log_error "Source not found: $src_rel"
    fi
  done
}

cleanup() {
  if [ -n "$TEMP_DIR" ] && [ -d "$TEMP_DIR" ]; then
    rm -rf "$TEMP_DIR"
  fi
}
trap cleanup EXIT

detect_template_change() {
  local template_file="$1"
  local output_file="$2"

  local last_build_hash
  last_build_hash=$(git -C "$PROJECT_ROOT" log -n 1 --pretty=format:%H -- "$output_file" 2>/dev/null || echo "")

  if [ -z "$last_build_hash" ]; then
    echo "1"
    return
  fi

  if ! git -C "$PROJECT_ROOT" diff --quiet -- "$template_file" 2>/dev/null; then
    echo "1"
    return
  fi

  if git -C "$PROJECT_ROOT" diff --name-only "$last_build_hash" HEAD -- "$template_file" 2>/dev/null | grep -q .; then
    echo "1"
    return
  fi

  echo "0"
}

has_source_changes() {
  local source_dir="$1"
  local output_file="$2"

  if git -C "$PROJECT_ROOT" diff --name-only HEAD -- "$source_dir" 2>/dev/null | grep -q .; then
    echo "1"
    return
  fi

  if git -C "$PROJECT_ROOT" ls-files --others --exclude-standard "$source_dir" 2>/dev/null | grep -q .; then
    echo "1"
    return
  fi

  local last_build_hash
  last_build_hash=$(git -C "$PROJECT_ROOT" log -n 1 --pretty=format:%H -- "$output_file" 2>/dev/null || echo "")

  if [ -n "$last_build_hash" ]; then
    local old_tree new_tree
    old_tree=$(git -C "$PROJECT_ROOT" ls-tree -r "$last_build_hash" -- "$source_dir" 2>/dev/null | sort)
    new_tree=$(git -C "$PROJECT_ROOT" ls-tree -r HEAD -- "$source_dir" 2>/dev/null | sort)

    if [ "$old_tree" != "$new_tree" ]; then
      echo "1"
      return
    fi
  fi

  echo "0"
}

enumerate_source_changes() {
  local source_dir="$1"
  local output_file="$2"
  local label="$3"

  local mod_count=0
  local new_count=0

  while IFS= read -r file; do
    if [ -n "$file" ]; then
      local rel="${file#"$source_dir"/}"
      if git -C "$PROJECT_ROOT" ls-files --error-unmatch "$file" >/dev/null 2>&1; then
        log_warn "Changed: $rel"
        mod_count=$((mod_count + 1))
      else
        log_add "New:     $rel"
        new_count=$((new_count + 1))
      fi
    fi
  done < <(git -C "$PROJECT_ROOT" diff --name-only HEAD -- "$source_dir" 2>/dev/null)

  while IFS= read -r file; do
    if [ -n "$file" ]; then
      local rel="${file#"$source_dir"/}"
      log_add "New:     $rel"
      new_count=$((new_count + 1))
    fi
  done < <(git -C "$PROJECT_ROOT" ls-files --others --exclude-standard "$source_dir")

  if [ $((mod_count + new_count)) -eq 0 ]; then
    local last_build_hash
    last_build_hash=$(git -C "$PROJECT_ROOT" log -n 1 --pretty=format:%H -- "$output_file" 2>/dev/null || echo "")

    if [ -n "$last_build_hash" ]; then
      while IFS= read -r file; do
        if [ -n "$file" ]; then
          local rel="${file#"$source_dir"/}"
          log_warn "Changed: $rel ${GREY}(committed)${NC}"
          mod_count=$((mod_count + 1))
        fi
      done < <(git -C "$PROJECT_ROOT" diff --name-only "$last_build_hash" HEAD -- "$source_dir")
    fi
  fi

  TARGET_MODIFIED_COUNT["$label"]=$mod_count
  TARGET_NEW_COUNT["$label"]=$new_count
}

scan_source_git_status() {
  local source_dir="$1"
  local output_file="$2"
  local label="$3"
  local changed_flag="$4"
  local template_changed="$5"

  if [ "$changed_flag" -eq 0 ]; then
    local total
    total=$(find "$PROJECT_ROOT/$source_dir" -type f | wc -l)
    log_info "$total items unchanged"
    TARGET_MODIFIED_COUNT["$label"]=0
    TARGET_NEW_COUNT["$label"]=0
    return
  fi

  local source_changed
  source_changed=$(has_source_changes "$source_dir" "$output_file")

  if [ "$template_changed" -eq 1 ] && [ "$source_changed" -eq 0 ]; then
    log_info "Template changed; sources unchanged"
    TARGET_MODIFIED_COUNT["$label"]=0
    TARGET_NEW_COUNT["$label"]=0
    return
  fi

  enumerate_source_changes "$source_dir" "$output_file" "$label"

  local mod_result="${TARGET_MODIFIED_COUNT[$label]}"
  local new_result="${TARGET_NEW_COUNT[$label]}"

  if [ $((mod_result + new_result)) -eq 0 ] && [ "$template_changed" -eq 0 ]; then
    log_warn "Artifacts out of sync (unknown source change)"
  fi
}

compile_dry_run() {
  TEMP_DIR=$(mktemp -d)

  for target in "${BUILD_TARGETS[@]}"; do
    IFS=':' read -r label src_rel ext output_rel template_rel placeholder <<<"$target"

    local temp_name
    temp_name=$(basename "$output_rel")

    "$ENGINE_SCRIPT" \
      "$PROJECT_ROOT/$src_rel" \
      "$src_rel" \
      "$PROJECT_ROOT/$template_rel" \
      "$TEMP_DIR/$temp_name" \
      "$placeholder" \
      ".$ext" 2>/dev/null

    if ! cmp -s "$TEMP_DIR/$temp_name" "$PROJECT_ROOT/$output_rel"; then
      TARGET_CHANGED["$label"]=1
    else
      TARGET_CHANGED["$label"]=0
    fi

    TARGET_TEMPLATE_CHANGED["$label"]=$(detect_template_change "$template_rel" "$output_rel")
  done
}

apply_artifacts() {
  log_step "Compiling Artifacts"

  for target in "${BUILD_TARGETS[@]}"; do
    IFS=':' read -r label _ _ output_rel _ _ <<<"$target"

    if [ "${TARGET_CHANGED[$label]}" -eq 1 ]; then
      local temp_name
      temp_name=$(basename "$output_rel")
      cp "$TEMP_DIR/$temp_name" "$PROJECT_ROOT/$output_rel"
      log_info "$(basename "$output_rel") updated"
    fi
  done
}

compose_commit_message() {
  local parts=()

  for target in "${BUILD_TARGETS[@]}"; do
    IFS=':' read -r label _ _ _ _ _ <<<"$target"
    local label_lower
    label_lower=$(echo "$label" | tr '[:upper:]' '[:lower:]')

    local mod="${TARGET_MODIFIED_COUNT[$label]:-0}"
    local new="${TARGET_NEW_COUNT[$label]:-0}"

    if [ "$mod" -gt 0 ]; then
      parts+=("update $mod $label_lower")
    fi
    if [ "$new" -gt 0 ]; then
      parts+=("add $new $label_lower")
    fi
  done

  if [ ${#parts[@]} -eq 0 ]; then
    local template_parts=()
    for target in "${BUILD_TARGETS[@]}"; do
      IFS=':' read -r label _ _ _ _ _ <<<"$target"
      if [ "${TARGET_TEMPLATE_CHANGED[$label]:-0}" -eq 1 ] && [ "${TARGET_CHANGED[$label]:-0}" -eq 1 ]; then
        local label_lower
        label_lower=$(echo "$label" | tr '[:upper:]' '[:lower:]')
        template_parts+=("$label_lower")
      fi
    done

    if [ ${#template_parts[@]} -gt 0 ]; then
      local joined
      joined=$(
        IFS=', '
        echo "${template_parts[*]}"
      )
      parts+=("update ${joined} template")
    fi
  fi

  local msg="chore(gov): "
  if [ ${#parts[@]} -eq 0 ]; then
    msg+="update compiled artifacts"
  else
    local first=true
    for part in "${parts[@]}"; do
      if $first; then
        msg+="$part"
        first=false
      else
        msg+=", $part"
      fi
    done
  fi

  echo "$msg"
}

commit_artifacts() {
  local msg
  msg=$(compose_commit_message)

  log_step "Staging Compiled Artifacts"

  for target in "${BUILD_TARGETS[@]}"; do
    IFS=':' read -r _ _ _ output_rel _ _ <<<"$target"
    git -C "$PROJECT_ROOT" add "$output_rel"
  done

  git -C "$PROJECT_ROOT" commit -m "$msg" --no-verify >/dev/null 2>&1
  log_add "Committed: $msg"
}

main() {
  if [[ "$1" == "-h" || "$1" == "--help" ]]; then
    show_help
  fi

  require_project_root

  echo -e "${GREY}┌${NC}"

  check_dependencies
  compile_dry_run

  for target in "${BUILD_TARGETS[@]}"; do
    IFS=':' read -r label src_rel _ output_rel _ _ <<<"$target"

    log_step "Scanning $label"
    scan_source_git_status "$src_rel" "$output_rel" "$label" "${TARGET_CHANGED[$label]}" "${TARGET_TEMPLATE_CHANGED[$label]}"
  done

  local total_artifacts=0
  for target in "${BUILD_TARGETS[@]}"; do
    IFS=':' read -r label _ _ _ _ _ <<<"$target"
    total_artifacts=$((total_artifacts + TARGET_CHANGED[$label]))
  done

  if [ "$total_artifacts" -eq 0 ]; then
    echo -e "${GREY}└${NC}\n"
    echo -e "${GREEN}✓ Everything up to date${NC}"
    exit 0
  fi

  select_option "Compile and commit changes?" "Yes" "No"

  if [ "$SELECTED_OPTION" == "No" ]; then
    log_warn "Build cancelled"
    echo -e "${GREY}└${NC}"
    exit 0
  fi

  apply_artifacts
  commit_artifacts

  echo -e "${GREY}└${NC}\n"
  echo -e "${GREEN}✓ Governance build complete${NC}"
}

main "$@"
