#!/usr/bin/env bash

# Reads one frontmatter field from a markdown file.
#
# Kept in bash because the list commands call it once per field per file
# inside a loop, where shelling into the CLI would cost a process per read.
# Index logic is TypeScript, in src/indexes/, and does not belong here.
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
