#!/bin/bash
set -e
set -o pipefail

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
WHITE='\033[1;37m'
GREY='\033[0;90m'
NC='\033[0m'

log_info()  { echo -e "${GREY}│${NC} ${GREEN}✓${NC} $1"; }
log_warn()  { echo -e "${GREY}│${NC} ${YELLOW}!${NC} $1"; }
log_error() { echo -e "${GREY}│${NC} ${RED}✗${NC} $1"; exit 1; }
log_step()  { echo -e "${GREY}│${NC}\n${GREY}├${NC} ${WHITE}$1${NC}"; }
log_add()   { echo -e "${GREY}│${NC} ${GREEN}+${NC} $1"; }

select_option() {
  local prompt_text=$1
  shift
  local options=("$@")
  local cur=0
  local count=${#options[@]}

  echo -ne "${GREY}│${NC}\n${GREEN}◆${NC} ${prompt_text}\n"

  while true; do
    for i in "${!options[@]}"; do
      if [ $i -eq $cur ]; then
        echo -e "${GREY}│${NC}  ${GREEN}❯ ${options[$i]}${NC}"
      else
        echo -e "${GREY}│${NC}    ${GREY}${options[$i]}${NC}"
      fi
    done

    read -rsn1 key
    case "$key" in
      $'\x1b')
        if read -rsn2 -t 0.001 key_seq; then
          if [[ "$key_seq" == "[A" ]]; then cur=$(( (cur - 1 + count) % count )); fi
          if [[ "$key_seq" == "[B" ]]; then cur=$(( (cur + 1) % count )); fi
        else
          echo -en "\033[$((count + 1))A\033[J"
          echo -e "\033[1A${GREY}│${NC}\n${GREY}◇${NC} ${prompt_text} ${RED}Cancelled${NC}"
          echo -e "${GREY}└${NC}"
          exit 1
        fi
        ;;
      "k") cur=$(( (cur - 1 + count) % count ));;
      "j") cur=$(( (cur + 1) % count ));;
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
RULES_SOURCE="scripts/assets/cursor/rules"
RULES_OUTPUT="commands/gov/rules.toml"
RULES_TEMPLATE="scripts/assets/templates/rules.toml.template"
DOCS_SOURCE="scripts/assets/docs"
DOCS_OUTPUT="commands/gov/docs.toml"
DOCS_TEMPLATE="scripts/assets/templates/docs.toml.template"
DOCS_SYNC_TARGET="docs"

TEMP_DIR=""
RULES_CHANGED=0
DOCS_CHANGED=0
RULES_MODIFIED_COUNT=0
RULES_NEW_COUNT=0
DOCS_MODIFIED_COUNT=0
DOCS_NEW_COUNT=0

show_help() {
  echo -e "${GREY}┌${NC}"
  log_step "Governance Build"
  echo -e "${GREY}│${NC}  ${WHITE}Usage:${NC} gdev build"
  echo -e "${GREY}│${NC}"
  echo -e "${GREY}│${NC}  Scans source rules and docs for changes,"
  echo -e "${GREY}│${NC}  recompiles .toml artifacts, syncs docs/,"
  echo -e "${GREY}│${NC}  and commits the compiled output."
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
  if [ ! -d "$PROJECT_ROOT/$DOCS_SOURCE" ]; then
    log_error "Docs source not found: $DOCS_SOURCE"
  fi
}

cleanup() {
  if [ -n "$TEMP_DIR" ] && [ -d "$TEMP_DIR" ]; then
    rm -rf "$TEMP_DIR"
  fi
}
trap cleanup EXIT

scan_source_git_status() {
  local source_dir="$1"
  local output_file="$2"
  local mod_var="$3"
  local new_var="$4"
  local changed_flag="$5"

  local mod_count=0
  local new_count=0

  if [ "$changed_flag" -eq 1 ]; then
    while IFS= read -r file; do
      if [ -n "$file" ]; then
        local rel="${file#$source_dir/}"
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
         local rel="${file#$source_dir/}"
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
            local rel="${file#$source_dir/}"
            log_warn "Changed: $rel ${GREY}(committed)${NC}"
            mod_count=$((mod_count + 1))
          fi
         done < <(git -C "$PROJECT_ROOT" diff --name-only "$last_build_hash" HEAD -- "$source_dir")
       fi
    fi
  fi

  if [ "$changed_flag" -eq 0 ]; then
    local total
    total=$(find "$PROJECT_ROOT/$source_dir" -type f | wc -l)
    log_info "$total items unchanged"
  elif [ $((mod_count + new_count)) -eq 0 ]; then
    log_warn "Artifacts out of sync (unknown source change)"
  fi

  eval "$mod_var=$mod_count"
  eval "$new_var=$new_count"
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
    "$PROJECT_ROOT/$DOCS_SOURCE" \
    "docs" \
    "$PROJECT_ROOT/$DOCS_TEMPLATE" \
    "$TEMP_DIR/docs.toml" \
    "{{INJECT_DOCS}}" \
    ".md" 2>/dev/null

  if ! cmp -s "$TEMP_DIR/rules.toml" "$PROJECT_ROOT/$RULES_OUTPUT"; then
    RULES_CHANGED=1
  fi

  if ! cmp -s "$TEMP_DIR/docs.toml" "$PROJECT_ROOT/$DOCS_OUTPUT"; then
    DOCS_CHANGED=1
  fi
  
  if [ -d "$PROJECT_ROOT/$DOCS_SYNC_TARGET" ]; then
    if diff -qr "$PROJECT_ROOT/$DOCS_SOURCE" "$PROJECT_ROOT/$DOCS_SYNC_TARGET" >/dev/null 2>&1; then
       :
    else
       DOCS_CHANGED=1
    fi
  else
    DOCS_CHANGED=1
  fi
}

apply_artifacts() {
  log_step "Compiling Artifacts"

  cp "$TEMP_DIR/rules.toml" "$PROJECT_ROOT/$RULES_OUTPUT"
  log_info "rules.toml updated"

  cp "$TEMP_DIR/docs.toml" "$PROJECT_ROOT/$DOCS_OUTPUT"
  log_info "docs.toml updated"

  mkdir -p "$PROJECT_ROOT/$DOCS_SYNC_TARGET"
  cp -r "$PROJECT_ROOT/$DOCS_SOURCE/." "$PROJECT_ROOT/$DOCS_SYNC_TARGET/"
  log_info "Synced docs/ updated"
}

compose_commit_message() {
  local parts=()

  if [ $RULES_MODIFIED_COUNT -gt 0 ]; then
    parts+=("update $RULES_MODIFIED_COUNT $([ $RULES_MODIFIED_COUNT -eq 1 ] && echo "rule" || echo "rules")")
  fi
  if [ $RULES_NEW_COUNT -gt 0 ]; then
    parts+=("add $RULES_NEW_COUNT $([ $RULES_NEW_COUNT -eq 1 ] && echo "rule" || echo "rules")")
  fi
  if [ $DOCS_MODIFIED_COUNT -gt 0 ]; then
    parts+=("update $DOCS_MODIFIED_COUNT $([ $DOCS_MODIFIED_COUNT -eq 1 ] && echo "doc" || echo "docs")")
  fi
  if [ $DOCS_NEW_COUNT -gt 0 ]; then
    parts+=("add $DOCS_NEW_COUNT $([ $DOCS_NEW_COUNT -eq 1 ] && echo "doc" || echo "docs")")
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
    "$DOCS_OUTPUT" \
    "$DOCS_SYNC_TARGET/"

  git -C "$PROJECT_ROOT" commit -m "$msg" --no-verify
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
  scan_source_git_status "$RULES_SOURCE" "$RULES_OUTPUT" "RULES_MODIFIED_COUNT" "RULES_NEW_COUNT" "$RULES_CHANGED"

  log_step "Scanning Documentation"
  scan_source_git_status "$DOCS_SOURCE" "$DOCS_OUTPUT" "DOCS_MODIFIED_COUNT" "DOCS_NEW_COUNT" "$DOCS_CHANGED"

  local total_files=$((RULES_MODIFIED_COUNT + RULES_NEW_COUNT + DOCS_MODIFIED_COUNT + DOCS_NEW_COUNT))
  local total_artifacts=$((RULES_CHANGED + DOCS_CHANGED))

  if [ "$total_artifacts" -eq 0 ]; then
    echo -e "${GREY}└${NC}\n"
    echo -e "${GREEN}✓ Everything up to date${NC}"
    exit 0
  fi

  select_option "Compile and commit changes?" "Yes" "No"
  echo -e "${GREY}│${NC}"

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
