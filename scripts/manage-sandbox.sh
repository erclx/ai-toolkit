#!/bin/bash
set -e
set -o pipefail

SCRIPT_DIR="$(cd "$(dirname "$(readlink -f "${BASH_SOURCE[0]}")")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
export PROJECT_ROOT

source "$PROJECT_ROOT/scripts/config.sh"
source "$PROJECT_ROOT/scripts/lib/ui.sh"

show_help() {
  echo -e "${GREY}┌${NC}"
  echo -e "${GREY}├${NC} ${WHITE}Usage:${NC} aitk sandbox [cat:cmd]"
  echo -e "${GREY}│${NC}"
  echo -e "${GREY}│${NC}  ${WHITE}Arguments:${NC}"
  echo -e "${GREY}│${NC}    cat:cmd   ${GREY}# Scenario to provision (e.g. git:commit)${NC}"
  echo -e "${GREY}│${NC}"
  echo -e "${GREY}│${NC}  ${WHITE}Commands:${NC}"
  echo -e "${GREY}│${NC}    reset     ${GREY}# Reset sandbox to baseline${NC}"
  echo -e "${GREY}│${NC}    clean     ${GREY}# Wipe the sandbox${NC}"
  echo -e "${GREY}│${NC}"
  echo -e "${GREY}│${NC}  ${WHITE}Options:${NC}"
  echo -e "${GREY}│${NC}    -h, --help    ${GREY}# Show this help message${NC}"
  echo -e "${GREY}│${NC}"
  echo -e "${GREY}│${NC}  ${WHITE}Examples:${NC}"
  echo -e "${GREY}│${NC}    aitk sandbox"
  echo -e "${GREY}│${NC}    aitk sandbox git:commit"
  echo -e "${GREY}│${NC}    aitk sandbox reset"
  echo -e "${GREY}│${NC}    aitk sandbox clean"
  echo -e "${GREY}└${NC}"
  exit 0
}

clone_anchor() {
  local repo_name=${ANCHOR_REPO:-"vite-react-template"}
  local repo_url="git@github.com:${GITHUB_ORG}/$repo_name.git"

  log_step "Cloning anchor repository ($repo_name)"

  if [ -d "$SANDBOX" ]; then
    rm -rf "$SANDBOX"
  fi

  git clone --depth 1 "$repo_url" "$SANDBOX"
  rm -rf "$SANDBOX/.git"
  (
    cd "$SANDBOX"
    git init >/dev/null
    git add .
    git commit -m "feat(sandbox): initial sandbox setup from anchor" --no-verify >/dev/null
  )
  log_info "Anchor cloned and new git repo initialized in sandbox: $repo_url"
}

setup_ssh() {
  log_step "Security authentication"

  if [ -z "$SSH_AUTH_SOCK" ]; then
    eval "$(ssh-agent -s)" >/dev/null
    ssh-add ~/.ssh/id_rsa
    log_info "SSH Agent initialized"
  else
    log_info "SSH Agent active"
  fi
}

select_sandbox_category() {
  local categories=()
  if ls -d "$SANDBOX_DIR"/*/ >/dev/null 2>&1; then
    mapfile -t categories < <(find "$SANDBOX_DIR" -mindepth 1 -maxdepth 1 -type d -exec basename {} \; | sort)
  fi

  if [ ${#categories[@]} -eq 0 ]; then
    log_error "No sandbox categories found in $SANDBOX_DIR"
  fi

  select_option "Select category:" "${categories[@]}"
  _CATEGORY=$SELECTED_OPTION
}

select_sandbox_command() {
  local commands=()
  if ls "$SANDBOX_DIR/$_CATEGORY/"*.sh >/dev/null 2>&1; then
    mapfile -t commands < <(find "$SANDBOX_DIR/$_CATEGORY" -maxdepth 1 -name '*.sh' -exec basename {} .sh \; | sort)
  fi

  if [ ${#commands[@]} -eq 0 ]; then
    log_error "No sandbox scripts found in $_CATEGORY"
  fi

  select_option "Select command:" "${commands[@]}"
  _COMMAND=$SELECTED_OPTION
}

prompt_for_category_and_command() {
  select_sandbox_category
  select_sandbox_command
}

parse_command_argument() {
  local input_arg="$1"

  if [ "$input_arg" == "cursor" ]; then
    _CATEGORY="infra"
    _COMMAND="cursor"
  else
    if [[ "$input_arg" != *":"* ]]; then
      log_error "Invalid format. Use <category>:<command>, 'reset', 'clean', or --help"
    fi
    IFS=':' read -r _CATEGORY _COMMAND <<<"$input_arg"
  fi
}

resolve_command_and_category() {
  local input_arg="$1"
  if [ -z "$input_arg" ]; then
    prompt_for_category_and_command
  else
    parse_command_argument "$input_arg"
  fi
}

validate_environment() {
  local current_category="$1"
  local current_command="$2"

  if [ ! -d "$SANDBOX_DIR" ]; then
    log_error "Sandbox directory not found at: $SANDBOX_DIR"
  fi

  if [[ "$PWD" == *".sandbox"* ]]; then
    log_warn "Detected execution inside .sandbox. Switching to project root..."
    cd "$PROJECT_ROOT" || log_error "Failed to switch to project root."
  fi
}

load_sandbox_script() {
  local current_category="$1"
  local current_command="$2"

  local sandbox_file="$SANDBOX_DIR/$current_category/$current_command.sh"

  if [ ! -f "$sandbox_file" ]; then
    log_error "Sandbox script not found: $current_category/$current_command"
  fi

  # shellcheck source=/dev/null
  source "$sandbox_file"

  if [ "$current_category" == "git" ] && [ "$current_command" == "pr" ]; then
    setup_ssh
  fi
}

init_empty_sandbox() {
  if [ -d "$SANDBOX" ]; then
    rm -rf "$SANDBOX"
  fi
  mkdir -p "$SANDBOX"

  cat <<EOF >"$SANDBOX/.gitignore"
.gemini/.tmp/
.claude/.tmp/
node_modules
EOF
  (
    cd "$SANDBOX"
    git init >/dev/null
    git add .gitignore >/dev/null 2>/dev/null
    git commit -m "feat(sandbox): initial empty sandbox setup" --no-verify >/dev/null
  )
}

provision_sandbox() {
  log_step "Provisioning $1:$2"

  if [[ "$(type -t use_anchor)" == "function" ]]; then
    use_anchor
    clone_anchor
  else
    init_empty_sandbox
  fi
}

inject_documentation() {
  if [ -d "$PROJECT_ROOT/standards" ]; then
    mkdir -p "$SANDBOX/standards"
    cp -r "$PROJECT_ROOT/standards/." "$SANDBOX/standards/"
  fi
}

inject_context() {
  if [ -f "$PROJECT_ROOT/GEMINI.md" ]; then
    cp "$PROJECT_ROOT/GEMINI.md" "$SANDBOX/GEMINI.md"
  fi
}

inject_gov_rules() {
  local rules_source="$PROJECT_ROOT/governance/rules"
  if [ -d "$rules_source" ]; then
    mkdir -p "$SANDBOX/.cursor/rules"
    find "$rules_source" -type f -name "*.mdc" -exec cp {} "$SANDBOX/.cursor/rules/" \;
  fi
}

inject_seeds() {
  local seeds_source="$PROJECT_ROOT/tooling/claude/seeds"
  if [ -d "$seeds_source" ]; then
    cp -r "$seeds_source/." "$SANDBOX/"
  fi
}

configure_agent_settings() {
  mkdir -p "$SANDBOX/.gemini"
  cat <<EOF >"$SANDBOX/.gemini/settings.json"
{
  "model": {
    "name": "$DEFAULT_GEMINI_MODEL"
  }
}
EOF
}

commit_environment_setup() {
  (
    cd "$SANDBOX"
    git add .
    if ! git diff --cached --quiet; then
      git commit -m "chore(sandbox): initial environment setup" --no-verify >/dev/null
    fi
  )
}

setup_sandbox_assets() {
  [ -n "$SANDBOX_INJECT_SEEDS" ] && inject_seeds
  [ -n "$SANDBOX_INJECT_STANDARDS" ] && inject_documentation
  [ -n "$SANDBOX_INJECT_CONTEXT" ] && inject_context
  [ -n "$SANDBOX_INJECT_GOV" ] && inject_gov_rules
  [ -n "$SANDBOX_INJECT_GEMINI" ] && configure_agent_settings
  commit_environment_setup
}

initialize_sandbox_environment() {
  local current_category="$1"
  local current_command="$2"

  load_sandbox_script "$current_category" "$current_command"
  [[ "$(type -t use_config)" == "function" ]] && use_config
  validate_environment "$current_category" "$current_command"
  provision_sandbox "$current_category" "$current_command"
  setup_sandbox_assets
}

commit_sandbox_changes() {
  if [ -z "$SANDBOX_SKIP_AUTO_COMMIT" ]; then
    log_step "Staging environment changes"
    (
      cd "$SANDBOX"
      git add . >/dev/null 2>/dev/null
      git commit -m 'chore(sandbox): apply scenario specific setup' --no-verify >/dev/null
    )
    log_info "Git state clean after setup"
  else
    log_info "Skipping auto-commit"
  fi
}

tag_sandbox_baseline() {
  (
    cd "$SANDBOX"
    git update-ref refs/sandbox/baseline HEAD >/dev/null 2>&1
    git write-tree | xargs -I {} git update-ref refs/sandbox/baseline-index {} >/dev/null 2>&1
  )
}

execute_sandbox_and_commit() {
  pushd "$SANDBOX" >/dev/null
  stage_setup
  popd >/dev/null

  commit_sandbox_changes
  tag_sandbox_baseline
}

handle_post_execution_prompt() {
  local current_category="$1"
  local current_command="$2"

  if [ "$current_category" == "infra" ] && [ "$current_command" == "cursor" ]; then
    select_option "Open sandbox in Cursor?" "Yes" "No"
    if [ "$SELECTED_OPTION" == "Yes" ]; then
      if command -v cursor &>/dev/null; then
        log_info "Opening Cursor..."
        cursor "$SANDBOX"
      else
        log_warn "Cursor CLI command 'cursor' not found."
        log_info "Sandbox path: $SANDBOX"
      fi
    else
      echo -e "${GREY}│${NC}  ${GREY}Skipping opening Cursor${NC}" >&2
    fi
  fi

  trap - EXIT
  close_timeline
  echo "" >&2
  echo -e "${GREEN}✓ Sandbox Ready${NC}" >&2
}

cmd_clean() {
  log_step "Removing sandbox"
  rm -rf "$SANDBOX"
  log_rem ".sandbox/"
  trap - EXIT
  close_timeline
  echo "" >&2
  echo -e "${GREEN}✓ Sandbox clean${NC}" >&2
}

reset_sandbox() {
  if [ ! -d "$SANDBOX/.git" ]; then
    log_error "No sandbox found. Run \`aitk sandbox\` first."
  fi

  log_step "Sandbox state"

  local has_baseline=0
  (cd "$SANDBOX" && git rev-parse refs/sandbox/baseline >/dev/null 2>&1) && has_baseline=1

  if [ "$has_baseline" -eq 0 ]; then
    log_error "No baseline found. Re-provision with \`aitk sandbox <cat>:<cmd>\`."
  fi

  local is_dirty=0
  (
    cd "$SANDBOX"
    if [ "$(git rev-parse HEAD)" != "$(git rev-parse refs/sandbox/baseline)" ]; then
      exit 1
    fi
    local current_index baseline_index
    current_index=$(git write-tree)
    baseline_index=$(git rev-parse refs/sandbox/baseline-index 2>/dev/null || echo "")
    if [ -n "$baseline_index" ] && [ "$current_index" != "$baseline_index" ]; then
      exit 1
    fi
    if ! git diff --quiet 2>/dev/null; then
      exit 1
    fi
    if [ -n "$(git ls-files --others --exclude-standard 2>/dev/null)" ]; then
      exit 1
    fi
  ) || is_dirty=1

  if [ "$is_dirty" -eq 0 ]; then
    log_info "At baseline"
    trap - EXIT
    close_timeline
    echo "" >&2
    echo -e "${GREEN}✓ Sandbox at baseline${NC}" >&2
    exit 0
  fi

  log_warn "Uncommitted changes detected"

  select_option "Reset sandbox to initial state?" "Yes" "No"
  if [ "$SELECTED_OPTION" == "No" ]; then
    log_warn "Reset cancelled"
    exit 0
  fi

  log_step "Resetting sandbox"
  (
    cd "$SANDBOX"
    git reset --hard refs/sandbox/baseline --quiet
    git clean -fd --quiet
    local baseline_index
    baseline_index=$(git rev-parse refs/sandbox/baseline-index 2>/dev/null || echo "")
    if [ -n "$baseline_index" ] && [ "$baseline_index" != "$(git write-tree)" ]; then
      git read-tree "$baseline_index"
      git checkout-index -a -f
    fi
  )
  log_info "Sandbox reset to baseline"

  trap - EXIT
  close_timeline
  echo "" >&2
  echo -e "${GREEN}✓ Sandbox reset complete${NC}" >&2
}

main() {
  local no_header=0
  if [[ "$1" == "--no-header" ]]; then
    no_header=1
    shift
  fi

  if [[ "$1" == "-h" || "$1" == "--help" ]]; then
    show_help
  fi

  if [[ "$no_header" -eq 0 ]]; then
    open_timeline "aitk sandbox"
  fi
  trap close_timeline EXIT

  if [[ "$PWD" != "$PROJECT_ROOT"* ]]; then
    log_error "Context error: you must run this command from inside the toolkit repository."
  fi

  SANDBOX="$PROJECT_ROOT/.sandbox"
  SANDBOX_DIR="$PROJECT_ROOT/scripts/sandbox"

  if [[ "$1" == "reset" ]]; then
    reset_sandbox
    exit 0
  fi

  if [[ "$1" == "clean" ]]; then
    cmd_clean
    exit 0
  fi

  resolve_command_and_category "$1"
  local category="$_CATEGORY"
  local command="$_COMMAND"

  if [ -n "${2:-}" ]; then
    export SANDBOX_SCENARIO="$2"
    export AITK_NON_INTERACTIVE="1"
  fi

  initialize_sandbox_environment "$category" "$command"
  execute_sandbox_and_commit

  handle_post_execution_prompt "$category" "$command"
}

main "$@"
