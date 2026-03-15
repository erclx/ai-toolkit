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
  echo -e "${GREY}├${NC} ${WHITE}Usage:${NC} aitk snippets install [category] [target-path]"
  echo -e "${GREY}│${NC}"
  echo -e "${GREY}│${NC}  ${WHITE}Arguments:${NC}"
  echo -e "${GREY}│${NC}    category      Category name, or 'all' (e.g., base, claude, all)"
  echo -e "${GREY}│${NC}    target-path   Target directory (default: current directory)"
  echo -e "${GREY}│${NC}"
  echo -e "${GREY}│${NC}  ${WHITE}Options:${NC}"
  echo -e "${GREY}│${NC}    -h, --help    ${GREY}# Show this help message${NC}"
  echo -e "${GREY}│${NC}"
  echo -e "${GREY}│${NC}  ${WHITE}Examples:${NC}"
  echo -e "${GREY}│${NC}    aitk snippets install all"
  echo -e "${GREY}│${NC}    aitk snippets install base"
  echo -e "${GREY}│${NC}    aitk snippets install claude ../my-app"
  echo -e "${GREY}└${NC}"
  exit 0
}

list_categories() {
  grep '^\[' "$TOML" | tr -d '[]' | sort
}

select_category() {
  local categories=()
  mapfile -t categories < <(list_categories)

  if [ "${#categories[@]}" -eq 0 ]; then
    log_error "No categories found in snippets.toml"
  fi

  select_option "Select category to install:" "all" "${categories[@]}"
  echo "$SELECTED_OPTION"
}

resolve_slugs() {
  local category="$1"
  local -n _slugs=$2

  if ! grep -q "^\[$category\]" "$TOML"; then
    log_error "Category not found: $category"
  fi

  local in_section=0
  local in_array=0
  while IFS= read -r line; do
    if [[ "$line" =~ ^\["$category"\] ]]; then
      in_section=1
      continue
    fi
    if [[ "$in_section" -eq 1 && "$line" =~ ^\[.+\] ]]; then
      break
    fi
    [ "$in_section" -eq 0 ] && continue

    if [[ "$in_array" -eq 0 ]]; then
      [[ "$line" =~ ^slugs ]] || continue
      in_array=1
    fi

    while [[ "$line" =~ \"([^\"]+)\" ]]; do
      local slug="${BASH_REMATCH[1]}"
      _slugs+=("$slug")
      line=$(echo "$line" | sed "s/\"${slug}\"//")
    done

    [[ "$line" =~ \] ]] && in_array=0
  done <"$TOML"
}

resolve_all_slugs() {
  local -n _all_slugs=$1
  local seen=()

  while IFS= read -r category; do
    local cat_slugs=()
    resolve_slugs "$category" cat_slugs
    for slug in "${cat_slugs[@]}"; do
      local already=0
      for s in "${seen[@]}"; do
        [ "$s" = "$slug" ] && already=1 && break
      done
      if [ "$already" -eq 0 ]; then
        _all_slugs+=("$slug")
        seen+=("$slug")
      fi
    done
  done < <(list_categories)
}

cmd_install() {
  local category="$1"
  local target="${2:-.}"

  if [ -z "$category" ]; then
    category=$(select_category)
  fi

  local target_abs
  target_abs=$(cd "$target" && pwd)
  if [ "$target_abs" = "$PROJECT_ROOT" ]; then
    log_error "Cannot install into toolkit root."
  fi

  local slugs=()
  if [ "$category" = "all" ]; then
    resolve_all_slugs slugs
    log_step "Resolving all categories"
  else
    if ! grep -q "^\[$category\]" "$TOML"; then
      log_error "Category not found: $category"
    fi
    resolve_slugs "$category" slugs
    log_step "Resolving category: $category"
  fi

  if [ "${#slugs[@]}" -eq 0 ]; then
    log_warn "No slugs defined for category: $category"
    exit 0
  fi

  local found=()
  local missing=()

  for slug in "${slugs[@]}"; do
    local src="$SNIPPETS_SOURCE/$slug.md"
    if [ -f "$src" ]; then
      found+=("$slug")
      log_info "$slug"
    else
      missing+=("$slug")
    fi
  done

  for slug in "${missing[@]}"; do
    log_warn "$slug (source not found, skipping)"
  done

  local dest_dir="$target/snippets"

  select_option "Install ${#found[@]} snippets to $dest_dir?" "Yes" "No"

  if [ "$SELECTED_OPTION" = "No" ]; then
    log_warn "Cancelled"
    exit 0
  fi

  log_step "Installing snippets"

  mkdir -p "$dest_dir"

  for slug in "${found[@]}"; do
    cp "$SNIPPETS_SOURCE/$slug.md" "$dest_dir/$slug.md"
    log_add "snippets/$slug.md"
  done
}

main() {
  if [ "$1" = "-h" ] || [ "$1" = "--help" ]; then
    show_help
  fi

  cmd_install "$@"

  trap - EXIT
  echo -e "${GREY}└${NC}\n"
  echo -e "${GREEN}✓ Snippets installed${NC}"
}

main "$@"
