#!/bin/bash
set -e
set -o pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="${PROJECT_ROOT:-$(dirname "$SCRIPT_DIR")}"

source "$PROJECT_ROOT/scripts/lib/ui.sh"
source "$PROJECT_ROOT/scripts/lib/inject.sh"

CLAUDE_SEEDS_DIR="$PROJECT_ROOT/tooling/claude/seeds/.claude"
CLAUDE_ROLES_DIR="$PROJECT_ROOT/tooling/claude/roles"
CLAUDE_MANIFEST="$PROJECT_ROOT/tooling/claude/manifest.toml"

show_help() {
  echo -e "${GREY}┌${NC}"
  echo -e "${GREY}├${NC} ${WHITE}Usage:${NC} aitk claude [command] [options] [target-path]"
  echo -e "${GREY}│${NC}"
  echo -e "${GREY}│${NC}  ${WHITE}Commands:${NC}"
  echo -e "${GREY}│${NC}    init           ${GREY}# Seed .claude/ workflow docs into a project${NC}"
  echo -e "${GREY}│${NC}    roles [list]   ${GREY}# Install role prompts, or list sources with --json${NC}"
  echo -e "${GREY}│${NC}    seeds list     ${GREY}# List seed doc sources with --json${NC}"
  echo -e "${GREY}│${NC}    sync           ${GREY}# Diff managed files against source and apply updates${NC}"
  echo -e "${GREY}│${NC}    prompt         ${GREY}# Generate master prompt from installed cursor rules (requires roles)${NC}"
  echo -e "${GREY}│${NC}    gov            ${GREY}# Build governance rules and write to .claude/GOV.md${NC}"
  echo -e "${GREY}│${NC}"
  echo -e "${GREY}│${NC}  ${WHITE}Arguments:${NC}"
  echo -e "${GREY}│${NC}    target-path   Target directory (default: current directory)"
  echo -e "${GREY}│${NC}"
  echo -e "${GREY}│${NC}  ${WHITE}Examples:${NC}"
  echo -e "${GREY}│${NC}    aitk claude init"
  echo -e "${GREY}│${NC}    aitk claude init --roles"
  echo -e "${GREY}│${NC}    aitk claude roles ../my-app"
  echo -e "${GREY}│${NC}    aitk claude roles list --json"
  echo -e "${GREY}│${NC}    aitk claude seeds list --json"
  echo -e "${GREY}│${NC}    aitk claude sync ../my-app"
  echo -e "${GREY}│${NC}    aitk claude prompt"
  echo -e "${GREY}│${NC}    aitk claude gov"
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

collect_roles() {
  local target="$1"
  local -n _role_pending=$2
  local dest_dir="$target/.claude"

  while IFS= read -r file; do
    local name
    name=$(basename "$file")
    local dest="$dest_dir/$name"

    if [ -f "$dest" ]; then
      log_info "$name"
    else
      log_add "$name"
      _role_pending+=("$file")
    fi
  done < <(find "$CLAUDE_ROLES_DIR" -maxdepth 1 -type f | sort)
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
  local include_roles=0
  local target="."

  while [[ $# -gt 0 ]]; do
    case "$1" in
    --roles)
      include_roles=1
      shift
      ;;
    *)
      target="$1"
      shift
      ;;
    esac
  done

  validate_target "$target"

  local pending=()
  local role_pending=()
  local gi_pending=()

  log_step "Scanning .claude/"
  collect_seeds "$target" pending

  if [ "$include_roles" -eq 1 ]; then
    log_step "Scanning roles"
    collect_roles "$target" role_pending
  fi

  log_step "Scanning .gitignore"
  collect_gitignore_entries "$target" gi_pending

  local total=$((${#pending[@]} + ${#role_pending[@]} + ${#gi_pending[@]}))

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
  [ "${#role_pending[@]}" -gt 0 ] && {
    [ -n "$summary" ] && summary+=", "
    summary+="${#role_pending[@]} roles"
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

  if [ "${#role_pending[@]}" -gt 0 ]; then
    apply_seeds "$target" "${role_pending[@]}"
  fi

  if [ "${#gi_pending[@]}" -gt 0 ]; then
    merge_gitignore "claude" "$target"
  fi

  trap - EXIT
  echo -e "${GREY}└${NC}\n"
  echo -e "${GREEN}✓ Claude ready${NC}"
}

cmd_roles() {
  if [ "${1:-}" = "list" ]; then
    shift
    exec "$PROJECT_ROOT/scripts/claude/roles-list.sh" "$@"
  fi

  local target="${1:-.}"

  validate_target "$target"

  local role_pending=()

  log_step "Scanning roles"
  collect_roles "$target" role_pending

  if [ "${#role_pending[@]}" -eq 0 ]; then
    trap - EXIT
    echo -e "${GREY}└${NC}\n"
    echo -e "${GREEN}✓ Roles already installed${NC}"
    return
  fi

  select_option "Install ${#role_pending[@]} role(s)?" "Apply all" "Cancel"

  if [ "$SELECTED_OPTION" = "Cancel" ]; then
    log_warn "Cancelled"
    exit 1
  fi

  log_step "Applying changes"
  apply_seeds "$target" "${role_pending[@]}"

  trap - EXIT
  echo -e "${GREY}└${NC}\n"
  echo -e "${GREEN}✓ Roles installed${NC}"
}

cmd_seeds() {
  case "${1:-}" in
  list)
    shift
    exec "$PROJECT_ROOT/scripts/claude/seeds-list.sh" "$@"
    ;;
  "")
    log_error "Missing subcommand. Use 'list'."
    ;;
  *)
    log_error "Unknown subcommand: $1. Use 'list'."
    ;;
  esac
}

cmd_sync() {
  local target="${1:-.}"

  validate_target "$target"

  local roles=("PLANNER.md" "REVIEWER.md" "IMPLEMENTER.md")
  local seeded=("ARCHITECTURE.md" "REQUIREMENTS.md" "TASKS.md" "DESIGN.md" "WIREFRAMES.md")
  local drifted=()
  local has_roles=0

  for name in "${roles[@]}"; do
    if [ -f "$target/.claude/$name" ]; then
      has_roles=1
      break
    fi
  done

  if [ "$has_roles" -eq 1 ]; then
    log_step "Roles"
    for name in "${roles[@]}"; do
      local src="$CLAUDE_ROLES_DIR/$name"
      local dest="$target/.claude/$name"

      if [ ! -f "$dest" ]; then
        log_info "$name (not installed)"
        continue
      fi

      if diff -q "$src" "$dest" >/dev/null 2>&1; then
        log_info "$name"
      else
        log_warn "$name"
        drifted+=("$name")
      fi
    done
  fi

  log_step "Seeded"
  for name in "${seeded[@]}"; do
    local dest="$target/.claude/$name"
    if [ -f "$dest" ]; then
      log_info "$name"
    else
      log_warn "$name missing. Run \`aitk claude init\`"
    fi
  done

  if [ "${#drifted[@]}" -eq 0 ]; then
    trap - EXIT
    echo -e "${GREY}└${NC}\n"
    echo -e "${GREEN}✓ Claude workflow up to date${NC}"
    return
  fi

  if [ "${AITK_NON_INTERACTIVE:-}" = "1" ]; then
    log_info "Applying ${#drifted[@]} update(s) (non-interactive)"
  else
    select_option "Apply ${#drifted[@]} update(s) (${#drifted[@]} roles)?" "Review diffs" "Apply all" "Cancel"

    case "$SELECTED_OPTION" in
    "Review diffs")
      for file in "${drifted[@]}"; do
        code --diff "$CLAUDE_ROLES_DIR/$file" "$target/.claude/$file"
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
  fi

  log_step "Applying changes"
  for file in "${drifted[@]}"; do
    cp "$CLAUDE_ROLES_DIR/$file" "$target/.claude/$file"
    log_add ".claude/$file"
  done

  trap - EXIT
  echo -e "${GREY}└${NC}\n"
  echo -e "${GREEN}✓ Claude workflow synced${NC}"
}

cmd_setup() {
  local user_dir="$PROJECT_ROOT/tooling/claude/user"
  local dest_dir="$HOME/.claude"
  local script_src="$user_dir/statusline-command.sh"
  local script_dest="$dest_dir/statusline-command.sh"
  local settings_dest="$dest_dir/settings.json"
  local status_line_cmd="bash $script_dest"

  mkdir -p "$dest_dir"

  log_step "Statusline script"
  if [ -f "$script_dest" ] && diff -q "$script_src" "$script_dest" >/dev/null 2>&1; then
    log_info "statusline-command.sh"
  else
    cp "$script_src" "$script_dest"
    chmod +x "$script_dest"
    log_add "statusline-command.sh"
  fi

  log_step "Settings"
  local current_cmd=""
  [ -f "$settings_dest" ] && current_cmd=$(jq -r '.statusLine.command // empty' "$settings_dest" 2>/dev/null)

  if [ "$current_cmd" = "$status_line_cmd" ]; then
    log_info "statusLine"
  else
    local tmp
    tmp=$(mktemp)
    if [ -f "$settings_dest" ]; then
      jq --arg cmd "$status_line_cmd" '.statusLine = {"type": "command", "command": $cmd}' "$settings_dest" >"$tmp"
    else
      jq -n --arg cmd "$status_line_cmd" '.statusLine = {"type": "command", "command": $cmd}' >"$tmp"
    fi
    mv "$tmp" "$settings_dest"
    log_add "statusLine → ~/.claude/settings.json"
  fi

  trap - EXIT
  echo -e "${GREY}└${NC}\n"
  echo -e "${GREEN}✓ Claude user config ready${NC}"
}

cmd_gov() {
  local target="${1:-.}"

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
    echo "> Generated by \`aitk claude gov\`. Do not hand-edit. Regenerate when rules change."
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

  open_timeline "aitk claude"
  trap close_timeline EXIT

  local command="$1"

  if [ -z "$command" ]; then
    select_option "Claude command?" "init" "sync" "prompt" "gov" "seeds" "roles"
    command="$SELECTED_OPTION"
  else
    shift
  fi

  case "$command" in
  init)
    cmd_init "$@"
    ;;
  roles)
    cmd_roles "$@"
    ;;
  seeds)
    cmd_seeds "$@"
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
  setup)
    cmd_setup "$@"
    ;;
  *)
    log_error "Unknown command: $command. Use 'init', 'roles', 'seeds', 'sync', 'prompt', 'gov', or 'setup'."
    ;;
  esac
}

main "$@"
