#!/bin/bash
set -e
set -o pipefail

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
WHITE='\033[1;37m'
GREY='\033[0;90m'
NC='\033[0m'

log_info() { echo -e "${GREY}│${NC} ${GREEN}✓${NC} $1" >&2; }
log_warn() { echo -e "${GREY}│${NC} ${YELLOW}!${NC} $1" >&2; }
log_error() {
  echo -e "${GREY}│${NC} ${RED}✗${NC} $1" >&2
  exit 1
}
log_step() { echo -e "${GREY}│${NC}\n${GREY}├${NC} ${WHITE}$1${NC}" >&2; }
log_add() { echo -e "${GREY}│${NC} ${GREEN}+${NC} $1" >&2; }

select_option() {
  local prompt_text=$1
  shift
  local options=("$@")
  local cur=0
  local count=${#options[@]}

  echo -ne "${GREY}│${NC}\n${GREEN}◆${NC} ${prompt_text}\n" >&2

  while true; do
    for i in "${!options[@]}"; do
      if [ "$i" -eq $cur ]; then
        echo -e "${GREY}│${NC}  ${GREEN}❯ ${options[$i]}${NC}" >&2
      else
        echo -e "${GREY}│${NC}    ${GREY}${options[$i]}${NC}" >&2
      fi
    done

    read -rsn1 key
    case "$key" in
    $'\x1b')
      if read -rsn2 -t 0.001 key_seq; then
        if [[ "$key_seq" == "[A" ]]; then cur=$(((cur - 1 + count) % count)); fi
        if [[ "$key_seq" == "[B" ]]; then cur=$(((cur + 1) % count)); fi
      else
        echo -en "\033[$((count + 1))A\033[J" >&2
        echo -e "\033[1A${GREY}│${NC}\n${GREY}◇${NC} ${prompt_text} ${RED}Cancelled${NC}" >&2
        exit 1
      fi
      ;;
    "k") cur=$(((cur - 1 + count) % count)) ;;
    "j") cur=$(((cur + 1) % count)) ;;
    "q")
      echo -en "\033[$((count + 1))A\033[J" >&2
      echo -e "\033[1A${GREY}│${NC}\n${GREY}◇${NC} ${prompt_text} ${RED}Cancelled${NC}" >&2
      exit 1
      ;;
    "") break ;;
    esac

    echo -en "\033[${count}A" >&2
  done

  echo -en "\033[$((count + 1))A\033[J" >&2
  echo -e "\033[1A${GREY}│${NC}\n${GREY}◇${NC} ${prompt_text} ${WHITE}${options[$cur]}${NC}" >&2
  SELECTED_OPTION="${options[$cur]}"
}

show_help() {
  echo -e "${GREY}┌${NC}"
  log_step "Governance Sync Usage"
  echo -e "${GREY}│${NC}  ${WHITE}Usage:${NC} gdev sync [target-path]"
  echo -e "${GREY}│${NC}"
  echo -e "${GREY}│${NC}  ${WHITE}Arguments:${NC}"
  echo -e "${GREY}│${NC}    target-path      ${GREY}# Target directory (default: current directory)${NC}"
  echo -e "${GREY}│${NC}"
  echo -e "${GREY}│${NC}  ${WHITE}Options:${NC}"
  echo -e "${GREY}│${NC}    -h, --help       ${GREY}# Show this help message${NC}"
  echo -e "${GREY}└${NC}"
  exit 0
}

check_dependencies() {
  command -v diff >/dev/null 2>&1 || log_error "diff not installed"
  command -v find >/dev/null 2>&1 || log_error "find not installed"
}

validate_target() {
  local target=$1
  [ -z "$target" ] && target="."
  if [ ! -d "$target" ]; then
    log_error "Target directory not found: $target"
  fi
  echo "$target"
}

collect_changes() {
  local src_dir=$1
  local target_dir=$2
  local pattern=$3
  local dest_prefix=$4
  local count=0

  if [ -d "$src_dir" ]; then
    while IFS= read -r file; do
      local rel
      rel="$(basename "$file")"
      local dest="$target_dir/$dest_prefix/$rel"
      if [ ! -f "$dest" ]; then
        log_add "$dest_prefix/$rel"
        echo "$file|$dest" >>"$PENDING_FILE"
        ((count++))
      elif ! diff -q "$file" "$dest" >/dev/null 2>&1; then
        log_warn "Changed: $dest_prefix/$rel"
        echo "$file|$dest" >>"$PENDING_FILE"
        ((count++))
      fi
    done < <(find "$src_dir" -name "$pattern")
  else
    log_warn "Source directory not found: $src_dir"
  fi

  echo "$count"
}

apply_changes() {
  while IFS= read -r entry; do
    local src="${entry%%|*}"
    local dest="${entry##*|}"
    mkdir -p "$(dirname "$dest")"
    cp "$src" "$dest"
  done <"$PENDING_FILE"
}

resolve_scope() {
  case "$SELECTED_OPTION" in
  "Rules + Standards")
    SYNC_RULES=1
    SYNC_STANDARDS=1
    ;;
  "Rules only")
    SYNC_RULES=1
    SYNC_STANDARDS=0
    ;;
  "Standards only")
    SYNC_RULES=0
    SYNC_STANDARDS=1
    ;;
  esac
}

parse_args() {
  TARGET_PATH="."

  if [[ $# -gt 0 && "$1" != -* ]]; then
    TARGET_PATH="$1"
    shift
  fi

  while [[ $# -gt 0 ]]; do
    case $1 in
    -h | --help)
      show_help
      ;;
    *)
      shift
      ;;
    esac
  done
}

main() {
  SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
  PROJECT_ROOT="${PROJECT_ROOT:-$(dirname "$SCRIPT_DIR")}"

  SYNC_RULES=0
  SYNC_STANDARDS=0

  parse_args "$@"
  check_dependencies

  echo -e "${GREY}┌${NC}" >&2
  TARGET_PATH=$(validate_target "$TARGET_PATH")

  select_option "Sync scope?" "Rules + Standards" "Rules only" "Standards only"
  resolve_scope

  PENDING_FILE=$(mktemp)
  trap 'rm -f "$PENDING_FILE"' EXIT

  local gov_count=0
  local standard_count=0

  if [ "$SYNC_RULES" -eq 1 ]; then
    log_step "Syncing Governance Rules"
    gov_count=$(collect_changes "$PROJECT_ROOT/scripts/assets/cursor/rules" "$TARGET_PATH" "*.mdc" ".cursor/rules")

    if [ "$gov_count" -eq 0 ]; then
      log_info "All governance rules up to date"
    fi
  fi

  if [ "$SYNC_STANDARDS" -eq 1 ]; then
    log_step "Syncing Standards"
    standard_count=$(collect_changes "$PROJECT_ROOT/scripts/assets/standards" "$TARGET_PATH" "*.md" "standards")

    if [ "$standard_count" -eq 0 ]; then
      log_info "All standards up to date"
    fi
  fi

  local total=$((gov_count + standard_count))

  if [ "$total" -gt 0 ]; then
    select_option "Apply $total changes?" "Yes" "No"
    if [ "$SELECTED_OPTION" == "Yes" ]; then
      apply_changes
      echo -e "${GREY}└${NC}\n" >&2
      echo -e "${GREEN}✓ Sync complete${NC} ${GREY}($gov_count rules, $standard_count standards)${NC}" >&2
    else
      echo -e "${GREY}└${NC}\n" >&2
      echo -e "${YELLOW}● Sync cancelled${NC}" >&2
    fi
  else
    echo -e "${GREY}└${NC}\n" >&2
    echo -e "${GREEN}✓ Everything up to date${NC}" >&2
  fi
}

main "$@"
