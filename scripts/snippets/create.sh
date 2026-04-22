#!/bin/bash
set -e
set -o pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="${PROJECT_ROOT:-$(dirname "$(dirname "$SCRIPT_DIR")")}"

source "$PROJECT_ROOT/scripts/lib/ui.sh"
trap close_timeline EXIT

SNIPPETS_SOURCE="$PROJECT_ROOT/snippets"
INTERNAL_CATEGORIES=("aitk")

is_internal_category() {
  local name="$1"
  for internal in "${INTERNAL_CATEGORIES[@]}"; do
    [ "$name" = "$internal" ] && return 0
  done
  return 1
}

show_help() {
  echo -e "${GREY}┌${NC}"
  echo -e "${GREY}├${NC} ${WHITE}Usage:${NC} aitk snippets create"
  echo -e "${GREY}│${NC}"
  echo -e "${GREY}│${NC}  Creates a new snippet: prompts for category and name, writes the file."
  echo -e "${GREY}│${NC}"
  echo -e "${GREY}│${NC}  ${WHITE}Options:${NC}"
  echo -e "${GREY}│${NC}    -h, --help    ${GREY}# Show this help message${NC}"
  echo -e "${GREY}└${NC}"
  exit 0
}

list_categories() {
  echo "base (root, no prefix)"
  while IFS= read -r name; do
    is_internal_category "$name" && continue
    echo "$name"
  done < <(find "$SNIPPETS_SOURCE" -mindepth 1 -maxdepth 1 -type d -exec basename {} \; | sort)
  echo "new category"
}

slug_error() {
  local slug="$1"
  local path="$2"
  if [ -z "$slug" ]; then
    echo "name cannot be empty"
    return
  fi
  if [[ ! "$slug" =~ ^[a-z0-9]+(-[a-z0-9]+)*$ ]]; then
    echo "kebab-case only (e.g. my-snippet)"
    return
  fi
  if [ -f "$path" ]; then
    echo "file already exists: $path"
    return
  fi
  echo ""
}

ask_new_category() {
  while true; do
    ask "Category name?" "CATEGORY_INPUT"
    if [ -z "$CATEGORY_INPUT" ]; then
      log_warn "Category name cannot be empty"
      continue
    fi
    if [[ ! "$CATEGORY_INPUT" =~ ^[a-z0-9]+(-[a-z0-9]+)*$ ]]; then
      log_warn "Invalid category: kebab-case only (e.g. my-category)"
      continue
    fi
    if [ -d "$SNIPPETS_SOURCE/$CATEGORY_INPUT" ]; then
      log_warn "Category '$CATEGORY_INPUT' already exists"
      continue
    fi
    CATEGORY_NAME="$CATEGORY_INPUT"
    break
  done
}

ask_name() {
  local category="$1"
  local is_base="$2"
  local label
  local error

  label="Snippet name?"

  while true; do
    ask "$label" "NAME_INPUT"
    local dest_path
    if [ "$is_base" = "true" ]; then
      dest_path="$SNIPPETS_SOURCE/$NAME_INPUT.md"
    else
      dest_path="$SNIPPETS_SOURCE/$category/$NAME_INPUT.md"
    fi
    error=$(slug_error "$NAME_INPUT" "$dest_path")
    if [ -z "$error" ]; then
      NAME="$NAME_INPUT"
      break
    fi
    log_warn "Invalid name: $error"
  done
}

cmd_create() {
  local categories=()
  mapfile -t categories < <(list_categories)

  select_option "Category?" "${categories[@]}"
  local selected="$SELECTED_OPTION"

  local category
  local is_base="false"

  if [ "$selected" = "base (root, no prefix)" ]; then
    is_base="true"
    category="base"
  elif [ "$selected" = "new category" ]; then
    ask_new_category
    category="$CATEGORY_NAME"
  else
    category="$selected"
  fi

  ask_name "$category" "$is_base"
  local name="$NAME"

  local dest_path
  local install_path
  if [ "$is_base" = "true" ]; then
    dest_path="$SNIPPETS_SOURCE/$name.md"
    install_path="snippets/$name"
  else
    dest_path="$SNIPPETS_SOURCE/$category/$name.md"
    install_path="snippets/$category/$name"
  fi

  log_info "Installs as: @${install_path}"

  log_step "Creating file"

  if [ "$is_base" = "false" ]; then
    mkdir -p "$SNIPPETS_SOURCE/$category"
  fi

  printf '<!-- TODO: write %s prompt -->\n' "$slug" >"$dest_path"

  if [ "$is_base" = "true" ]; then
    log_add "snippets/$name.md"
  else
    log_add "snippets/$category/$name.md"
  fi
}

main() {
  if [ "$1" = "-h" ] || [ "$1" = "--help" ]; then
    show_help
  fi

  cmd_create

  trap - EXIT
  echo -e "${GREY}└${NC}\n"
  echo -e "${GREEN}✓ Snippet created${NC}"
}

main "$@"
