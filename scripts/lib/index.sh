#!/bin/bash
# shellcheck disable=SC2034  # constants are consumed by sourcing scripts

PROMPTS_INDEX_TITLE="Prompts"
PROMPTS_INDEX_SUBTITLE="System prompt templates for AI-assisted authoring. Each file generates a role-specific system prompt for a specific artifact type."

STANDARDS_INDEX_TITLE="Standards"
STANDARDS_INDEX_SUBTITLE="Reference docs for consistent authoring across the toolkit and target projects."

read_h1_title() {
  local file="$1"
  awk '
    /^# / {
      sub(/^# +/, "", $0)
      print $0
      exit
    }
  ' "$file"
}

write_index() {
  local dir="$1"
  local title="$2"
  local subtitle="$3"
  local index_file="$dir/index.md"

  {
    printf '# %s\n\n' "$title"
    printf '%s\n\n' "$subtitle"

    while IFS= read -r file; do
      local filename
      filename=$(basename "$file")
      [ "$filename" = "index.md" ] && continue
      local entry_title
      entry_title=$(read_h1_title "$file")
      printf -- '- [`%s`](%s): %s\n' "$filename" "$filename" "$entry_title"
    done < <(find "$dir" -maxdepth 1 -type f -name "*.md" | sort)
  } >"$index_file"
}
