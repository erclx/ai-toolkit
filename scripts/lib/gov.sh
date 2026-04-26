#!/bin/bash

strip_frontmatter() {
  local file="$1"
  local in_frontmatter=0
  local past_frontmatter=0

  while IFS= read -r line; do
    if [ "$past_frontmatter" -eq 1 ]; then
      echo "$line"
      continue
    fi

    if [ "$in_frontmatter" -eq 0 ] && [ "$line" = "---" ]; then
      in_frontmatter=1
      continue
    fi

    if [ "$in_frontmatter" -eq 1 ] && [ "$line" = "---" ]; then
      past_frontmatter=1
      continue
    fi

    if [ "$in_frontmatter" -eq 0 ]; then
      echo "$line"
    fi
  done <"$file"
}

transform_to_claude_rule() {
  local src="$1"
  local description=""
  local globs=""
  local always_apply=""
  local in_frontmatter=0
  local past_frontmatter=0

  while IFS= read -r line; do
    if [ "$past_frontmatter" -eq 1 ]; then
      continue
    fi
    if [ "$in_frontmatter" -eq 0 ] && [ "$line" = "---" ]; then
      in_frontmatter=1
      continue
    fi
    if [ "$in_frontmatter" -eq 1 ] && [ "$line" = "---" ]; then
      past_frontmatter=1
      continue
    fi
    if [ "$in_frontmatter" -eq 1 ]; then
      case "$line" in
      description:*)
        description="${line#description:}"
        description="${description# }"
        ;;
      globs:*)
        globs="${line#globs:}"
        globs="${globs# }"
        ;;
      alwaysApply:*)
        always_apply="${line#alwaysApply:}"
        always_apply="${always_apply# }"
        ;;
      esac
    fi
  done <"$src"

  globs="${globs#\'}"
  globs="${globs%\'}"
  globs="${globs#\"}"
  globs="${globs%\"}"

  echo "---"
  if [ -n "$description" ]; then
    echo "description: $description"
  fi
  if [ "$always_apply" != "true" ] && [ -n "$globs" ]; then
    echo "paths:"
    local glob
    set -f
    local IFS_BACKUP="$IFS"
    IFS=','
    for glob in $globs; do
      glob="${glob# }"
      glob="${glob% }"
      [ -n "$glob" ] && echo "  - '$glob'"
    done
    IFS="$IFS_BACKUP"
    set +f
  fi
  echo "---"

  strip_frontmatter "$src"
}

rule_subdir() {
  local src="$1"
  local rules_root="${2:-$PROJECT_ROOT/governance/rules}"
  local rel="${src#"$rules_root/"}"
  local subdir
  subdir=$(dirname "$rel")
  [ "$subdir" = "." ] && subdir=""
  echo "$subdir"
}

build_rules_payload() {
  local rules_dir="$1"
  local filter="${2:-}"
  local pattern="${3:-*.mdc}"
  local payload_file
  payload_file=$(mktemp)

  local files=()
  if [ -n "$filter" ]; then
    for name in $filter; do
      local f
      f=$(find "$rules_dir" -type f \( -name "${name}.mdc" -o -name "${name}.md" \) | head -n 1)
      [ -n "$f" ] && files+=("$f")
    done
    mapfile -t files < <(printf '%s\n' "${files[@]}" | sort)
  else
    while IFS= read -r f; do
      files+=("$f")
    done < <(find "$rules_dir" -type f -name "$pattern" | sort)
  fi

  local last_file="${files[-1]:-}"

  for file in "${files[@]}"; do
    local filename
    filename=$(basename "$file")
    filename="${filename%.mdc}"
    filename="${filename%.md}"

    echo "<rule name=\"$filename\">" >>"$payload_file"
    strip_frontmatter "$file" | sed -e '/./,$!d' -e :a -e '/^\n*$/{$d;N;ba' -e '}' >>"$payload_file"
    echo "</rule>" >>"$payload_file"
    [[ "$file" != "$last_file" ]] && echo "" >>"$payload_file"
  done

  sed -i -e :a -e '/^\n*$/{$d;N;ba' -e '}' "$payload_file"

  echo "$payload_file"
}
