#!/bin/bash
set -e
set -o pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="${PROJECT_ROOT:-$(dirname "$SCRIPT_DIR")}"

source "$PROJECT_ROOT/scripts/lib/ui.sh"
source "$PROJECT_ROOT/scripts/lib/inject.sh"

CLAUDE_SEEDS_DIR="$PROJECT_ROOT/tooling/claude/seeds/.claude"
CLAUDE_MANIFEST="$PROJECT_ROOT/tooling/claude/manifest.toml"

show_help() {
  echo -e "${GREY}┌${NC}"
  echo -e "${GREY}├${NC} ${WHITE}Usage:${NC} aitk claude [command] [target-path]"
  echo -e "${GREY}│${NC}"
  echo -e "${GREY}│${NC}  ${WHITE}Commands:${NC}"
  echo -e "${GREY}│${NC}    init      ${GREY}# Seed .claude/ workflow docs into a project${NC}"
  echo -e "${GREY}│${NC}    sync      ${GREY}# Diff managed role prompts against seed and apply${NC}"
  echo -e "${GREY}│${NC}    prompt    ${GREY}# Generate master prompt from installed cursor rules${NC}"
  echo -e "${GREY}│${NC}"
  echo -e "${GREY}│${NC}  ${WHITE}Arguments:${NC}"
  echo -e "${GREY}│${NC}    target-path   Target directory (default: current directory)"
  echo -e "${GREY}│${NC}"
  echo -e "${GREY}│${NC}  ${WHITE}Options:${NC}"
  echo -e "${GREY}│${NC}    -h, --help    ${GREY}# Show this help message${NC}"
  echo -e "${GREY}│${NC}"
  echo -e "${GREY}│${NC}  ${WHITE}Examples:${NC}"
  echo -e "${GREY}│${NC}    aitk claude init"
  echo -e "${GREY}│${NC}    aitk claude init ../my-app"
  echo -e "${GREY}│${NC}    aitk claude sync ../my-app"
  echo -e "${GREY}│${NC}    aitk claude prompt"
  echo -e "${GREY}└${NC}"
  exit 0
}

validate_target() {
  local target="$1"
  local target_abs
  target_abs=$(cd "$target" && pwd)

  if [ "$target_abs" = "$PROJECT_ROOT" ]; then
    log_error "Cannot init claude workflow in toolkit root."
  fi
}

collect_seeds() {
  local target="$1"
  local -n _pending=$2
  local dest_dir="$target/.claude"

  while IFS= read -r file; do
    local name
    name=$(basename "$file")
    local dest="$dest_dir/$name"

    if [ -f "$dest" ]; then
      log_info "$name"
    else
      log_add "$name"
      _pending+=("$file")
    fi
  done < <(find "$CLAUDE_SEEDS_DIR" -maxdepth 1 -type f | sort)
}

apply_seeds() {
  local target="$1"
  shift
  local files=("$@")
  local dest_dir="$target/.claude"

  mkdir -p "$dest_dir"

  for file in "${files[@]}"; do
    local name
    name=$(basename "$file")
    cp "$file" "$dest_dir/$name"
    log_add ".claude/$name"
  done
}

collect_gitignore_entries() {
  local target="$1"
  local -n _gi_pending=$2
  local gitignore="$target/.gitignore"
  local in_section=0

  while IFS= read -r line; do
    if [[ "$line" =~ ^\[gitignore\] ]]; then
      in_section=1
      continue
    fi

    if [[ "$in_section" -eq 1 && "$line" =~ ^\[.+\] ]]; then
      break
    fi

    [ "$in_section" -eq 0 ] && continue
    [ -z "$line" ] && continue

    if [[ "$line" =~ ^\"(#[^\"]+)\"[[:space:]]*=[[:space:]]*\[(.*)$ ]]; then
      local rest="${BASH_REMATCH[2]}"

      if [[ "$rest" =~ \] ]]; then
        rest="${rest%%]*}"
        while IFS= read -r entry; do
          entry=$(echo "$entry" | tr -d '",' | xargs)
          [ -z "$entry" ] && continue

          local normalized="${entry%/}"
          if [ ! -f "$gitignore" ] || { ! grep -qxF "$entry" "$gitignore" && ! grep -qxF "$normalized" "$gitignore"; }; then
            log_add "$entry"
            _gi_pending+=("$entry")
          else
            log_info "$entry"
          fi
        done < <(echo "$rest" | tr ',' '\n')
      fi
    fi
  done <"$CLAUDE_MANIFEST"
}

cmd_init() {
  local target="${1:-.}"

  validate_target "$target"

  local pending=()
  local gi_pending=()

  log_step "Scanning .claude/"
  collect_seeds "$target" pending

  log_step "Scanning .gitignore"
  collect_gitignore_entries "$target" gi_pending

  local total=$((${#pending[@]} + ${#gi_pending[@]}))

  if [ "$total" -eq 0 ]; then
    echo -e "${GREY}└${NC}\n"
    echo -e "${GREEN}✓ Claude already initialized${NC}"
    return
  fi

  local summary=""
  [ "${#pending[@]}" -gt 0 ] && summary+="${#pending[@]} .claude"
  [ "${#gi_pending[@]}" -gt 0 ] && {
    [ -n "$summary" ] && summary+=", "
    summary+="${#gi_pending[@]} .gitignore"
  }

  select_option "Apply $total change(s) ($summary)?" "Apply all" "Cancel"

  if [ "$SELECTED_OPTION" = "Cancel" ]; then
    log_warn "Cancelled"
    echo -e "${GREY}└${NC}"
    exit 1
  fi

  log_step "Applying changes"

  if [ "${#pending[@]}" -gt 0 ]; then
    apply_seeds "$target" "${pending[@]}"
  fi

  if [ "${#gi_pending[@]}" -gt 0 ]; then
    merge_gitignore "claude" "$target"
  fi

  echo -e "${GREY}└${NC}\n"
  echo -e "${GREEN}✓ Claude ready${NC}"
}

cmd_sync() {
  local target="${1:-.}"

  validate_target "$target"

  local managed=("PLANNER.md" "REVIEWER.md" "IMPLEMENTER.md")
  local seeded=("ARCHITECTURE.md" "REQUIREMENTS.md" "TASKS.md" "DESIGN.md" "WIREFRAMES.md")
  local drifted=()

  log_step "Managed"
  for name in "${managed[@]}"; do
    local src="$CLAUDE_SEEDS_DIR/$name"
    local dest="$target/.claude/$name"

    if [ ! -f "$dest" ]; then
      log_warn "$name missing — run \`aitk claude init\`"
      continue
    fi

    if diff -q "$src" "$dest" >/dev/null 2>&1; then
      log_info "$name"
    else
      log_warn "$name"
      drifted+=("$name")
    fi
  done

  log_step "Seeded"
  for name in "${seeded[@]}"; do
    local dest="$target/.claude/$name"
    if [ -f "$dest" ]; then
      log_info "$name"
    else
      log_warn "$name missing — run \`aitk claude init\`"
    fi
  done

  if [ "${#drifted[@]}" -eq 0 ]; then
    echo -e "${GREY}└${NC}\n"
    echo -e "${GREEN}✓ Claude workflow up to date${NC}"
    return
  fi

  select_option "Apply ${#drifted[@]} update(s) (${#drifted[@]} managed)?" "Review diffs" "Apply all" "Cancel"

  case "$SELECTED_OPTION" in
  "Review diffs")
    for file in "${drifted[@]}"; do
      code --diff "$CLAUDE_SEEDS_DIR/$file" "$target/.claude/$file"
    done
    select_option "Apply ${#drifted[@]} update(s)?" "Apply all" "Cancel"
    [ "$SELECTED_OPTION" = "Cancel" ] && {
      log_warn "Cancelled"
      echo -e "${GREY}└${NC}"
      exit 1
    }
    ;;
  "Cancel")
    log_warn "Cancelled"
    echo -e "${GREY}└${NC}"
    exit 1
    ;;
  esac

  log_step "Applying changes"
  for file in "${drifted[@]}"; do
    cp "$CLAUDE_SEEDS_DIR/$file" "$target/.claude/$file"
    log_add ".claude/$file"
  done

  echo -e "${GREY}└${NC}\n"
  echo -e "${GREEN}✓ Claude workflow synced${NC}"
}

main() {
  if [ "$1" = "-h" ] || [ "$1" = "--help" ]; then
    show_help
  fi

  echo -e "${GREY}┌${NC}"
  echo -e "${GREY}│${NC} ${WHITE}aitk claude${NC}"

  local command="$1"

  if [ -z "$command" ]; then
    select_option "Claude command?" "init" "sync" "prompt"
    command="$SELECTED_OPTION"
  else
    shift
  fi

  case "$command" in
  init)
    cmd_init "$@"
    ;;
  sync)
    cmd_sync "$@"
    ;;
  prompt)
    exec "$PROJECT_ROOT/scripts/claude/prompt.sh" "$@"
    ;;
  *)
    log_error "Unknown command: $command. Use 'init', 'sync', or 'prompt'."
    ;;
  esac
}

main "$@"
