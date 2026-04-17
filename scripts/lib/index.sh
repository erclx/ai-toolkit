#!/bin/bash

read_frontmatter_field() {
  local file="$1"
  local key="$2"
  awk -v key="$key" '
    NR == 1 && /^---$/ { in_fm = 1; next }
    in_fm && /^---$/ { exit }
    in_fm {
      prefix = key ": "
      if (index($0, prefix) == 1) {
        val = substr($0, length(prefix) + 1)
        if (length(val) >= 2) {
          first = substr(val, 1, 1)
          last = substr(val, length(val), 1)
          if ((first == "\"" && last == "\"") || (first == "'\''" && last == "'\''")) {
            val = substr(val, 2, length(val) - 2)
          }
        }
        print val
        exit
      }
    }
  ' "$file"
}

extract_frontmatter() {
  local file="$1"
  awk '
    NR == 1 && /^---$/ { print; in_fm = 1; next }
    in_fm { print; if ($0 == "---") exit }
  ' "$file"
}

list_indexes() {
  local root="$1"
  local candidates
  candidates=$(find "$root" \
    \( -path '*/node_modules' -o -name '.git' \) -prune \
    -o -type f -name "index.md" -print 2>/dev/null | sort)

  if [ -z "$candidates" ]; then
    return 0
  fi

  if ! git -C "$root" rev-parse --git-dir >/dev/null 2>&1; then
    printf '%s\n' "$candidates"
    return 0
  fi

  local ignored
  ignored=$(printf '%s\n' "$candidates" | git -C "$root" check-ignore --stdin 2>/dev/null) || true

  if [ -z "$ignored" ]; then
    printf '%s\n' "$candidates"
    return 0
  fi

  printf '%s\n' "$candidates" | grep -Fxv -f <(printf '%s\n' "$ignored")
}

compute_index_to() {
  local dir="$1"
  local out="$2"
  local index_file="$dir/index.md"

  local title subtitle
  title=$(read_frontmatter_field "$index_file" "title")
  subtitle=$(read_frontmatter_field "$index_file" "subtitle")

  local fm_errs=0
  if [ -z "$title" ]; then
    printf 'ERROR: missing frontmatter field "title" in %s\n' "$index_file" >&2
    fm_errs=$((fm_errs + 1))
  fi
  if [ -z "$subtitle" ]; then
    printf 'ERROR: missing frontmatter field "subtitle" in %s\n' "$index_file" >&2
    fm_errs=$((fm_errs + 1))
  fi
  if [ "$fm_errs" -gt 0 ]; then
    return 1
  fi

  local files=()
  while IFS= read -r f; do
    local name
    name=$(basename "$f")
    [ "$name" = "index.md" ] && continue
    files+=("$f")
  done < <(find "$dir" -maxdepth 1 -type f -name "*.md" | sort)

  local errs=0
  local f
  for f in "${files[@]}"; do
    local t d
    t=$(read_frontmatter_field "$f" "title")
    d=$(read_frontmatter_field "$f" "description")
    if [ -z "$t" ]; then
      printf 'ERROR: missing frontmatter field "title" in %s\n' "$f" >&2
      errs=$((errs + 1))
    fi
    if [ -z "$d" ]; then
      printf 'ERROR: missing frontmatter field "description" in %s\n' "$f" >&2
      errs=$((errs + 1))
    fi
  done
  if [ "$errs" -gt 0 ]; then
    printf 'ERROR: %d missing frontmatter field(s) in %s\n' "$errs" "$dir" >&2
    return 1
  fi

  local has_categories=0
  for f in "${files[@]}"; do
    local c
    c=$(read_frontmatter_field "$f" "category")
    if [ -n "$c" ]; then
      has_categories=1
      break
    fi
  done

  local frontmatter
  frontmatter=$(extract_frontmatter "$index_file")

  {
    printf '%s\n\n' "$frontmatter"
    printf '# %s\n\n' "$title"
    printf '%s\n\n' "$subtitle"

    if [ "$has_categories" -eq 1 ]; then
      local cats=()
      mapfile -t cats < <(
        for f in "${files[@]}"; do
          read_frontmatter_field "$f" "category"
        done | awk 'NF' | sort -u
      )

      local cat first=1
      for cat in "${cats[@]}"; do
        [ "$first" -eq 0 ] && printf '\n'
        first=0
        printf '## %s\n\n' "$cat"
        for f in "${files[@]}"; do
          local fm_c fm_t fm_d name
          fm_c=$(read_frontmatter_field "$f" "category")
          [ "$fm_c" != "$cat" ] && continue
          name=$(basename "$f")
          fm_t=$(read_frontmatter_field "$f" "title")
          fm_d=$(read_frontmatter_field "$f" "description")
          printf -- '- [%s](%s): %s\n' "$fm_t" "$name" "$fm_d"
        done
      done
    else
      for f in "${files[@]}"; do
        local name fm_t fm_d
        name=$(basename "$f")
        fm_t=$(read_frontmatter_field "$f" "title")
        fm_d=$(read_frontmatter_field "$f" "description")
        printf -- '- [%s](%s): %s\n' "$fm_t" "$name" "$fm_d"
      done
    fi
  } >"$out"
}

write_index() {
  local dir="$1"
  local index_file="$dir/index.md"

  if [ ! -f "$index_file" ]; then
    printf 'ERROR: %s has no index.md to regenerate\n' "$dir" >&2
    return 1
  fi

  local auto
  auto=$(read_frontmatter_field "$index_file" "auto")
  if [ "$auto" = "false" ]; then
    return 0
  fi

  local tmp
  tmp=$(mktemp)
  if ! compute_index_to "$dir" "$tmp"; then
    rm -f "$tmp"
    return 1
  fi

  if cmp -s "$tmp" "$index_file"; then
    rm -f "$tmp"
    return 0
  fi

  mv "$tmp" "$index_file"
}

walk_and_write_indexes() {
  local root="$1"
  local status=0
  local index_file
  while IFS= read -r index_file; do
    [ -z "$index_file" ] && continue
    local dir
    dir=$(dirname "$index_file")
    write_index "$dir" || status=1
  done < <(list_indexes "$root")
  return "$status"
}

# Walk up from `path` until an index.md is found, bounded by `root`.
# Prints the matched dir path, returns 1 if not found.
find_indexed_ancestor() {
  local path="$1"
  local root="$2"
  local dir root_abs

  if [ -d "$path" ]; then
    dir=$(cd "$path" 2>/dev/null && pwd)
  elif [ -f "$path" ]; then
    dir=$(cd "$(dirname "$path")" 2>/dev/null && pwd)
  else
    return 1
  fi
  [ -z "$dir" ] && return 1

  root_abs=$(cd "$root" 2>/dev/null && pwd)
  [ -z "$root_abs" ] && return 1

  while [[ "$dir" == "$root_abs"* ]]; do
    if [ -f "$dir/index.md" ]; then
      printf '%s\n' "$dir"
      return 0
    fi
    [ "$dir" = "$root_abs" ] && break
    dir=$(dirname "$dir")
  done
  return 1
}

json_escape_path() {
  local s="$1"
  s="${s//\\/\\\\}"
  s="${s//\"/\\\"}"
  printf '%s' "$s"
}

# Regenerate one folder's index.md with mode and reporting.
# Args: dir, dry_run (0|1), emit_json (0|1), first_ref (nameref to a 0|1 flag)
# Globals set: REGEN_LAST_ACTION ("written"|"would-write"|"unchanged"|"skipped"|"error")
# Exit: 0 ok, 1 error, 2 drift (would-write in dry-run)
regen_one() {
  local dir="$1"
  local dry_run="$2"
  local emit_json="$3"
  local -n _first="$4"

  local index_file="$dir/index.md"
  local action="" reason=""

  if [ ! -f "$index_file" ]; then
    action="error"
    reason="no index.md"
    printf 'ERROR: %s has no index.md\n' "$dir" >&2
  else
    local auto
    auto=$(read_frontmatter_field "$index_file" "auto")
    if [ "$auto" = "false" ]; then
      action="skipped"
      reason="auto:false"
    else
      local tmp
      tmp=$(mktemp)
      if ! compute_index_to "$dir" "$tmp"; then
        rm -f "$tmp"
        action="error"
        reason="frontmatter"
      elif cmp -s "$tmp" "$index_file"; then
        rm -f "$tmp"
        action="unchanged"
      elif [ "$dry_run" = "1" ]; then
        rm -f "$tmp"
        action="would-write"
      else
        mv "$tmp" "$index_file"
        action="written"
      fi
    fi
  fi

  # shellcheck disable=SC2034
  REGEN_LAST_ACTION="$action"

  if [ "$emit_json" = "1" ]; then
    if [ "$_first" -eq 0 ]; then printf ','; fi
    _first=0
    printf '{"path":"%s","action":"%s"' "$(json_escape_path "$index_file")" "$action"
    if [ -n "$reason" ]; then
      printf ',"reason":"%s"' "$(json_escape_path "$reason")"
    fi
    printf '}'
  fi

  case "$action" in
  error) return 1 ;;
  would-write) return 2 ;;
  *) return 0 ;;
  esac
}
