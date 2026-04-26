#!/bin/bash
set -e
set -o pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="${PROJECT_ROOT:-$(dirname "$(dirname "$SCRIPT_DIR")")}"

source "$PROJECT_ROOT/scripts/lib/ui.sh"

STACKS_DIR="$PROJECT_ROOT/governance/stacks"
RULES_DIR="$PROJECT_ROOT/governance/rules"

show_help() {
  echo -e "${GREY}┌${NC}"
  echo -e "${GREY}├${NC} ${WHITE}Usage:${NC} aitk gov list [options]"
  echo -e "${GREY}│${NC}"
  echo -e "${GREY}│${NC}  ${WHITE}Options:${NC}"
  echo -e "${GREY}│${NC}    --stacks    ${GREY}# Only list stacks${NC}"
  echo -e "${GREY}│${NC}    --rules     ${GREY}# Only list rules${NC}"
  echo -e "${GREY}│${NC}    --json      ${GREY}# Emit machine-readable JSON${NC}"
  echo -e "${GREY}│${NC}    -h, --help  ${GREY}# Show this help message${NC}"
  echo -e "${GREY}└${NC}"
  exit 0
}

read_frontmatter_field() {
  local file="$1"
  local field="$2"
  awk -v f="$field" '
    BEGIN { fm = 0 }
    /^---$/ { fm++; if (fm > 1) exit; next }
    fm == 1 {
      if (match($0, "^" f ":")) {
        val = substr($0, RLENGTH + 1)
        sub(/^[[:space:]]+/, "", val)
        sub(/^[\x27"]/, "", val)
        sub(/[\x27"]$/, "", val)
        print val
        exit
      }
    }
  ' "$file"
}

read_frontmatter_paths() {
  local file="$1"
  awk '
    BEGIN { fm = 0; in_paths = 0 }
    /^---$/ { fm++; if (fm > 1) exit; next }
    fm == 1 {
      if (in_paths) {
        if (match($0, /^[[:space:]]*-[[:space:]]+/)) {
          val = substr($0, RLENGTH + 1)
          sub(/^[\x27"]/, "", val)
          sub(/[\x27"]$/, "", val)
          print val
          next
        }
        in_paths = 0
      }
      if ($0 == "paths:") { in_paths = 1 }
    }
  ' "$file"
}

rule_domain() {
  local file="$1"
  local rel="${file#"$RULES_DIR"/}"
  echo "${rel%%/*}"
}

stack_rules_array() {
  local toml="$1"
  grep -oE '"[0-9]{3}-[a-z0-9-]+"' "$toml" | sed 's/"//g'
}

json_escape() {
  local s="$1"
  s="${s//\\/\\\\}"
  s="${s//\"/\\\"}"
  printf '%s' "$s"
}

list_stacks_text() {
  log_step "Stacks"
  local toml
  for toml in "$STACKS_DIR"/*.toml; do
    local name
    name=$(basename "$toml" .toml)
    local extends
    extends=$(grep '^extends' "$toml" | cut -d'"' -f2)
    local rule_count
    rule_count=$(stack_rules_array "$toml" | wc -l)
    if [ -n "$extends" ]; then
      log_info "$name (extends: $extends, $rule_count rules)"
    else
      log_info "$name ($rule_count rules)"
    fi
  done
}

list_rules_text() {
  log_step "Rules"
  local file
  while IFS= read -r file; do
    local name
    name=$(basename "$file" .mdc)
    local domain
    domain=$(rule_domain "$file")
    local desc
    desc=$(read_frontmatter_field "$file" "description")
    log_info "$name [$domain] $desc"
  done < <(find "$RULES_DIR" -type f -name "*.mdc" | sort)
}

list_stacks_json() {
  local first=1
  local toml
  printf '['
  for toml in "$STACKS_DIR"/*.toml; do
    local name
    name=$(basename "$toml" .toml)
    local extends
    extends=$(grep '^extends' "$toml" | cut -d'"' -f2)
    local rules_json="["
    local first_rule=1
    local rule
    while IFS= read -r rule; do
      [ -z "$rule" ] && continue
      if [ "$first_rule" -eq 0 ]; then
        rules_json+=","
      fi
      rules_json+="\"$rule\""
      first_rule=0
    done < <(stack_rules_array "$toml")
    rules_json+="]"
    if [ "$first" -eq 0 ]; then
      printf ','
    fi
    if [ -n "$extends" ]; then
      printf '{"name":"%s","extends":"%s","rules":%s}' "$name" "$extends" "$rules_json"
    else
      printf '{"name":"%s","extends":null,"rules":%s}' "$name" "$rules_json"
    fi
    first=0
  done
  printf ']'
}

list_rules_json() {
  local first=1
  local file
  printf '['
  while IFS= read -r file; do
    local name
    name=$(basename "$file" .mdc)
    local domain
    domain=$(rule_domain "$file")
    local desc
    desc=$(read_frontmatter_field "$file" "description")

    local paths_json="null"
    local paths_collected=()
    while IFS= read -r p; do
      [ -n "$p" ] && paths_collected+=("$p")
    done < <(read_frontmatter_paths "$file")
    if [ "${#paths_collected[@]}" -gt 0 ]; then
      paths_json="["
      local first_p=1
      local p
      for p in "${paths_collected[@]}"; do
        [ "$first_p" -eq 0 ] && paths_json+=","
        paths_json+="\"$(json_escape "$p")\""
        first_p=0
      done
      paths_json+="]"
    fi

    if [ "$first" -eq 0 ]; then
      printf ','
    fi
    printf '{"name":"%s","domain":"%s","description":"%s","paths":%s}' \
      "$name" "$domain" "$(json_escape "$desc")" "$paths_json"
    first=0
  done < <(find "$RULES_DIR" -type f -name "*.mdc" | sort)
  printf ']'
}

main() {
  local show_stacks=1
  local show_rules=1
  local json=0

  while [[ $# -gt 0 ]]; do
    case "$1" in
    -h | --help) show_help ;;
    --stacks)
      show_rules=0
      shift
      ;;
    --rules)
      show_stacks=0
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
    printf '{'
    if [ "$show_stacks" -eq 1 ]; then
      printf '"stacks":'
      list_stacks_json
      [ "$show_rules" -eq 1 ] && printf ','
    fi
    if [ "$show_rules" -eq 1 ]; then
      printf '"rules":'
      list_rules_json
    fi
    printf '}\n'
    exit 0
  fi

  [ "$show_stacks" -eq 1 ] && list_stacks_text
  [ "$show_rules" -eq 1 ] && list_rules_text
}

main "$@"
