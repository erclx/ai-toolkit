#!/bin/bash
# shellcheck disable=SC2034  # constants are consumed by sourcing scripts

PROMPTS_INDEX_TITLE="Prompts"
PROMPTS_INDEX_SUBTITLE="System prompt templates for AI-assisted authoring. Each file generates a role-specific system prompt for a specific artifact type."

STANDARDS_INDEX_TITLE="Standards"
STANDARDS_INDEX_SUBTITLE="Reference docs for consistent authoring across the toolkit and target projects."

DOCS_INDEX_TITLE="Docs"
DOCS_INDEX_SUBTITLE="One-line reference for each doc in this folder."

WIKI_INDEX_TITLE="Wiki"
WIKI_INDEX_SUBTITLE="Reference pages for tools, workflows, and concepts. Written and maintained by hand. Follow \`standards/prose.md\` when writing or editing any wiki page."

read_frontmatter_field() {
  local file="$1"
  local key="$2"
  awk -v key="$key" '
    NR == 1 && /^---$/ { in_fm = 1; next }
    in_fm && /^---$/ { exit }
    in_fm {
      prefix = key ": "
      if (index($0, prefix) == 1) {
        print substr($0, length(prefix) + 1)
        exit
      }
    }
  ' "$file"
}

write_index() {
  local dir="$1"
  local title="$2"
  local subtitle="$3"
  local index_file="$dir/index.md"

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

  {
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
  } >"$index_file"
}
