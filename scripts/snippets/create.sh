#!/bin/bash
set -e
set -o pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="${PROJECT_ROOT:-$(dirname "$(dirname "$SCRIPT_DIR")")}"

source "$PROJECT_ROOT/scripts/lib/ui.sh"
trap close_timeline EXIT

SNIPPETS_SOURCE="$PROJECT_ROOT/snippets"
TOML="$PROJECT_ROOT/snippets/snippets.toml"

show_help() {
  echo -e "${GREY}┌${NC}"
  echo -e "${GREY}├${NC} ${WHITE}Usage:${NC} aitk snippets create"
  echo -e "${GREY}│${NC}"
  echo -e "${GREY}│${NC}  Creates a new snippet: writes entry to snippets.toml and creates the slug file."
  echo -e "${GREY}│${NC}"
  echo -e "${GREY}│${NC}  ${WHITE}Options:${NC}"
  echo -e "${GREY}│${NC}    -h, --help    ${GREY}# Show this help message${NC}"
  echo -e "${GREY}└${NC}"
  exit 0
}

list_categories() {
  grep '^\[' "$TOML" | tr -d '[]' | sort
}

slug_error() {
  local slug="$1"
  if [ -z "$slug" ]; then
    echo "slug cannot be empty"
    return
  fi
  if [[ ! "$slug" =~ ^[a-z0-9]+(-[a-z0-9]+)*$ ]]; then
    echo "kebab-case only (e.g. my-snippet)"
    return
  fi
  if [ -f "$SNIPPETS_SOURCE/$slug.md" ]; then
    echo "slug '$slug' already exists"
    return
  fi
  echo ""
}

ask_slug() {
  local error
  while true; do
    ask "Snippet slug?" "SLUG_INPUT"
    error=$(slug_error "$SLUG_INPUT")
    if [ -z "$error" ]; then
      SLUG="$SLUG_INPUT"
      break
    fi
    log_warn "Invalid slug: $error"
  done
}

ask_category_name() {
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
    if grep -q "^\[$CATEGORY_INPUT\]" "$TOML"; then
      log_warn "Category '$CATEGORY_INPUT' already exists"
      continue
    fi
    CATEGORY_NAME="$CATEGORY_INPUT"
    break
  done
}

append_slug_to_category() {
  local category="$1"
  local slug="$2"
  local tmp
  tmp=$(mktemp)

  local in_section=0
  local in_array=0
  local inserted=0

  while IFS= read -r line; do
    if [[ "$inserted" -eq 0 && "$line" =~ ^\["$category"\] ]]; then
      in_section=1
      echo "$line" >>"$tmp"
      continue
    fi

    if [[ "$in_section" -eq 1 && "$inserted" -eq 0 ]]; then
      [[ "$line" =~ ^slugs ]] && in_array=1

      if [[ "$in_array" -eq 1 && "$line" =~ \] ]]; then
        echo "    \"$slug\"," >>"$tmp"
        inserted=1
      fi
    fi

    echo "$line" >>"$tmp"
  done <"$TOML"

  mv "$tmp" "$TOML"
}

append_new_category() {
  local category="$1"
  local slug="$2"
  printf '\n[%s]\nslugs = ["%s"]\n' "$category" "$slug" >>"$TOML"
}

cmd_create() {
  select_option "Category type?" "existing category" "new category"
  local type="$SELECTED_OPTION"

  local category
  if [ "$type" = "existing category" ]; then
    local categories=()
    mapfile -t categories < <(list_categories)
    if [ "${#categories[@]}" -eq 0 ]; then
      log_error "No categories found in snippets.toml"
    fi
    select_option "Select category:" "${categories[@]}"
    category="$SELECTED_OPTION"
  else
    ask_category_name
    category="$CATEGORY_NAME"
  fi

  ask_slug
  local slug="$SLUG"

  log_step "Registering slug"

  if [ "$type" = "new category" ]; then
    append_new_category "$category" "$slug"
    log_add "snippets.toml → [$category] → $slug"
  else
    append_slug_to_category "$category" "$slug"
    log_add "snippets.toml → $category → $slug"
  fi

  log_step "Creating file"

  printf '<!-- TODO: write %s prompt -->\n' "$slug" >"$SNIPPETS_SOURCE/$slug.md"
  log_add "snippets/$slug.md"
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
