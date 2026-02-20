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
      if [ "$i" -eq "$cur" ]; then
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

GOV_TARGETS=(
  "Rules:.cursor/rules:*.mdc:.cursor/rules"
  "Standards:standards:*.md:standards"
)

TOOLING_DIR="tooling"

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

  if [ ! -d "$src_dir" ]; then
    log_warn "Source directory not found: $src_dir"
    echo "0"
    return
  fi

  while IFS= read -r file; do
    local rel="${file#"$src_dir"/}"

    local dest
    if [ "$dest_prefix" = "." ]; then
      dest="$target_dir/$rel"
    else
      dest="$target_dir/$dest_prefix/$rel"
    fi

    if [ ! -f "$dest" ]; then
      if [ "$dest_prefix" = "." ]; then
        log_add "$rel"
      else
        log_add "$dest_prefix/$rel"
      fi
      echo "$file|$dest" >>"$PENDING_FILE"
      ((count++))
    elif ! diff -q "$file" "$dest" >/dev/null 2>&1; then
      if [ "$dest_prefix" = "." ]; then
        log_warn "Changed: $rel"
      else
        log_warn "Changed: $dest_prefix/$rel"
      fi
      echo "$file|$dest" >>"$PENDING_FILE"
      ((count++))
    fi
  done < <(find "$src_dir" -type f -name "$pattern")

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

discover_tooling_stacks() {
  TOOLING_STACKS=()

  if [ ! -d "$PROJECT_ROOT/$TOOLING_DIR" ]; then
    return
  fi

  while IFS= read -r stack_dir; do
    if [ -d "$stack_dir/configs" ]; then
      TOOLING_STACKS+=("$(basename "$stack_dir")")
    fi
  done < <(find "$PROJECT_ROOT/$TOOLING_DIR" -mindepth 1 -maxdepth 1 -type d | sort)
}

resolve_scope() {
  SELECTED_TARGETS=()

  case "$SELECTED_OPTION" in
  "Rules + Standards")
    SELECTED_TARGETS=("${GOV_TARGETS[@]}")
    ;;
  "Rules only")
    SELECTED_TARGETS=("${GOV_TARGETS[0]}")
    ;;
  "Standards only")
    SELECTED_TARGETS=("${GOV_TARGETS[1]}")
    ;;
  "Tooling")
    select_tooling_stack
    ;;
  esac
}

select_tooling_stack() {
  local options=("${TOOLING_STACKS[@]}")
  if [ ${#options[@]} -gt 1 ]; then
    options=("All" "${options[@]}")
  fi

  select_option "Select tooling stack:" "${options[@]}"

  if [ "$SELECTED_OPTION" = "All" ]; then
    for stack in "${TOOLING_STACKS[@]}"; do
      SELECTED_TARGETS+=("$stack:$TOOLING_DIR/$stack/configs:*:.")
    done
  else
    SELECTED_TARGETS+=("$SELECTED_OPTION:$TOOLING_DIR/$SELECTED_OPTION/configs:*:.")
  fi
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

  parse_args "$@"
  check_dependencies

  echo -e "${GREY}┌${NC}" >&2
  TARGET_PATH=$(validate_target "$TARGET_PATH")

  local TARGET_ABS
  TARGET_ABS=$(cd "$TARGET_PATH" && pwd)
  if [ "$TARGET_ABS" = "$PROJECT_ROOT" ]; then
    log_error "Cannot sync to ai-toolkit root. Files here are the source of truth."
  fi

  discover_tooling_stacks

  local scope_options=("Rules + Standards" "Rules only" "Standards only")
  if [ ${#TOOLING_STACKS[@]} -gt 0 ]; then
    scope_options+=("Tooling")
  fi

  select_option "Sync scope?" "${scope_options[@]}"
  resolve_scope

  PENDING_FILE=$(mktemp)
  trap 'rm -f "$PENDING_FILE"' EXIT

  declare -A TARGET_COUNTS
  local total=0

  for target in "${SELECTED_TARGETS[@]}"; do
    IFS=':' read -r label src_rel pattern dest_prefix <<<"$target"

    log_step "Syncing $label"
    local count
    count=$(collect_changes "$PROJECT_ROOT/$src_rel" "$TARGET_PATH" "$pattern" "$dest_prefix")
    TARGET_COUNTS["$label"]=$count
    total=$((total + count))

    if [ "$count" -eq 0 ]; then
      log_info "$label up to date"
    fi
  done

  if [ "$total" -gt 0 ]; then
    select_option "Apply $total changes?" "Yes" "No"
    if [ "$SELECTED_OPTION" == "Yes" ]; then
      apply_changes

      local summary=""
      for target in "${SELECTED_TARGETS[@]}"; do
        IFS=':' read -r label _ _ _ <<<"$target"
        local c="${TARGET_COUNTS[$label]}"
        if [ "$c" -gt 0 ]; then
          [ -n "$summary" ] && summary+=", "
          summary+="$c $label"
        fi
      done

      echo -e "${GREY}└${NC}\n" >&2
      echo -e "${GREEN}✓ Sync complete${NC} ${GREY}($summary)${NC}" >&2
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
