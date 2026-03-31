#!/bin/bash
set -e
set -o pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="${PROJECT_ROOT:-$(dirname "$SCRIPT_DIR")}"

source "$PROJECT_ROOT/scripts/lib/ui.sh"
source "$PROJECT_ROOT/scripts/lib/inject.sh"

CLAUDE_SEEDS_DIR="$PROJECT_ROOT/tooling/claude/seeds/.claude"
CLAUDE_CONFIGS_DIR="$PROJECT_ROOT/tooling/claude/configs/.claude"
CLAUDE_MANIFEST="$PROJECT_ROOT/tooling/claude/manifest.toml"

show_help() {
  echo -e "${GREY}┌${NC}"
  echo -e "${GREY}├${NC} ${WHITE}Usage:${NC} aitk claude [command] [target-path]"
  echo -e "${GREY}│${NC}"
  echo -e "${GREY}│${NC}  ${WHITE}Commands:${NC}"
  echo -e "${GREY}│${NC}    init      ${GREY}# Seed .claude/ workflow docs into a project${NC}"
  echo -e "${GREY}│${NC}    sync      ${GREY}# Diff managed role prompts against seed and apply${NC}"
  echo -e "${GREY}│${NC}    prompt    ${GREY}# Generate master prompt from installed cursor rules${NC}"
  echo -e "${GREY}│${NC}    gov       ${GREY}# Build governance rules and write to .claude/GOV.md${NC}"
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
  echo -e "${GREY}│${NC}    aitk claude gov"
  echo -e "${GREY}│${NC}    aitk claude gov ../my-app"
  echo -e "${GREY}└${NC}"
  exit 0
}

validate_target() {
  guard_root "$1"
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
  done < <(find "$CLAUDE_CONFIGS_DIR" -maxdepth 1 -type f | sort)

  local claude_md="$PROJECT_ROOT/tooling/claude/seeds/CLAUDE.md"
  if [ -f "$claude_md" ]; then
    local dest="$target/CLAUDE.md"
    if [ -f "$dest" ]; then
      log_info "CLAUDE.md"
    else
      log_add "CLAUDE.md"
      _pending+=("$claude_md")
    fi
  fi
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
    if [[ "$file" == */seeds/CLAUDE.md ]]; then
      cp "$file" "$target/$name"
      log_add "$name"
    else
      cp "$file" "$dest_dir/$name"
      log_add ".claude/$name"
    fi
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
    trap - EXIT
    echo -e "${GREY}└${NC}\n"
    echo -e "${GREEN}✓ Claude already initialized${NC}"
    return
  fi

  local summary=""
  local claude_md_count=0
  for f in "${pending[@]}"; do [[ "$f" == */seeds/CLAUDE.md ]] && claude_md_count=1; done
  local dot_claude_count=$((${#pending[@]} - claude_md_count))
  [ "$dot_claude_count" -gt 0 ] && summary+="${dot_claude_count} .claude"
  [ "$claude_md_count" -gt 0 ] && {
    [ -n "$summary" ] && summary+=", "
    summary+="1 CLAUDE.md"
  }
  [ "${#gi_pending[@]}" -gt 0 ] && {
    [ -n "$summary" ] && summary+=", "
    summary+="${#gi_pending[@]} .gitignore"
  }

  select_option "Apply $total change(s) ($summary)?" "Apply all" "Cancel"

  if [ "$SELECTED_OPTION" = "Cancel" ]; then
    log_warn "Cancelled"
    exit 1
  fi

  log_step "Applying changes"

  if [ "${#pending[@]}" -gt 0 ]; then
    apply_seeds "$target" "${pending[@]}"
  fi

  if [ "${#gi_pending[@]}" -gt 0 ]; then
    merge_gitignore "claude" "$target"
  fi

  trap - EXIT
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
    local src="$CLAUDE_CONFIGS_DIR/$name"
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
    trap - EXIT
    echo -e "${GREY}└${NC}\n"
    echo -e "${GREEN}✓ Claude workflow up to date${NC}"
    return
  fi

  select_option "Apply ${#drifted[@]} update(s) (${#drifted[@]} managed)?" "Review diffs" "Apply all" "Cancel"

  case "$SELECTED_OPTION" in
  "Review diffs")
    for file in "${drifted[@]}"; do
      code --diff "$CLAUDE_CONFIGS_DIR/$file" "$target/.claude/$file"
    done
    select_option "Apply ${#drifted[@]} update(s)?" "Apply all" "Cancel"
    [ "$SELECTED_OPTION" = "Cancel" ] && {
      log_warn "Cancelled"
      exit 1
    }
    ;;
  "Cancel")
    log_warn "Cancelled"
    exit 1
    ;;
  esac

  log_step "Applying changes"
  for file in "${drifted[@]}"; do
    cp "$CLAUDE_CONFIGS_DIR/$file" "$target/.claude/$file"
    log_add ".claude/$file"
  done

  trap - EXIT
  echo -e "${GREY}└${NC}\n"
  echo -e "${GREEN}✓ Claude workflow synced${NC}"
}

cmd_gov() {
  local target="${1:-.}"

  validate_target "$target"

  local rules_dir="$target/.cursor/rules"
  local output_file="$target/.claude/GOV.md"

  if [ ! -d "$rules_dir" ] || ! ls "$rules_dir"/*.mdc >/dev/null 2>&1; then
    log_error "No rules found at $rules_dir. Run \`aitk gov install\` first."
  fi

  local count
  count=$(find "$rules_dir" -type f -name "*.mdc" | wc -l | tr -d ' ')

  log_step "Reading .cursor/rules ($count found)"

  while IFS= read -r file; do
    log_info "$(basename "$file")"
  done < <(find "$rules_dir" -type f -name "*.mdc" | sort)

  if [ "${AITK_NON_INTERACTIVE:-}" = "1" ]; then
    log_info "Rebuilding GOV.md (non-interactive)"
  else
    select_option "Build $count rules to .claude/GOV.md?" "Yes" "No"
    if [ "$SELECTED_OPTION" = "No" ]; then
      log_warn "Cancelled"
      exit 0
    fi
  fi

  log_step "Building governance payload"

  source "$PROJECT_ROOT/scripts/lib/gov.sh"
  local payload_file
  payload_file=$(build_rules_payload "$rules_dir")

  mkdir -p "$target/.claude"
  local tmp_file
  tmp_file=$(mktemp)
  {
    echo "# Governance"
    echo ""
    cat "$payload_file"
  } >"$tmp_file"
  rm -f "$payload_file"

  if [ -f "$output_file" ] && diff -q "$tmp_file" "$output_file" >/dev/null 2>&1; then
    rm -f "$tmp_file"
    log_info ".claude/GOV.md"
  else
    mv "$tmp_file" "$output_file"
    log_add ".claude/GOV.md"
  fi

  trap - EXIT
  echo -e "${GREY}└${NC}\n"
  echo -e "${GREEN}✓ GOV.md ready ($count rules → .claude/GOV.md)${NC}"
}

main() {
  if [ "$1" = "-h" ] || [ "$1" = "--help" ]; then
    show_help
  fi

  echo -e "${GREY}┌${NC}"
  echo -e "${GREY}│${NC} ${WHITE}aitk claude${NC}"
  trap close_timeline EXIT

  local command="$1"

  if [ -z "$command" ]; then
    select_option "Claude command?" "init" "sync" "prompt" "gov"
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
  gov)
    cmd_gov "$@"
    ;;
  *)
    log_error "Unknown command: $command. Use 'init', 'sync', 'prompt', or 'gov'."
    ;;
  esac
}

main "$@"
