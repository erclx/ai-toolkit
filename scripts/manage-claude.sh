#!/usr/bin/env bash
set -e
set -o pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="${PROJECT_ROOT:-$(dirname "$SCRIPT_DIR")}"

source "$PROJECT_ROOT/scripts/lib/ui.sh"

# Gitignore merging and pruning live in the tooling CLI. Both wrappers shell
# into it once per call, matching the bash functions they replaced.
merge_gitignore() {
  bun "$PROJECT_ROOT/src/cli.ts" tooling inject "$1" "$2" --gitignore
}

prune_gitignore() {
  local -n _pruned=$3
  _pruned=$(bun "$PROJECT_ROOT/src/cli.ts" tooling prune-gitignore "$1" "$2")
}

CLAUDE_SEEDS_DIR="$PROJECT_ROOT/tooling/claude/seeds/.claude"
CLAUDE_MANIFEST="$PROJECT_ROOT/tooling/claude/manifest.toml"

show_help() {
  echo -e "${GREY}┌${NC}"
  echo -e "${GREY}├${NC} ${WHITE}Usage:${NC} aitk claude [command] [options] [target-path]"
  echo -e "${GREY}│${NC}"
  echo -e "${GREY}│${NC}  ${WHITE}Commands:${NC}"
  echo -e "${GREY}│${NC}    init           ${GREY}# Seed .claude/ workflow docs into a project${NC}"
  echo -e "${GREY}│${NC}    seeds list     ${GREY}# List seed doc sources with --json${NC}"
  echo -e "${GREY}│${NC}    sync           ${GREY}# Reconcile .gitignore against the claude manifest${NC}"
  echo -e "${GREY}│${NC}    setup          ${GREY}# One-shot user-level config (statusline, attribution, permissions)${NC}"
  echo -e "${GREY}│${NC}"
  echo -e "${GREY}│${NC}  ${WHITE}Arguments:${NC}"
  echo -e "${GREY}│${NC}    target-path   Target directory (default: current directory)"
  echo -e "${GREY}│${NC}"
  echo -e "${GREY}│${NC}  ${WHITE}Examples:${NC}"
  echo -e "${GREY}│${NC}    aitk claude init"
  echo -e "${GREY}│${NC}    aitk claude seeds list --json"
  echo -e "${GREY}│${NC}    aitk claude sync ../my-app"
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
    local rel="hooks/$name"
    local dest="$dest_dir/$rel"

    if [ -f "$dest" ]; then
      log_info "$rel"
    else
      log_add "$rel"
      _pending+=("$file")
    fi
  done < <(find "$CLAUDE_SEEDS_DIR/hooks" -maxdepth 1 -type f 2>/dev/null | sort)

  while IFS= read -r file; do
    local name
    name=$(basename "$file")
    local rel="context/$name"
    local dest="$dest_dir/$rel"

    if [ -f "$dest" ]; then
      log_info "$rel"
    else
      log_add "$rel"
      _pending+=("$file")
    fi
  done < <(find "$CLAUDE_SEEDS_DIR/context" -maxdepth 1 -type f 2>/dev/null | sort)

  while IFS= read -r file; do
    local name
    name=$(basename "$file")
    local rel="wireframes/$name"
    local dest="$dest_dir/$rel"

    if [ -f "$dest" ]; then
      log_info "$rel"
    else
      log_add "$rel"
      _pending+=("$file")
    fi
  done < <(find "$CLAUDE_SEEDS_DIR/wireframes" -maxdepth 1 -type f 2>/dev/null | sort)

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
    elif [[ "$file" == */seeds/.claude/hooks/* ]]; then
      mkdir -p "$dest_dir/hooks"
      cp "$file" "$dest_dir/hooks/$name"
      chmod +x "$dest_dir/hooks/$name"
      log_add ".claude/hooks/$name"
    elif [[ "$file" == */seeds/.claude/context/* ]]; then
      mkdir -p "$dest_dir/context"
      cp "$file" "$dest_dir/context/$name"
      log_add ".claude/context/$name"
    elif [[ "$file" == */seeds/.claude/wireframes/* ]]; then
      mkdir -p "$dest_dir/wireframes"
      cp "$file" "$dest_dir/wireframes/$name"
      log_add ".claude/wireframes/$name"
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

  local seeded=("ARCHITECTURE.md" "REQUIREMENTS.md" "TASKS.md" "DESIGN.md")
  local seeded_dirs=("wireframes")
  local gi_pending=()

  log_step "Seeded"
  for name in "${seeded[@]}"; do
    local dest="$target/.claude/$name"
    if [ -f "$dest" ]; then
      log_info "$name"
    else
      log_warn "$name missing. Run \`aitk claude init\`"
    fi
  done
  for name in "${seeded_dirs[@]}"; do
    local dest="$target/.claude/$name"
    if [ -d "$dest" ]; then
      log_info "$name/"
    else
      log_warn "$name/ missing. Run \`aitk claude init\`"
    fi
  done

  log_step "Scanning .gitignore"
  local gi_pruned=0
  prune_gitignore "claude" "$target" gi_pruned
  collect_gitignore_entries "$target" gi_pending

  local total="${#gi_pending[@]}"

  if [ "$total" -eq 0 ] && [ "$gi_pruned" -eq 0 ]; then
    trap - EXIT
    echo -e "${GREY}└${NC}\n"
    echo -e "${GREEN}✓ Claude workflow up to date${NC}"
    return
  fi

  if [ "$total" -gt 0 ]; then
    if [ "${AITK_NON_INTERACTIVE:-}" = "1" ]; then
      log_info "Applying $total update(s) (non-interactive)"
    else
      select_option "Apply $total update(s) ($total .gitignore)?" "Apply all" "Cancel"

      if [ "$SELECTED_OPTION" = "Cancel" ]; then
        log_warn "Cancelled"
        exit 1
      fi
    fi

    log_step "Applying changes"
    merge_gitignore "claude" "$target"
  fi

  trap - EXIT
  echo -e "${GREY}└${NC}\n"
  echo -e "${GREEN}✓ Claude workflow synced${NC}"
}

merge_user_setting() {
  local settings_dest="$1"
  local jq_filter="$2"
  shift 2

  local tmp
  tmp=$(mktemp)
  if [ -f "$settings_dest" ]; then
    jq "$@" "$jq_filter" "$settings_dest" >"$tmp"
  else
    jq -n "$@" "$jq_filter" >"$tmp"
  fi
  mv "$tmp" "$settings_dest"
}

cmd_setup() {
  local user_dir="$PROJECT_ROOT/tooling/claude/user"
  local dest_dir="$HOME/.claude"
  local script_src="$user_dir/statusline-command.sh"
  local script_dest="$dest_dir/statusline-command.sh"
  local settings_dest="$dest_dir/settings.json"
  local settings_template="$user_dir/settings.template.json"
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
    merge_user_setting "$settings_dest" \
      '.statusLine = {"type": "command", "command": $cmd}' \
      --arg cmd "$status_line_cmd"
    log_add "statusLine"
  fi

  local expected_attr current_attr
  expected_attr=$(jq -c '.attribution' "$settings_template")
  current_attr=""
  [ -f "$settings_dest" ] && current_attr=$(jq -c '.attribution // empty' "$settings_dest" 2>/dev/null)

  if [ "$current_attr" = "$expected_attr" ]; then
    log_info "attribution"
  else
    merge_user_setting "$settings_dest" \
      '.attribution = $attr' \
      --argjson attr "$expected_attr"
    log_add "attribution"
  fi

  local expected_allow current_allow merged_allow
  expected_allow=$(jq -c '.permissions.allow' "$settings_template")
  current_allow="[]"
  [ -f "$settings_dest" ] && current_allow=$(jq -c '.permissions.allow // []' "$settings_dest" 2>/dev/null)
  merged_allow=$(jq -cn --argjson cur "$current_allow" --argjson new "$expected_allow" '($cur + $new) | unique')

  if [ "$current_allow" = "$merged_allow" ]; then
    log_info "permissions.allow"
  else
    merge_user_setting "$settings_dest" \
      '.permissions.allow = $allow' \
      --argjson allow "$merged_allow"
    log_add "permissions.allow"
  fi

  local expected_deny current_deny merged_deny
  expected_deny=$(jq -c '.permissions.deny' "$settings_template")
  current_deny="[]"
  [ -f "$settings_dest" ] && current_deny=$(jq -c '.permissions.deny // []' "$settings_dest" 2>/dev/null)
  merged_deny=$(jq -cn --argjson cur "$current_deny" --argjson new "$expected_deny" '($cur + $new) | unique')

  if [ "$current_deny" = "$merged_deny" ]; then
    log_info "permissions.deny"
  else
    merge_user_setting "$settings_dest" \
      '.permissions.deny = $deny' \
      --argjson deny "$merged_deny"
    log_add "permissions.deny"
  fi

  trap - EXIT
  echo -e "${GREY}└${NC}\n"
  echo -e "${GREEN}✓ Claude user config ready${NC}"
}

main() {
  if [ "$1" = "-h" ] || [ "$1" = "--help" ]; then
    show_help
  fi

  open_timeline "aitk claude"
  trap close_timeline EXIT

  local command="$1"

  if [ -z "$command" ]; then
    select_option "Claude command?" "init" "sync" "setup"
    command="$SELECTED_OPTION"
  else
    shift
  fi

  case "$command" in
  init)
    cmd_init "$@"
    ;;
  seeds)
    cmd_seeds "$@"
    ;;
  sync)
    cmd_sync "$@"
    ;;
  setup)
    cmd_setup "$@"
    ;;
  *)
    log_error "Unknown command: $command. Use 'init', 'seeds', 'sync', or 'setup'."
    ;;
  esac
}

main "$@"
