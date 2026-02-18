#!/bin/bash
set -e
set -o pipefail

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
WHITE='\033[1;37m'
GREY='\033[0;90m'
NC='\033[0m'

log_info() { echo -e "${GREY}│${NC} ${GREEN}✓${NC} $1"; }
log_warn() { echo -e "${GREY}│${NC} ${YELLOW}!${NC} $1"; }
log_error() {
  echo -e "${GREY}│${NC} ${RED}✗${NC} $1"
  exit 1
}
log_step() { echo -e "${GREY}│${NC}\n${GREY}├${NC} ${WHITE}$1${NC}"; }
log_add() { echo -e "${GREY}│${NC} ${GREEN}+${NC} $1"; }

select_option() {
  local prompt_text=$1
  shift
  local options=("$@")
  local cur=0
  local count=${#options[@]}

  echo -ne "${GREY}│${NC}\n${GREEN}◆${NC} ${prompt_text}\n"

  while true; do
    for i in "${!options[@]}"; do
      if [ "$i" -eq $cur ]; then
        echo -e "${GREY}│${NC}  ${GREEN}❯ ${options[$i]}${NC}"
      else
        echo -e "${GREY}│${NC}    ${GREY}${options[$i]}${NC}"
      fi
    done

    read -rsn1 key
    case "$key" in
    $'\x1b')
      if read -rsn2 -t 0.001 key_seq; then
        if [[ "$key_seq" == "[A" ]]; then cur=$(((cur - 1 + count) % count)); fi
        if [[ "$key_seq" == "[B" ]]; then cur=$(((cur + 1) % count)); fi
      else
        echo -en "\033[$((count + 1))A\033[J"
        echo -e "\033[1A${GREY}│${NC}\n${GREY}◇${NC} ${prompt_text} ${RED}Cancelled${NC}"
        echo -e "${GREY}└${NC}"
        exit 1
      fi
      ;;
    "k") cur=$(((cur - 1 + count) % count)) ;;
    "j") cur=$(((cur + 1) % count)) ;;
    "q")
      echo -en "\033[$((count + 1))A\033[J"
      echo -e "\033[1A${GREY}│${NC}\n${GREY}◇${NC} ${prompt_text} ${RED}Cancelled${NC}"
      echo -e "${GREY}└${NC}"
      exit 1
      ;;
    "") break ;;
    esac

    echo -en "\033[${count}A"
  done

  echo -en "\033[$((count + 1))A\033[J"
  echo -e "\033[1A${GREY}│${NC}\n${GREY}◇${NC} ${prompt_text} ${WHITE}${options[$cur]}${NC}"
  SELECTED_OPTION="${options[$cur]}"
}

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="${PROJECT_ROOT:-$(dirname "$SCRIPT_DIR")}"

ENGINE_SCRIPT="$PROJECT_ROOT/scripts/lib/compiler.sh"
RULES_SOURCE=".cursor/rules"
RULES_OUTPUT="gemini/commands/gov/rules.toml"
RULES_TEMPLATE="scripts/templates/rules.toml.template"
STANDARDS_SOURCE="standards"
STANDARDS_OUTPUT="gemini/commands/gov/standards.toml"
STANDARDS_TEMPLATE="scripts/templates/standards.toml.template"

TEMP_DIR=""
RULES_CHANGED=0
STANDARDS_CHANGED=0
RULES_TEMPLATE_CHANGED=0
STANDARDS_TEMPLATE_CHANGED=0
RULES_MODIFIED_COUNT=0
RULES_NEW_COUNT=0
STANDARDS_MODIFIED_COUNT=0
STANDARDS_NEW_COUNT=0

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
  if [ ! -d "$PROJECT_ROOT/$RULES_SOURCE" ]; then
    log_error "Rules source not found: $RULES_SOURCE"
  fi
  if [ ! -d "$PROJECT_ROOT/$STANDARDS_SOURCE" ]; then
    log_error "Standards source not found: $STANDARDS_SOURCE"
  fi
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
  local mod_var="$3"
  local new_var="$4"

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

  eval "$mod_var=$mod_count"
  eval "$new_var=$new_count"
}

scan_source_git_status() {
  local source_dir="$1"
  local output_file="$2"
  local mod_var="$3"
  local new_var="$4"
  local changed_flag="$5"
  local template_changed="$6"

  if [ "$changed_flag" -eq 0 ]; then
    local total
    total=$(find "$PROJECT_ROOT/$source_dir" -type f | wc -l)
    log_info "$total items unchanged"
    eval "$mod_var=0"
    eval "$new_var=0"
    return
  fi

  local source_changed
  source_changed=$(has_source_changes "$source_dir" "$output_file")

  if [ "$template_changed" -eq 1 ] && [ "$source_changed" -eq 0 ]; then
    log_info "Template changed; sources unchanged"
    eval "$mod_var=0"
    eval "$new_var=0"
    return
  fi

  enumerate_source_changes "$source_dir" "$output_file" "$mod_var" "$new_var"

  local mod_result new_result
  eval "mod_result=\$$mod_var"
  eval "new_result=\$$new_var"

  if [ $((mod_result + new_result)) -eq 0 ] && [ "$template_changed" -eq 0 ]; then
    log_warn "Artifacts out of sync (unknown source change)"
  fi
}

compile_dry_run() {
  TEMP_DIR=$(mktemp -d)

  "$ENGINE_SCRIPT" \
    "$PROJECT_ROOT/$RULES_SOURCE" \
    ".cursor/rules" \
    "$PROJECT_ROOT/$RULES_TEMPLATE" \
    "$TEMP_DIR/rules.toml" \
    "{{INJECT_ALL_RULES}}" \
    ".mdc" 2>/dev/null

  "$ENGINE_SCRIPT" \
    "$PROJECT_ROOT/$STANDARDS_SOURCE" \
    "standards" \
    "$PROJECT_ROOT/$STANDARDS_TEMPLATE" \
    "$TEMP_DIR/standards.toml" \
    "{{INJECT_STANDARDS}}" \
    ".md" 2>/dev/null

  if ! cmp -s "$TEMP_DIR/rules.toml" "$PROJECT_ROOT/$RULES_OUTPUT"; then
    RULES_CHANGED=1
  fi

  if ! cmp -s "$TEMP_DIR/standards.toml" "$PROJECT_ROOT/$STANDARDS_OUTPUT"; then
    STANDARDS_CHANGED=1
  fi

  RULES_TEMPLATE_CHANGED=$(detect_template_change "$RULES_TEMPLATE" "$RULES_OUTPUT")
  STANDARDS_TEMPLATE_CHANGED=$(detect_template_change "$STANDARDS_TEMPLATE" "$STANDARDS_OUTPUT")
}

apply_artifacts() {
  log_step "Compiling Artifacts"

  if [ "$RULES_CHANGED" -eq 1 ]; then
    cp "$TEMP_DIR/rules.toml" "$PROJECT_ROOT/$RULES_OUTPUT"
    log_info "rules.toml updated"
  fi

  if [ "$STANDARDS_CHANGED" -eq 1 ]; then
    cp "$TEMP_DIR/standards.toml" "$PROJECT_ROOT/$STANDARDS_OUTPUT"
    log_info "standards.toml updated"
  fi
}

compose_commit_message() {
  local parts=()

  if [ $RULES_MODIFIED_COUNT -gt 0 ]; then
    parts+=("update $RULES_MODIFIED_COUNT $([ $RULES_MODIFIED_COUNT -eq 1 ] && echo "rule" || echo "rules")")
  fi
  if [ $RULES_NEW_COUNT -gt 0 ]; then
    parts+=("add $RULES_NEW_COUNT $([ $RULES_NEW_COUNT -eq 1 ] && echo "rule" || echo "rules")")
  fi
  if [ $STANDARDS_MODIFIED_COUNT -gt 0 ]; then
    parts+=("update $STANDARDS_MODIFIED_COUNT $([ $STANDARDS_MODIFIED_COUNT -eq 1 ] && echo "standard" || echo "standards")")
  fi
  if [ $STANDARDS_NEW_COUNT -gt 0 ]; then
    parts+=("add $STANDARDS_NEW_COUNT $([ $STANDARDS_NEW_COUNT -eq 1 ] && echo "standard" || echo "standards")")
  fi

  if [ ${#parts[@]} -eq 0 ]; then
    local template_parts=()
    if [ "$RULES_TEMPLATE_CHANGED" -eq 1 ] && [ "$RULES_CHANGED" -eq 1 ]; then
      template_parts+=("rules")
    fi
    if [ "$STANDARDS_TEMPLATE_CHANGED" -eq 1 ] && [ "$STANDARDS_CHANGED" -eq 1 ]; then
      template_parts+=("standards")
    fi

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

  git -C "$PROJECT_ROOT" add \
    "$RULES_OUTPUT" \
    "$STANDARDS_OUTPUT"

  git -C "$PROJECT_ROOT" commit -m "$msg" --no-verify >/dev/null 2>&1
  log_add "Committed: $msg"
}

main() {
  if [[ "$1" == "-h" || "$1" == "--help" ]]; then
    show_help
  fi

  echo -e "${GREY}┌${NC}"

  check_dependencies
  compile_dry_run

  log_step "Scanning Governance Rules"
  scan_source_git_status "$RULES_SOURCE" "$RULES_OUTPUT" "RULES_MODIFIED_COUNT" "RULES_NEW_COUNT" "$RULES_CHANGED" "$RULES_TEMPLATE_CHANGED"

  log_step "Scanning Standards"
  scan_source_git_status "$STANDARDS_SOURCE" "$STANDARDS_OUTPUT" "STANDARDS_MODIFIED_COUNT" "STANDARDS_NEW_COUNT" "$STANDARDS_CHANGED" "$STANDARDS_TEMPLATE_CHANGED"

  local total_artifacts=$((RULES_CHANGED + STANDARDS_CHANGED))

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
