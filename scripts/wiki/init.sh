#!/bin/bash
set -e
set -o pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="${PROJECT_ROOT:-$(dirname "$(dirname "$SCRIPT_DIR")")}"

source "$PROJECT_ROOT/scripts/lib/ui.sh"

cmd_init() {
  local target="${1:-.}"

  guard_root "$target"

  local wiki_dir="$target/wiki"
  local index_file="$wiki_dir/index.md"

  log_step "Scanning wiki/"

  local pending=()

  if [ ! -d "$wiki_dir" ]; then
    log_add "wiki/"
    pending+=("dir")
  fi

  if [ ! -f "$index_file" ]; then
    log_add "wiki/index.md"
    pending+=("index")
  else
    log_info "wiki/index.md"
  fi

  if [ "${#pending[@]}" -eq 0 ]; then
    trap - EXIT
    echo -e "${GREY}└${NC}\n"
    echo -e "${GREEN}✓ Wiki already initialized${NC}"
    return
  fi

  select_option "Apply ${#pending[@]} change(s)?" "Apply all" "Cancel"

  if [ "$SELECTED_OPTION" = "Cancel" ]; then
    log_warn "Cancelled"
    exit 1
  fi

  log_step "Applying changes"

  mkdir -p "$wiki_dir"

  if [[ " ${pending[*]} " == *" index "* ]]; then
    cat >"$index_file" <<'EOF'
# Wiki

Reference pages for tools, workflows, and concepts. Written and maintained by hand.

- [Example](example.md): brief description of page content
EOF
    log_add "wiki/index.md"
  fi

  trap - EXIT
  echo -e "${GREY}└${NC}\n"
  echo -e "${GREEN}✓ Wiki ready${NC}"
}

cmd_init "$@"
