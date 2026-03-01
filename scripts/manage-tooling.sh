#!/bin/bash
set -e
set -o pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="${PROJECT_ROOT:-$(dirname "$SCRIPT_DIR")}"

source "$PROJECT_ROOT/scripts/lib/ui.sh"
source "$PROJECT_ROOT/scripts/lib/inject.sh"

declare -A SEEN_CONFIGS
declare -A SEEN_SEEDS
declare -A SEEN_GITIGNORE
declare -A SEEN_SCRIPTS
declare -A SEEN_DEPS
declare -A CONFIG_SOURCE_STACK

show_help() {
  echo -e "${GREY}┌${NC}"
  log_step "Tooling Usage"
  echo -e "${GREY}│${NC}  ${WHITE}Usage:${NC} gdev tooling [command] [stack] [target-path]"
  echo -e "${GREY}│${NC}"
  echo -e "${GREY}│${NC}  ${WHITE}Commands:${NC}"
  echo -e "${GREY}│${NC}    sync       ${GREY}# Sync configs, seeds, deps, and references (default)${NC}"
  echo -e "${GREY}│${NC}    ref        ${GREY}# Drop reference docs only, no config changes${NC}"
  echo -e "${GREY}│${NC}    scaffold   ${GREY}# Scaffold a new stack with stub manifest and reference${NC}"
  echo -e "${GREY}│${NC}"
  echo -e "${GREY}│${NC}  ${WHITE}Arguments:${NC}"
  echo -e "${GREY}│${NC}    stack         Name of the tooling stack (e.g., base, vite-react)"
  echo -e "${GREY}│${NC}    target-path   Target directory (default: current directory)"
  echo -e "${GREY}│${NC}"
  echo -e "${GREY}│${NC}  ${WHITE}Options:${NC}"
  echo -e "${GREY}│${NC}    -h, --help    ${GREY}# Show this help message${NC}"
  echo -e "${GREY}│${NC}"
  echo -e "${GREY}│${NC}  ${WHITE}Examples:${NC}"
  echo -e "${GREY}│${NC}    gdev tooling base ."
  echo -e "${GREY}│${NC}    gdev tooling ref vite-react ../my-app"
  echo -e "${GREY}│${NC}    gdev tooling scaffold"
  echo -e "${GREY}└${NC}"
  exit 0
}

select_stack() {
  local stacks=()
  if ls -d "$PROJECT_ROOT/tooling"/*/ >/dev/null 2>&1; then
    mapfile -t stacks < <(find "$PROJECT_ROOT/tooling" -mindepth 1 -maxdepth 1 -type d -exec basename {} \; | sort)
  fi

  if [ ${#stacks[@]} -eq 0 ]; then
    log_error "No tooling stacks found in $PROJECT_ROOT/tooling"
  fi

  select_option "Select tooling stack:" "${stacks[@]}"
  echo "$SELECTED_OPTION"
}

collect_stack_configs() {
  local stack="$1"
  local target="$2"
  local -n _new=$3
  local -n _drifted=$4
  local -n _matching=$5

  local manifest="$PROJECT_ROOT/tooling/$stack/manifest.toml"
  local extends
  extends=$(grep '^extends' "$manifest" 2>/dev/null | cut -d'"' -f2)

  local configs_dir="$PROJECT_ROOT/tooling/$stack/configs"
  if [ -d "$configs_dir" ]; then
    while IFS= read -r file; do
      local rel="${file#"$configs_dir"/}"
      [[ -v SEEN_CONFIGS["$rel"] ]] && continue
      SEEN_CONFIGS["$rel"]=1
      CONFIG_SOURCE_STACK["$rel"]="$stack"
      local dest="$target/$rel"

      if [ ! -f "$dest" ]; then
        _new+=("$rel")
      elif diff -q "$file" "$dest" >/dev/null 2>&1; then
        _matching+=("$rel")
      else
        _drifted+=("$rel")
      fi
    done < <(find "$configs_dir" -type f | sort)
  fi

  if [ -n "$extends" ]; then
    collect_stack_configs "$extends" "$target" "$3" "$4" "$5"
  fi
}

collect_stack_seeds() {
  local stack="$1"
  local target="$2"
  local -n _seeded=$3
  local -n _seed_missing=$4

  local manifest="$PROJECT_ROOT/tooling/$stack/manifest.toml"
  local extends
  extends=$(grep '^extends' "$manifest" 2>/dev/null | cut -d'"' -f2)

  local seeds_dir="$PROJECT_ROOT/tooling/$stack/seeds"
  if [ -d "$seeds_dir" ]; then
    while IFS= read -r file; do
      local rel="${file#"$seeds_dir"/}"
      [[ -v SEEN_SEEDS["$rel"] ]] && continue
      SEEN_SEEDS["$rel"]=1

      if [ -f "$target/$rel" ]; then
        _seeded+=("$rel")
      else
        _seed_missing+=("$rel")
      fi
    done < <(find "$seeds_dir" -type f | sort)
  fi

  if [ -n "$extends" ]; then
    collect_stack_seeds "$extends" "$target" "$3" "$4"
  fi
}

collect_stack_gitignore() {
  local stack="$1"
  local target="$2"
  local -n _gi_missing=$3

  local manifest="$PROJECT_ROOT/tooling/$stack/manifest.toml"
  [ ! -f "$manifest" ] && return

  local extends
  extends=$(grep '^extends' "$manifest" 2>/dev/null | cut -d'"' -f2)

  if [ -n "$extends" ]; then
    collect_stack_gitignore "$extends" "$target" "$3"
  fi

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
          [[ -v SEEN_GITIGNORE["$entry"] ]] && continue
          SEEN_GITIGNORE["$entry"]=1

          local normalized="${entry%/}"
          if [ ! -f "$gitignore" ] || { ! grep -qxF "$entry" "$gitignore" && ! grep -qxF "$normalized" "$gitignore"; }; then
            _gi_missing+=("$entry")
          fi
        done < <(echo "$rest" | tr ',' '\n')
      fi
    fi
  done <"$manifest"
}

collect_stack_scripts() {
  local stack="$1"
  local target="$2"
  local -n _drifted_scripts=$3
  local -n _missing_scripts=$4

  local manifest="$PROJECT_ROOT/tooling/$stack/manifest.toml"
  [ ! -f "$manifest" ] && return

  local extends
  extends=$(grep '^extends' "$manifest" 2>/dev/null | cut -d'"' -f2)

  if [ -n "$extends" ]; then
    collect_stack_scripts "$extends" "$target" "$3" "$4"
  fi

  local pkg="$target/package.json"
  [ ! -f "$pkg" ] && return

  local in_scripts=0
  while IFS= read -r line; do
    if [[ "$line" =~ ^\[scripts\] ]]; then
      in_scripts=1
      continue
    fi

    if [[ "$in_scripts" -eq 1 && "$line" =~ ^\[.+\] ]]; then
      break
    fi

    [ "$in_scripts" -eq 0 ] && continue
    [ -z "$line" ] && continue

    if [[ "$line" =~ ^\"([^\"]+)\"[[:space:]]*=[[:space:]]*\"(.*)\"[[:space:]]*$ ]]; then
      local key="${BASH_REMATCH[1]}"
      local val="${BASH_REMATCH[2]}"

      [[ -v SEEN_SCRIPTS["$key"] ]] && continue
      SEEN_SCRIPTS["$key"]=1

      local pkg_val
      pkg_val=$(node -e "
        const p = JSON.parse(require('fs').readFileSync('$pkg'));
        process.stdout.write(p.scripts && p.scripts['$key'] !== undefined ? p.scripts['$key'] : '__MISSING__');
      " 2>/dev/null)

      if [ "$pkg_val" = "__MISSING__" ]; then
        _missing_scripts+=("$key")
      elif [ "$pkg_val" != "$val" ]; then
        _drifted_scripts+=("$key")
      fi
    fi
  done <"$manifest"
}

collect_stack_deps() {
  local stack="$1"
  local target="$2"
  local -n _missing_deps=$3

  local manifest="$PROJECT_ROOT/tooling/$stack/manifest.toml"
  [ ! -f "$manifest" ] && return

  local extends
  extends=$(grep '^extends' "$manifest" 2>/dev/null | cut -d'"' -f2)

  if [ -n "$extends" ]; then
    collect_stack_deps "$extends" "$target" "$3"
  fi

  local pkg="$target/package.json"
  [ ! -f "$pkg" ] && return

  local in_deps=0
  while IFS= read -r line; do
    if [[ "$line" =~ ^\[dependencies\.dev\] ]]; then
      in_deps=1
      continue
    fi

    if [[ "$in_deps" -eq 1 && "$line" =~ ^\[.+\] ]]; then
      break
    fi

    [ "$in_deps" -eq 0 ] && continue
    [ -z "$line" ] && continue

    if [[ "$line" =~ ^packages ]]; then
      continue
    fi

    local pkg_name
    pkg_name=$(echo "$line" | tr -d '"[],' | xargs)
    [ -z "$pkg_name" ] && continue

    [[ -v SEEN_DEPS["$pkg_name"] ]] && continue
    SEEN_DEPS["$pkg_name"]=1

    local found
    found=$(node -e "
      const p = JSON.parse(require('fs').readFileSync('$pkg'));
      const all = Object.assign({}, p.dependencies, p.devDependencies);
      process.stdout.write(all['$pkg_name'] !== undefined ? 'yes' : 'no');
    " 2>/dev/null)

    if [ "$found" = "no" ]; then
      _missing_deps+=("$pkg_name")
    fi
  done <"$manifest"
}

scan_configs() {
  local stack="$1"
  local target="$2"

  log_step "Scanning Configs"

  collect_stack_configs "$stack" "$target" NEW_FILES DRIFTED_FILES MATCHING_FILES

  log_info "${#MATCHING_FILES[@]} files up to date"
  for f in "${DRIFTED_FILES[@]}"; do
    log_warn "$f (drifted)"
  done
  for f in "${NEW_FILES[@]}"; do
    log_add "$f"
  done

  CONFIG_CHANGES=$((${#NEW_FILES[@]} + ${#DRIFTED_FILES[@]}))

  log_step "Scanning Seeds"

  collect_stack_seeds "$stack" "$target" SEEDED_FILES SEED_MISSING_FILES

  log_info "${#SEEDED_FILES[@]} files up to date"
  for f in "${SEED_MISSING_FILES[@]}"; do
    log_add "$f"
  done

  SEED_CHANGES=${#SEED_MISSING_FILES[@]}

  log_step "Scanning Scripts"

  collect_stack_scripts "$stack" "$target" DRIFTED_SCRIPTS MISSING_SCRIPTS

  if [ "${#DRIFTED_SCRIPTS[@]}" -eq 0 ] && [ "${#MISSING_SCRIPTS[@]}" -eq 0 ]; then
    log_info "Up to date"
  fi
  for s in "${DRIFTED_SCRIPTS[@]}"; do
    log_warn "$s (drifted)"
  done
  for s in "${MISSING_SCRIPTS[@]}"; do
    log_add "$s"
  done

  SCRIPT_CHANGES=$((${#DRIFTED_SCRIPTS[@]} + ${#MISSING_SCRIPTS[@]}))

  log_step "Scanning Dependencies"

  collect_stack_deps "$stack" "$target" MISSING_DEPS

  if [ "${#MISSING_DEPS[@]}" -eq 0 ]; then
    log_info "Up to date"
  fi
  for d in "${MISSING_DEPS[@]}"; do
    log_warn "$d (missing)"
  done

  DEP_CHANGES=${#MISSING_DEPS[@]}

  log_step "Scanning Gitignore"

  collect_stack_gitignore "$stack" "$target" GITIGNORE_MISSING_FILES

  if [ "${#GITIGNORE_MISSING_FILES[@]}" -eq 0 ]; then
    log_info "Up to date"
  fi
  for f in "${GITIGNORE_MISSING_FILES[@]}"; do
    log_add "$f"
  done

  GITIGNORE_CHANGES=${#GITIGNORE_MISSING_FILES[@]}

  TOTAL_CHANGES=$((CONFIG_CHANGES + SEED_CHANGES + GITIGNORE_CHANGES + SCRIPT_CHANGES + DEP_CHANGES))
}

open_diffs() {
  local target="$1"

  for f in "${DRIFTED_FILES[@]}"; do
    local src_stack="${CONFIG_SOURCE_STACK[$f]}"
    code --diff "$PROJECT_ROOT/tooling/$src_stack/configs/$f" "$target/$f"
  done
}

cmd_ref() {
  local stack="$1"
  local target="${2:-.}"

  if [ -z "$stack" ]; then
    stack=$(select_stack)
  fi

  if [ ! -d "$PROJECT_ROOT/tooling/$stack" ]; then
    log_error "Stack not found: $stack"
  fi

  local target_abs
  target_abs=$(cd "$target" && pwd)
  if [ "$target_abs" = "$PROJECT_ROOT" ]; then
    log_error "Cannot sync tooling to ai-toolkit root. Files here are the source of truth."
  fi

  log_step "Syncing References: $stack"
  inject_tooling_reference "$stack" "$target"
}

cmd_scaffold() {
  local stack="$1"

  if [ -z "$stack" ]; then
    echo -e "${GREY}│${NC}" >&2
    echo -ne "${GREEN}◆${NC} Stack name? " >&2
    read -r stack
    echo -e "\033[1A\r\033[K${GREY}◇${NC} Stack name? ${WHITE}${stack}${NC}" >&2
  fi

  if [ -z "$stack" ]; then
    log_error "Stack name is required"
  fi

  local dest="$PROJECT_ROOT/tooling/$stack"

  if [ -d "$dest" ]; then
    log_error "Stack already exists: $stack"
  fi

  log_step "Scaffolding Stack: $stack"

  mkdir -p "$dest/configs"
  log_add "tooling/$stack/configs/"

  mkdir -p "$dest/seeds"
  log_add "tooling/$stack/seeds/"

  cat >"$dest/manifest.toml" <<EOF
[stack]
name = "$stack"
extends = ""
runtime = ""
scaffold = ""

[sync]
source = "configs"

[dependencies.dev]
packages = []

[scripts]

[gitignore]
EOF
  log_add "tooling/$stack/manifest.toml"

  cat >"$dest/reference.md" <<EOF
# TOOLING $(echo "$stack" | tr '[:lower:]' '[:upper:]' | tr '-' ' ') REFERENCE

## Overview

[One or two sentences: what this stack provides and its purpose.]

EOF
  log_add "tooling/$stack/reference.md"
}

cmd_sync() {
  local stack="$1"
  local target="${2:-.}"

  if [ -z "$stack" ]; then
    stack=$(select_stack)
  fi

  if [ ! -d "$PROJECT_ROOT/tooling/$stack" ]; then
    log_error "Stack not found: $stack"
  fi

  local target_abs
  target_abs=$(cd "$target" && pwd)
  if [ "$target_abs" = "$PROJECT_ROOT" ]; then
    log_error "Cannot sync tooling to ai-toolkit root. Files here are the source of truth."
  fi

  NEW_FILES=()
  DRIFTED_FILES=()
  MATCHING_FILES=()
  SEEDED_FILES=()
  SEED_MISSING_FILES=()
  GITIGNORE_MISSING_FILES=()
  DRIFTED_SCRIPTS=()
  MISSING_SCRIPTS=()
  MISSING_DEPS=()
  SEEN_CONFIGS=()
  SEEN_SEEDS=()
  SEEN_GITIGNORE=()
  SEEN_SCRIPTS=()
  SEEN_DEPS=()
  CONFIG_SOURCE_STACK=()
  CONFIG_CHANGES=0
  SEED_CHANGES=0
  GITIGNORE_CHANGES=0
  SCRIPT_CHANGES=0
  DEP_CHANGES=0
  TOTAL_CHANGES=0

  scan_configs "$stack" "$target"

  if [ "$TOTAL_CHANGES" -eq 0 ]; then
    echo -e "${GREY}└${NC}\n" >&2
    echo -e "${GREEN}✓ Everything up to date${NC}" >&2
    exit 0
  fi

  local summary=""
  if [ "$CONFIG_CHANGES" -gt 0 ]; then
    summary+="${CONFIG_CHANGES} configs"
  fi
  if [ "$SEED_CHANGES" -gt 0 ]; then
    [ -n "$summary" ] && summary+=", "
    summary+="${SEED_CHANGES} seeds"
  fi
  if [ "$SCRIPT_CHANGES" -gt 0 ]; then
    [ -n "$summary" ] && summary+=", "
    summary+="${SCRIPT_CHANGES} scripts"
  fi
  if [ "$DEP_CHANGES" -gt 0 ]; then
    [ -n "$summary" ] && summary+=", "
    summary+="${DEP_CHANGES} deps"
  fi
  if [ "${#GITIGNORE_MISSING_FILES[@]}" -gt 0 ]; then
    [ -n "$summary" ] && summary+=", "
    summary+="${#GITIGNORE_MISSING_FILES[@]} gitignore"
  fi

  local has_diffs=false
  [ "${#DRIFTED_FILES[@]}" -gt 0 ] && has_diffs=true

  local prompt_opts=()
  if [ "$has_diffs" = true ]; then
    prompt_opts=("Apply all" "Review diffs" "Cancel")
  else
    prompt_opts=("Apply all" "Cancel")
  fi

  select_option "Apply $TOTAL_CHANGES changes ($summary)?" "${prompt_opts[@]}"

  case "$SELECTED_OPTION" in
  "Review diffs")
    open_diffs "$target"
    select_option "Apply $TOTAL_CHANGES changes ($summary)?" "Apply all" "Cancel"
    [ "$SELECTED_OPTION" == "Cancel" ] && {
      log_warn "Sync cancelled"
      echo -e "${GREY}└${NC}" >&2
      exit 0
    }
    ;;
  "Cancel")
    log_warn "Sync cancelled"
    echo -e "${GREY}└${NC}" >&2
    exit 0
    ;;
  esac

  if [ "$CONFIG_CHANGES" -gt 0 ]; then
    inject_tooling_configs "$stack" "$target"
  fi

  if [ "$SEED_CHANGES" -gt 0 ]; then
    inject_tooling_seeds "$stack" "$target"
  fi

  inject_tooling_manifest "$stack" "$target"
}

main() {
  if [ "$1" = "-h" ] || [ "$1" = "--help" ]; then
    show_help
  fi

  echo -e "${GREY}┌${NC}" >&2

  local command="$1"

  if [ -z "$command" ]; then
    select_option "Tooling command?" "sync" "ref" "scaffold"
    command="$SELECTED_OPTION"
  fi

  case "$command" in
  ref)
    shift 2>/dev/null || true
    cmd_ref "$@"
    echo -e "${GREY}└${NC}\n" >&2
    echo -e "${GREEN}✓ References synced${NC}" >&2
    ;;
  scaffold)
    shift 2>/dev/null || true
    cmd_scaffold "$@"
    echo -e "${GREY}└${NC}\n" >&2
    echo -e "${GREEN}✓ Stack scaffolded${NC}" >&2
    ;;
  sync | "")
    shift 2>/dev/null || true
    cmd_sync "$@"
    echo -e "${GREY}└${NC}\n" >&2
    echo -e "${GREEN}✓ Tooling sync complete${NC}" >&2
    ;;
  *)
    cmd_sync "$@"
    echo -e "${GREY}└${NC}\n" >&2
    echo -e "${GREEN}✓ Tooling sync complete${NC}" >&2
    ;;
  esac
}

main "$@"
