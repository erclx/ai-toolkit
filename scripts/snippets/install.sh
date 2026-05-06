#!/bin/bash
set -e
set -o pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="${PROJECT_ROOT:-$(dirname "$(dirname "$SCRIPT_DIR")")}"

source "$PROJECT_ROOT/scripts/lib/ui.sh"
trap close_timeline EXIT

SNIPPETS_SOURCE="$PROJECT_ROOT/snippets"
SNIPPETS_TOML="$SNIPPETS_SOURCE/snippets.toml"
INTERNAL_CATEGORIES=("aitk")

is_internal_category() {
  local name="$1"
  for internal in "${INTERNAL_CATEGORIES[@]}"; do
    [ "$name" = "$internal" ] && return 0
  done
  return 1
}

list_presets() {
  [ -f "$SNIPPETS_TOML" ] || return 0
  grep '^\[' "$SNIPPETS_TOML" | tr -d '[]' | sort
}

is_preset() {
  local name="$1"
  [ -f "$SNIPPETS_TOML" ] || return 1
  grep -q "^\[$name\]" "$SNIPPETS_TOML"
}

resolve_preset_slugs() {
  local preset="$1"
  local -n _slugs=$2

  local in_section=0
  local in_array=0
  while IFS= read -r line; do
    if [[ "$line" =~ ^\["$preset"\] ]]; then
      in_section=1
      continue
    fi
    if [[ "$in_section" -eq 1 && "$line" =~ ^\[.+\] ]]; then
      break
    fi
    [ "$in_section" -eq 0 ] && continue

    if [[ "$in_array" -eq 0 ]]; then
      [[ "$line" =~ ^names ]] || continue
      in_array=1
    fi

    while [[ "$line" =~ \"([^\"]+)\" ]]; do
      local slug="${BASH_REMATCH[1]}"
      _slugs+=("$slug")
      line=$(echo "$line" | sed "s/\"${slug}\"//")
    done

    [[ "$line" =~ \] ]] && in_array=0
  done <"$SNIPPETS_TOML"
}

collect_files_for_preset() {
  local preset="$1"
  local -n _dest=$2
  local slugs=()
  resolve_preset_slugs "$preset" slugs

  for slug in "${slugs[@]}"; do
    local src="$SNIPPETS_SOURCE/$slug.md"
    if [ -f "$src" ]; then
      _dest+=("$src")
    else
      log_warn "$slug (source not found, skipping)"
    fi
  done
}

show_help() {
  echo -e "${GREY}┌${NC}"
  echo -e "${GREY}├${NC} ${WHITE}Usage:${NC} aitk snippets install [category] [target-path]"
  echo -e "${GREY}│${NC}"
  echo -e "${GREY}│${NC}  ${WHITE}Arguments:${NC}"
  echo -e "${GREY}│${NC}    category      Preset, folder, or 'all' (e.g., essentials, base, claude, all)"
  echo -e "${GREY}│${NC}    target-path   Target directory (default: current directory)"
  echo -e "${GREY}│${NC}"
  echo -e "${GREY}│${NC}  ${WHITE}Options:${NC}"
  echo -e "${GREY}│${NC}    -h, --help    ${GREY}# Show this help message${NC}"
  echo -e "${GREY}│${NC}"
  echo -e "${GREY}│${NC}  ${WHITE}Examples:${NC}"
  echo -e "${GREY}│${NC}    aitk snippets install essentials"
  echo -e "${GREY}│${NC}    aitk snippets install all"
  echo -e "${GREY}│${NC}    aitk snippets install claude ../my-app"
  echo -e "${GREY}└${NC}"
  exit 0
}

list_categories() {
  while IFS= read -r preset; do
    [ -z "$preset" ] && continue
    echo "$preset"
  done < <(list_presets)
  echo "base"
  while IFS= read -r name; do
    is_internal_category "$name" && continue
    echo "$name"
  done < <(find "$SNIPPETS_SOURCE" -mindepth 1 -maxdepth 1 -type d -exec basename {} \; | sort)
}

select_category() {
  local categories=()
  mapfile -t categories < <(list_categories)

  if [ "${#categories[@]}" -eq 0 ]; then
    log_error "No categories found in snippets source."
  fi

  select_option "Select category to install:" "all" "${categories[@]}"
  echo "$SELECTED_OPTION"
}

collect_files_for_category() {
  local category="$1"
  local -n _files=$2

  if [ "$category" = "base" ]; then
    while IFS= read -r f; do
      _files+=("$f")
    done < <(find "$SNIPPETS_SOURCE" -maxdepth 1 -type f -name "*.md" | sort)
  else
    local dir="$SNIPPETS_SOURCE/$category"
    if [ ! -d "$dir" ]; then
      log_error "Category not found: $category"
    fi
    while IFS= read -r f; do
      _files+=("$f")
    done < <(find "$dir" -maxdepth 1 -type f -name "*.md" | sort)
  fi
}

collect_all_files() {
  local -n _all=$1

  collect_files_for_category "base" _all

  while IFS= read -r category; do
    is_internal_category "$category" && continue
    collect_files_for_category "$category" _all
  done < <(find "$SNIPPETS_SOURCE" -mindepth 1 -maxdepth 1 -type d -exec basename {} \; | sort)
}

derive_dest_rel_path() {
  local filepath="$1"
  local parent
  parent=$(basename "$(dirname "$filepath")")
  local filename
  filename=$(basename "$filepath")

  if [ "$parent" = "snippets" ]; then
    echo "$filename"
  else
    echo "${parent}/${filename}"
  fi
}

cmd_install() {
  local category="$1"
  local target="${2:-.}"

  if [ -z "$category" ]; then
    category=$(select_category)
  fi

  if is_internal_category "$category"; then
    log_error "Category '$category' is internal to the toolkit and not installable."
  fi

  guard_root "$target"

  local target_abs
  target_abs=$(cd "$target" && pwd)

  local files=()
  if [ "$category" = "all" ]; then
    collect_all_files files
    log_step "Resolving all categories"
  elif is_preset "$category"; then
    collect_files_for_preset "$category" files
    log_step "Resolving preset: $category"
  else
    collect_files_for_category "$category" files
    log_step "Resolving category: $category"
  fi

  if [ "${#files[@]}" -eq 0 ]; then
    log_warn "No snippets found for category: $category"
    exit 0
  fi

  for f in "${files[@]}"; do
    log_info "$(derive_dest_rel_path "$f")"
  done

  local dest_dir="$target_abs/snippets"
  local dest_dir_display="${target%/}/snippets"

  select_option "Install ${#files[@]} snippets to $dest_dir_display?" "Yes" "No"

  if [ "$SELECTED_OPTION" = "No" ]; then
    log_warn "Cancelled"
    exit 0
  fi

  log_step "Installing snippets"

  for f in "${files[@]}"; do
    local rel_path
    rel_path=$(derive_dest_rel_path "$f")
    local dest_file="$dest_dir/$rel_path"
    mkdir -p "$(dirname "$dest_file")"
    cp "$f" "$dest_file"
    log_add "snippets/$rel_path"
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
