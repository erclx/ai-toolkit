#!/usr/bin/env bash
set -e
set -o pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="${PROJECT_ROOT:-$(dirname "$(dirname "$SCRIPT_DIR")")}"

source "$PROJECT_ROOT/scripts/lib/ui.sh"

SNIPPETS_DIR="$PROJECT_ROOT/snippets"
SNIPPETS_TOML="$SNIPPETS_DIR/snippets.toml"
INTERNAL_CATEGORIES=("aitk")

is_internal_category() {
  local name="$1"
  for internal in "${INTERNAL_CATEGORIES[@]}"; do
    [ "$name" = "$internal" ] && return 0
  done
  return 1
}

list_preset_names() {
  [ -f "$SNIPPETS_TOML" ] || return 0
  grep '^\[' "$SNIPPETS_TOML" | tr -d '[]' | sort
}

list_slugs_for_preset() {
  local preset="$1"
  [ -f "$SNIPPETS_TOML" ] || return 0

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
      echo "$slug"
      line=$(echo "$line" | sed "s/\"${slug}\"//")
    done

    [[ "$line" =~ \] ]] && in_array=0
  done <"$SNIPPETS_TOML"
}

show_help() {
  echo -e "${GREY}┌${NC}"
  echo -e "${GREY}├${NC} ${WHITE}Usage:${NC} aitk snippets list [options]"
  echo -e "${GREY}│${NC}"
  echo -e "${GREY}│${NC}  ${WHITE}Options:${NC}"
  echo -e "${GREY}│${NC}    --categories   ${GREY}# Only list presets and category names${NC}"
  echo -e "${GREY}│${NC}    --entries      ${GREY}# Only list entry slugs grouped by category${NC}"
  echo -e "${GREY}│${NC}    --json         ${GREY}# Emit machine-readable JSON${NC}"
  echo -e "${GREY}│${NC}    -h, --help     ${GREY}# Show this help message${NC}"
  echo -e "${GREY}└${NC}"
  exit 0
}

list_category_names() {
  echo "base"
  while IFS= read -r name; do
    is_internal_category "$name" && continue
    echo "$name"
  done < <(find "$SNIPPETS_DIR" -mindepth 1 -maxdepth 1 -type d -exec basename {} \; | sort)
}

list_entries_for_category() {
  local category="$1"
  local dir
  if [ "$category" = "base" ]; then
    dir="$SNIPPETS_DIR"
    find "$dir" -maxdepth 1 -type f -name "*.md" -exec basename {} .md \; | sort
  else
    dir="$SNIPPETS_DIR/$category"
    [ -d "$dir" ] || return
    find "$dir" -maxdepth 1 -type f -name "*.md" -exec basename {} .md \; | sort
  fi
}

list_presets_text() {
  local presets
  presets=$(list_preset_names)
  [ -z "$presets" ] && return 0

  log_step "Presets"
  local preset slug_count
  while IFS= read -r preset; do
    [ -z "$preset" ] && continue
    slug_count=$(list_slugs_for_preset "$preset" | wc -l | tr -d ' ')
    log_info "$preset ($slug_count entries)"
  done <<<"$presets"
}

list_categories_text() {
  log_step "Categories"
  local category entry_count
  while IFS= read -r category; do
    entry_count=$(list_entries_for_category "$category" | wc -l | tr -d ' ')
    log_info "$category ($entry_count entries)"
  done < <(list_category_names)
}

list_entries_text() {
  log_step "Entries"
  local category entry
  while IFS= read -r category; do
    while IFS= read -r entry; do
      [ -z "$entry" ] && continue
      if [ "$category" = "base" ]; then
        log_info "$entry"
      else
        log_info "$category/$entry"
      fi
    done < <(list_entries_for_category "$category")
  done < <(list_category_names)
}

list_categories_json() {
  local first=1
  local category entry first_entry
  printf '['
  while IFS= read -r category; do
    if [ "$first" -eq 0 ]; then
      printf ','
    fi
    printf '{"name":"%s","entries":[' "$category"
    first_entry=1
    while IFS= read -r entry; do
      [ -z "$entry" ] && continue
      if [ "$first_entry" -eq 0 ]; then
        printf ','
      fi
      printf '"%s"' "$entry"
      first_entry=0
    done < <(list_entries_for_category "$category")
    printf ']}'
    first=0
  done < <(list_category_names)
  printf ']'
}

list_presets_json() {
  local first=1
  local preset slug first_slug
  printf '['
  while IFS= read -r preset; do
    [ -z "$preset" ] && continue
    if [ "$first" -eq 0 ]; then
      printf ','
    fi
    printf '{"name":"%s","slugs":[' "$preset"
    first_slug=1
    while IFS= read -r slug; do
      [ -z "$slug" ] && continue
      if [ "$first_slug" -eq 0 ]; then
        printf ','
      fi
      printf '"%s"' "$slug"
      first_slug=0
    done < <(list_slugs_for_preset "$preset")
    printf ']}'
    first=0
  done < <(list_preset_names)
  printf ']'
}

main() {
  local show_categories=1
  local show_entries=1
  local json=0

  while [[ $# -gt 0 ]]; do
    case "$1" in
    -h | --help) show_help ;;
    --categories)
      show_entries=0
      shift
      ;;
    --entries)
      show_categories=0
      shift
      ;;
    --json)
      json=1
      shift
      ;;
    *) log_error "Unknown option: $1" ;;
    esac
  done

  trap close_timeline EXIT

  if [ "$json" -eq 1 ]; then
    printf '{"presets":'
    list_presets_json
    printf ',"categories":'
    list_categories_json
    printf '}\n'
    exit 0
  fi

  if [ "$show_categories" -eq 1 ]; then
    list_presets_text
    list_categories_text
  fi
  [ "$show_entries" -eq 1 ] && list_entries_text
}

main "$@"
