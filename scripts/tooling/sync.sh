#!/bin/bash
set -e
set -o pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="${PROJECT_ROOT:-$(dirname "$(dirname "$SCRIPT_DIR")")}"

source "$PROJECT_ROOT/scripts/lib/ui.sh"
source "$PROJECT_ROOT/scripts/lib/inject.sh"
source "$PROJECT_ROOT/scripts/lib/tooling.sh"
trap close_timeline EXIT

declare -A SEEN_CONFIGS
declare -A SEEN_SEEDS
declare -A SEEN_GITIGNORE
declare -A SEEN_SCRIPTS
declare -A SEEN_DEPS
declare -A CONFIG_SOURCE_STACK

show_help() {
  echo -e "${GREY}┌${NC}"
  log_step "Tooling sync usage"
  echo -e "${GREY}│${NC}  ${WHITE}Usage:${NC} aitk tooling sync [stack] [target-path] [--no-ref]"
  echo -e "${GREY}│${NC}"
  echo -e "${GREY}│${NC}  Syncs configs, seeds, deps, scripts, gitignore entries, and reference docs."
  echo -e "${GREY}│${NC}  Reference docs drop to target/tooling/<stack>.md across the extends chain."
  echo -e "${GREY}│${NC}"
  echo -e "${GREY}│${NC}  ${WHITE}Arguments:${NC}"
  echo -e "${GREY}│${NC}    stack         Name of the tooling stack (e.g., base, vite-react)"
  echo -e "${GREY}│${NC}    target-path   Target directory (default: current directory)"
  echo -e "${GREY}│${NC}"
  echo -e "${GREY}│${NC}  ${WHITE}Options:${NC}"
  echo -e "${GREY}│${NC}    --no-ref      ${GREY}# Skip dropping reference docs${NC}"
  echo -e "${GREY}│${NC}    -h, --help    ${GREY}# Show this help message${NC}"
  echo -e "${GREY}└${NC}"
  exit 0
}

select_stack() {
  local stacks=()
  mapfile -t stacks < <(list_tooling_stacks)

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
  local -n _gi_present=$4

  local manifest="$PROJECT_ROOT/tooling/$stack/manifest.toml"
  [ ! -f "$manifest" ] && return

  local extends
  extends=$(grep '^extends' "$manifest" 2>/dev/null | cut -d'"' -f2)

  if [ -n "$extends" ]; then
    collect_stack_gitignore "$extends" "$target" "$3" "$4"
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
          else
            _gi_present+=("$entry")
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
  local -n _matching_scripts=$5

  local manifest="$PROJECT_ROOT/tooling/$stack/manifest.toml"
  [ ! -f "$manifest" ] && return

  local extends
  extends=$(grep '^extends' "$manifest" 2>/dev/null | cut -d'"' -f2)

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
        const scripts = p.scripts || {};
        process.stdout.write(scripts['$key'] !== undefined ? scripts['$key'] : '__MISSING__');
      " 2>/dev/null)

      if [ "$pkg_val" = "__MISSING__" ]; then
        _missing_scripts+=("$key")
      elif [ "$pkg_val" != "$val" ]; then
        _drifted_scripts+=("$key")
      else
        _matching_scripts+=("$key")
      fi
    fi
  done <"$manifest"

  if [ -n "$extends" ]; then
    collect_stack_scripts "$extends" "$target" "$3" "$4" "$5"
  fi
}

collect_stack_deps() {
  local stack="$1"
  local target="$2"
  local -n _missing_deps=$3
  local -n _present_deps=$4

  local manifest="$PROJECT_ROOT/tooling/$stack/manifest.toml"
  [ ! -f "$manifest" ] && return

  local extends
  extends=$(grep '^extends' "$manifest" 2>/dev/null | cut -d'"' -f2)

  if [ -n "$extends" ]; then
    collect_stack_deps "$extends" "$target" "$3" "$4"
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

    local pkg_spec
    pkg_spec=$(echo "$line" | tr -d '"[],' | xargs)
    [ -z "$pkg_spec" ] && continue

    local pkg_name="$pkg_spec"
    if [[ "$pkg_spec" == @* ]]; then
      local rest="${pkg_spec:1}"
      if [[ "$rest" == *@* ]]; then
        pkg_name="@${rest%%@*}"
      fi
    else
      pkg_name="${pkg_spec%%@*}"
    fi
    [ -z "$pkg_name" ] && continue

    [[ -v SEEN_DEPS["$pkg_name"] ]] && continue
    SEEN_DEPS["$pkg_name"]=1

    local pin_constraint=""
    if [ "$pkg_spec" != "$pkg_name" ]; then
      pin_constraint="${pkg_spec#"$pkg_name"@}"
    fi

    local installed
    installed=$(node -e "
      const p = JSON.parse(require('fs').readFileSync('$pkg'));
      const all = Object.assign({}, p.dependencies || {}, p.devDependencies || {});
      const v = all['$pkg_name'];
      process.stdout.write(v === undefined ? '__MISSING__' : v);
    " 2>/dev/null)

    if [ "$installed" = "__MISSING__" ]; then
      _missing_deps+=("$pkg_spec")
    elif [ -n "$pin_constraint" ]; then
      local pin_major installed_major
      pin_major=$(echo "$pin_constraint" | grep -oE '[0-9]+' | head -1)
      installed_major=$(echo "$installed" | grep -oE '[0-9]+' | head -1)
      if [ -n "$pin_major" ] && [ "$pin_major" != "$installed_major" ]; then
        _missing_deps+=("$pkg_spec")
      else
        _present_deps+=("$pkg_name")
      fi
    else
      _present_deps+=("$pkg_name")
    fi
  done <"$manifest"
}

collect_stack_references() {
  local stack="$1"
  local target="$2"
  local -n _ref_pending=$3
  local -n _ref_matching=$4

  local manifest="$PROJECT_ROOT/tooling/$stack/manifest.toml"
  [ ! -f "$manifest" ] && return

  local extends
  extends=$(grep '^extends' "$manifest" 2>/dev/null | cut -d'"' -f2)

  if [ -n "$extends" ]; then
    collect_stack_references "$extends" "$target" "$3" "$4"
  fi

  local reference_file="$PROJECT_ROOT/tooling/$stack/reference.md"
  [ ! -f "$reference_file" ] && return

  local dest="$target/tooling/$stack.md"

  if [ -f "$dest" ] && diff -q "$reference_file" "$dest" >/dev/null 2>&1; then
    _ref_matching+=("$stack")
  else
    _ref_pending+=("$stack")
  fi
}

apply_stack_references() {
  local target="$1"
  shift
  local stacks=("$@")

  mkdir -p "$target/tooling"

  for stack in "${stacks[@]}"; do
    local src="$PROJECT_ROOT/tooling/$stack/reference.md"
    cp "$src" "$target/tooling/$stack.md"
    log_add "tooling/$stack.md"
  done
}

scan_configs() {
  local stack="$1"
  local target="$2"

  echo -e "${GREY}├${NC} ${WHITE}Scanning configs${NC}" >&2

  collect_stack_configs "$stack" "$target" NEW_FILES DRIFTED_FILES MATCHING_FILES

  for f in "${MATCHING_FILES[@]}"; do
    log_info "$f"
  done
  for f in "${DRIFTED_FILES[@]}"; do
    log_warn "$f"
  done
  for f in "${NEW_FILES[@]}"; do
    log_add "$f"
  done

  CONFIG_CHANGES=$((${#NEW_FILES[@]} + ${#DRIFTED_FILES[@]}))

  log_step "Scanning seeds"

  collect_stack_seeds "$stack" "$target" SEEDED_FILES SEED_MISSING_FILES

  for f in "${SEEDED_FILES[@]}"; do
    log_info "$f"
  done
  for f in "${SEED_MISSING_FILES[@]}"; do
    log_add "$f"
  done

  SEED_CHANGES=${#SEED_MISSING_FILES[@]}

  if [ -f "$target/package.json" ]; then
    collect_stack_scripts "$stack" "$target" DRIFTED_SCRIPTS MISSING_SCRIPTS MATCHING_SCRIPTS

    local total_scripts=$((${#DRIFTED_SCRIPTS[@]} + ${#MISSING_SCRIPTS[@]} + ${#MATCHING_SCRIPTS[@]}))
    if [ "$total_scripts" -gt 0 ]; then
      log_step "Scanning scripts"
      for s in "${MATCHING_SCRIPTS[@]}"; do
        log_info "$s"
      done
      for s in "${DRIFTED_SCRIPTS[@]}"; do
        log_warn "$s"
      done
      for s in "${MISSING_SCRIPTS[@]}"; do
        log_add "$s"
      done
    fi

    SCRIPT_CHANGES=$((${#DRIFTED_SCRIPTS[@]} + ${#MISSING_SCRIPTS[@]}))

    collect_stack_deps "$stack" "$target" MISSING_DEPS PRESENT_DEPS

    local total_deps=$((${#MISSING_DEPS[@]} + ${#PRESENT_DEPS[@]}))
    if [ "$total_deps" -gt 0 ]; then
      log_step "Scanning dependencies"
      for d in "${PRESENT_DEPS[@]}"; do
        log_info "$d"
      done
      for d in "${MISSING_DEPS[@]}"; do
        log_add "$d"
      done
    fi

    DEP_CHANGES=${#MISSING_DEPS[@]}
  else
    local manifest="$PROJECT_ROOT/tooling/$stack/manifest.toml"
    if grep -qE '^\[(scripts|dependencies)' "$manifest" 2>/dev/null; then
      log_warn "Skipped scripts and deps: no package.json found (run 'bun init' to enable)"
    fi
  fi

  log_step "Scanning gitignore"

  collect_stack_gitignore "$stack" "$target" GITIGNORE_MISSING_FILES GITIGNORE_PRESENT_FILES

  for f in "${GITIGNORE_PRESENT_FILES[@]}"; do
    log_info "$f"
  done
  for f in "${GITIGNORE_MISSING_FILES[@]}"; do
    log_add "$f"
  done

  GITIGNORE_CHANGES=${#GITIGNORE_MISSING_FILES[@]}

  if [ "$INCLUDE_REFS" = "true" ]; then
    log_step "Scanning references"

    collect_stack_references "$stack" "$target" REF_PENDING REF_MATCHING

    for s in "${REF_MATCHING[@]}"; do
      log_info "tooling/$s.md"
    done
    for s in "${REF_PENDING[@]}"; do
      log_add "tooling/$s.md"
    done

    REF_CHANGES=${#REF_PENDING[@]}
  fi

  TOTAL_CHANGES=$((CONFIG_CHANGES + SEED_CHANGES + GITIGNORE_CHANGES + SCRIPT_CHANGES + DEP_CHANGES + REF_CHANGES))
}

open_diffs() {
  local target="$1"

  for f in "${DRIFTED_FILES[@]}"; do
    local src_stack="${CONFIG_SOURCE_STACK[$f]}"
    code --diff "$PROJECT_ROOT/tooling/$src_stack/configs/$f" "$target/$f"
  done
}

main() {
  local stack=""
  local target=""
  INCLUDE_REFS="true"

  while [ $# -gt 0 ]; do
    case "$1" in
    -h | --help)
      show_help
      ;;
    --no-ref)
      INCLUDE_REFS="false"
      shift
      ;;
    *)
      if [ -z "$stack" ]; then
        stack="$1"
      elif [ -z "$target" ]; then
        target="$1"
      else
        log_error "Unexpected argument: $1"
      fi
      shift
      ;;
    esac
  done

  target="${target:-.}"

  echo -e "${GREY}┌${NC}" >&2
  echo -e "${GREY}│${NC} ${WHITE}aitk tooling sync${NC}" >&2

  if [ -z "$stack" ]; then
    stack=$(select_stack)
  fi

  if is_tooling_stack_excluded "$stack"; then
    log_error "Claude is managed by \`aitk claude\`, not \`aitk tooling\`. Run \`aitk claude sync\` instead."
  fi

  if [ ! -d "$PROJECT_ROOT/tooling/$stack" ]; then
    log_error "Stack not found: $stack"
  fi

  guard_root "$target"

  NEW_FILES=()
  DRIFTED_FILES=()
  MATCHING_FILES=()
  SEEDED_FILES=()
  SEED_MISSING_FILES=()
  GITIGNORE_MISSING_FILES=()
  GITIGNORE_PRESENT_FILES=()
  DRIFTED_SCRIPTS=()
  MISSING_SCRIPTS=()
  MATCHING_SCRIPTS=()
  MISSING_DEPS=()
  PRESENT_DEPS=()
  REF_PENDING=()
  REF_MATCHING=()
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
  REF_CHANGES=0
  TOTAL_CHANGES=0

  scan_configs "$stack" "$target"

  if [ "$TOTAL_CHANGES" -eq 0 ]; then
    trap - EXIT
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
  if [ "$REF_CHANGES" -gt 0 ]; then
    [ -n "$summary" ] && summary+=", "
    summary+="${REF_CHANGES} refs"
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
      exit 0
    }
    ;;
  "Cancel")
    log_warn "Sync cancelled"
    exit 0
    ;;
  esac

  if [ "$CONFIG_CHANGES" -gt 0 ]; then
    inject_tooling_configs "$stack" "$target"
  fi

  inject_tooling_seeds "$stack" "$target"

  inject_tooling_manifest "$stack" "$target"

  if [ "$REF_CHANGES" -gt 0 ]; then
    log_step "Applying references"
    apply_stack_references "$target" "${REF_PENDING[@]}"
  fi

  trap - EXIT
  echo -e "${GREY}└${NC}\n" >&2
  echo -e "${GREEN}✓ Tooling sync complete${NC}" >&2
}

main "$@"
