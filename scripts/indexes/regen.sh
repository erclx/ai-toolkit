#!/bin/bash
set -e
set -o pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="${PROJECT_ROOT:-$(dirname "$(dirname "$SCRIPT_DIR")")}"

source "$PROJECT_ROOT/scripts/lib/ui.sh"
source "$PROJECT_ROOT/scripts/lib/index.sh"

show_help() {
  echo -e "${GREY}┌${NC}"
  echo -e "${GREY}├${NC} ${WHITE}Usage:${NC} aitk indexes regen [options] [path...]"
  echo -e "${GREY}│${NC}"
  echo -e "${GREY}│${NC}  ${WHITE}Behavior:${NC}"
  echo -e "${GREY}│${NC}    With no paths, walks the current directory and"
  echo -e "${GREY}│${NC}    regenerates every folder that has an index.md."
  echo -e "${GREY}│${NC}    With paths, each path is resolved by walking up"
  echo -e "${GREY}│${NC}    until an index.md is found. Duplicates are deduped."
  echo -e "${GREY}│${NC}"
  echo -e "${GREY}│${NC}  ${WHITE}Options:${NC}"
  echo -e "${GREY}│${NC}    --dry-run      ${GREY}# Report changes without writing${NC}"
  echo -e "${GREY}│${NC}    --json         ${GREY}# Emit machine-readable JSON on stdout${NC}"
  echo -e "${GREY}│${NC}    --root <path>  ${GREY}# Walk-up boundary (default: CWD)${NC}"
  echo -e "${GREY}│${NC}    --no-stage     ${GREY}# Do not git add modified index.md files${NC}"
  echo -e "${GREY}│${NC}    -h, --help     ${GREY}# Show this help message${NC}"
  echo -e "${GREY}│${NC}"
  echo -e "${GREY}│${NC}  ${WHITE}Staging:${NC}"
  echo -e "${GREY}│${NC}    When positional paths are passed inside a git repo,"
  echo -e "${GREY}│${NC}    modified index.md files are auto-staged so lint-staged"
  echo -e "${GREY}│${NC}    and similar hooks commit the regenerated catalog."
  echo -e "${GREY}│${NC}    Pass --no-stage to disable. Whole-repo walks (no paths)"
  echo -e "${GREY}│${NC}    never auto-stage."
  echo -e "${GREY}│${NC}"
  echo -e "${GREY}│${NC}  ${WHITE}Exit codes:${NC}"
  echo -e "${GREY}│${NC}    0   no drift, nothing to do"
  echo -e "${GREY}│${NC}    1   frontmatter error or missing index.md"
  echo -e "${GREY}│${NC}    2   --dry-run found folders that would change"
  echo -e "${GREY}│${NC}"
  echo -e "${GREY}│${NC}  ${WHITE}Examples:${NC}"
  echo -e "${GREY}│${NC}    aitk indexes regen"
  echo -e "${GREY}│${NC}    aitk indexes regen --dry-run"
  echo -e "${GREY}│${NC}    aitk indexes regen --json docs/"
  echo -e "${GREY}│${NC}    aitk indexes regen wiki/foo.md prompts/bar.md"
  echo -e "${GREY}└${NC}"
  exit 0
}

dedupe_lines() {
  awk '!seen[$0]++'
}

collect_from_paths() {
  local root="$1"
  shift
  local path dir
  for path in "$@"; do
    if dir=$(find_indexed_ancestor "$path" "$root"); then
      printf '%s\n' "$dir"
    else
      printf 'WARN: %s has no index.md ancestor under %s\n' "$path" "$root" >&2
    fi
  done
}

collect_from_walk() {
  local root="$1"
  local index_file
  while IFS= read -r index_file; do
    [ -z "$index_file" ] && continue
    dirname "$index_file"
  done < <(list_indexes "$root")
}

main() {
  local dry_run=0
  local emit_json=0
  local no_stage=0
  local root=""
  local paths=()

  while [[ $# -gt 0 ]]; do
    case "$1" in
    -h | --help) show_help ;;
    --dry-run)
      dry_run=1
      shift
      ;;
    --json)
      emit_json=1
      shift
      ;;
    --no-stage)
      no_stage=1
      shift
      ;;
    --root)
      root="$2"
      shift 2
      ;;
    --)
      shift
      while [[ $# -gt 0 ]]; do
        paths+=("$1")
        shift
      done
      ;;
    -*)
      log_error "Unknown option: $1"
      ;;
    *)
      paths+=("$1")
      shift
      ;;
    esac
  done

  if [ -z "$root" ]; then
    root="$(pwd)"
  fi
  if [ ! -d "$root" ]; then
    if [ "$emit_json" -eq 1 ]; then
      printf '{"error":"root not a directory: %s"}\n' "$(json_escape_path "$root")"
      exit 1
    fi
    log_error "Root is not a directory: $root"
  fi

  local dirs
  local paths_passed=0
  if [ "${#paths[@]}" -gt 0 ]; then
    paths_passed=1
    dirs=$(collect_from_paths "$root" "${paths[@]}" | dedupe_lines)
  else
    dirs=$(collect_from_walk "$root" | dedupe_lines)
  fi

  local should_stage=0
  if [ "$paths_passed" -eq 1 ] && [ "$no_stage" -eq 0 ] && [ "$dry_run" -eq 0 ] && [ "$emit_json" -eq 0 ]; then
    if git -C "$root" rev-parse --git-dir >/dev/null 2>&1; then
      should_stage=1
    fi
  fi

  local any_error=0 any_drift=0 first=1

  trap close_timeline EXIT

  if [ "$emit_json" -eq 1 ]; then
    printf '{"root":"%s","dryRun":%s,"results":[' \
      "$(json_escape_path "$root")" \
      "$([ "$dry_run" -eq 1 ] && echo true || echo false)"
  else
    local label="Indexes"
    [ "$dry_run" -eq 1 ] && label="Indexes (dry-run)"
    log_step "$label"
  fi

  local dir rc
  while IFS= read -r dir; do
    [ -z "$dir" ] && continue
    rc=0
    regen_one "$dir" "$dry_run" "$emit_json" first || rc=$?
    case "$rc" in
    1) any_error=1 ;;
    2) any_drift=1 ;;
    esac

    if [ "$emit_json" -eq 0 ]; then
      local rel="${dir#$root/}"
      [ "$rel" = "$dir" ] && rel="$dir"
      case "$REGEN_LAST_ACTION" in
      written)
        log_add "$rel/index.md"
        if [ "$should_stage" -eq 1 ]; then
          if git -C "$root" add -- "$dir/index.md" >/dev/null 2>&1; then
            log_info "staged $rel/index.md"
          else
            log_warn "failed to stage $rel/index.md"
          fi
        fi
        ;;
      would-write) log_warn "$rel/index.md would change" ;;
      unchanged) log_info "$rel/index.md unchanged" ;;
      skipped) log_info "$rel/index.md skipped (auto:false)" ;;
      error) log_warn "$rel/index.md error" ;;
      esac
    fi
  done <<<"$dirs"

  if [ "$emit_json" -eq 1 ]; then
    printf ']}\n'
  fi

  if [ "$any_error" -eq 1 ]; then
    exit 1
  fi
  if [ "$dry_run" -eq 1 ] && [ "$any_drift" -eq 1 ]; then
    exit 2
  fi
  exit 0
}

main "$@"
