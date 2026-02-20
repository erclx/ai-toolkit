#!/bin/bash
set -e
set -o pipefail

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
WHITE='\033[1;37m'
GREY='\033[0;90m'
NC='\033[0m'

log_info() { echo -e "${GREY}│${NC} ${GREEN}✓${NC} $1"; }
log_warn() { echo -e "${GREY}│${NC} ${YELLOW}!${NC} $1"; }
log_error() {
  echo -e "${GREY}│${NC} ${RED}✗${NC} $1"
  exit 1
}
log_step() { echo -e "${GREY}│${NC}\n${GREY}├${NC} ${WHITE}$1${NC}"; }

show_help() {
  echo -e "${GREY}┌${NC}"
  log_step "Core Toolkit Orchestrator Help"
  echo -e "${GREY}│${NC}  ${WHITE}Usage:${NC}"
  echo -e "${GREY}│${NC}    gdev                  ${GREY}# Open interactive picker to generate a scenario${NC}"
  echo -e "${GREY}│${NC}    gdev <cat>:<cmd>      ${GREY}# Generate a specific scenario${NC}"
  echo -e "${GREY}│${NC}    gdev build            ${GREY}# Scan, compile, and commit governance artifacts${NC}"
  echo -e "${GREY}│${NC}    gdev sync <path>      ${GREY}# Sync rules to another project${NC}"
  echo -e "${GREY}│${NC}    gdev reset            ${GREY}# Reset sandbox to initial state${NC}"
  echo -e "${GREY}│${NC}    gdev clean            ${GREY}# Wipe the sandbox${NC}"
  echo -e "${GREY}│${NC}    gdev cursor           ${GREY}# Setup cursor specific sandbox${NC}"
  echo -e "${GREY}│${NC}"
  echo -e "${GREY}│${NC}  ${WHITE}Examples:${NC}"
  echo -e "${GREY}│${NC}    gdev git:commit"
  echo -e "${GREY}│${NC}    gdev build"
  echo -e "${GREY}│${NC}    gdev sync ../my-app"
  echo -e "${GREY}│${NC}    gdev reset"
  echo -e "${GREY}└${NC}"
  exit 0
}

select_option() {
  local prompt_text=$1
  shift
  local options=("$@")
  local cur=0
  local count=${#options[@]}
  echo -e "${GREY}│${NC}"
  echo -ne "${GREEN}◆${NC} ${prompt_text}\n"

  while true; do
    for i in "${!options[@]}"; do
      if [ "$i" -eq $cur ]; then
        echo -e "${GREY}│${NC}  ${GREEN}❯ ${options[$i]}${NC}"
      else
        echo -e "${GREY}│${NC}    ${GREY}${options[$i]}${NC}"
      fi
    done

    read -rsn1 key
    case "$key" in
    $'\x1b')
      if read -rsn2 -t 0.001 key; then
        if [[ "$key" == "[A" ]]; then cur=$(((cur - 1 + count) % count)); fi
        if [[ "$key" == "[B" ]]; then cur=$(((cur + 1) % count)); fi
      else
        echo -ne "\033[$((count + 1))A\033[J"
        log_error "Selection cancelled"
      fi
      ;;
    "k") cur=$(((cur - 1 + count) % count)) ;;
    "j") cur=$(((cur + 1) % count)) ;;
    "") break ;;
    "q")
      echo -ne "\033[$((count + 1))A\033[J"
      log_error "Selection cancelled"
      ;;
    esac
    echo -ne "\033[${count}A"
  done

  echo -ne "\033[$((count + 1))A\033[J"
  echo -e "${GREY}◇${NC} ${prompt_text} ${WHITE}${options[$cur]}${NC}"
  export SELECTED_OPT="${options[$cur]}"
}

clone_anchor() {
  local repo_name=${ANCHOR_REPO:-"vite-react-template"}
  local repo_url="git@github.com:erclx/$repo_name.git"

  log_step "Cloning Anchor Repository ($repo_name)"

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
  log_step "Security Authentication"

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
    mapfile -t categories < <(find "$SANDBOX_DIR" -mindepth 1 -maxdepth 1 -type d -exec basename {} \;)
  fi

  if [ ${#categories[@]} -eq 0 ]; then
    log_error "No sandbox categories found in $SANDBOX_DIR"
  fi

  select_option "Select category:" "${categories[@]}"
  _CATEGORY=$SELECTED_OPT
}

select_sandbox_command() {
  local commands=()
  if ls "$SANDBOX_DIR/$_CATEGORY/"*.sh >/dev/null 2>&1; then
    mapfile -t commands < <(find "$SANDBOX_DIR/$_CATEGORY" -maxdepth 1 -name '*.sh' -exec basename {} .sh \;)
  fi

  if [ ${#commands[@]} -eq 0 ]; then
    log_error "No sandbox scripts found in $_CATEGORY"
  fi

  select_option "Select command:" "${commands[@]}"
  _COMMAND=$SELECTED_OPT
}

prompt_for_category_and_command() {
  select_sandbox_category
  select_sandbox_command
}

parse_command_argument() {
  local input_arg="$1"

  if [ "$input_arg" == "clean" ]; then
    rm -rf "$SANDBOX" && log_info "Sandbox cleaned." && echo -e "${GREY}└${NC}" && exit 0
  elif [ "$input_arg" == "cursor" ]; then
    _CATEGORY="infra"
    _COMMAND="cursor"
  else
    if [[ "$input_arg" != *":"* ]]; then
      log_error "Invalid format. Use <category>:<command>, 'build', 'clean', 'reset', 'cursor', 'sync', or --help"
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
    echo -e "${GREY}┌${NC}"
    log_error "Sandbox directory not found at: $SANDBOX_DIR"
  fi

  echo -e "${GREY}┌${NC}"

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

configure_agent_settings() {
  mkdir -p "$SANDBOX/.gemini"
  cat <<EOF >"$SANDBOX/.gemini/settings.json"
{
  "model": {
    "name": "$LLM_MODEL"
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
  inject_documentation
  configure_agent_settings
  commit_environment_setup
}

initialize_sandbox_environment() {
  local current_category="$1"
  local current_command="$2"

  validate_environment "$current_category" "$current_command"
  load_sandbox_script "$current_category" "$current_command"
  provision_sandbox "$current_category" "$current_command"
  setup_sandbox_assets
}

commit_sandbox_changes() {
  if [ -z "$GEMINI_SKIP_AUTO_COMMIT" ]; then
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
    git tag -f sandbox-baseline >/dev/null 2>&1
    git write-tree | xargs -I {} git tag -f sandbox-baseline-index {} >/dev/null 2>&1
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
    if [ "$SELECTED_OPT" == "Yes" ]; then
      if command -v cursor &>/dev/null; then
        log_info "Opening Cursor..."
        cursor "$SANDBOX"
      else
        log_warn "Cursor CLI command 'cursor' not found."
        log_info "Sandbox Path: $SANDBOX"
      fi
    else
      echo -e "${GREY}│${NC}  ${GREY}Skipping opening Cursor${NC}"
    fi
  fi

  echo -e "${GREY}└${NC}\n"
  echo -e "${GREEN}✓ Sandbox Ready${NC}"
}

reset_sandbox() {
  echo -e "${GREY}┌${NC}"

  if [ ! -d "$SANDBOX/.git" ]; then
    log_error "No sandbox found. Run gdev first."
  fi

  log_step "Checking Sandbox State"

  local has_baseline=0
  (cd "$SANDBOX" && git rev-parse sandbox-baseline >/dev/null 2>&1) && has_baseline=1

  if [ "$has_baseline" -eq 0 ]; then
    log_error "No baseline found. Re-provision with gdev <cat>:<cmd>."
  fi

  local is_dirty=0
  (
    cd "$SANDBOX"
    if [ "$(git rev-parse HEAD)" != "$(git rev-parse sandbox-baseline)" ]; then
      exit 1
    fi
    local current_index baseline_index
    current_index=$(git write-tree)
    baseline_index=$(git rev-parse sandbox-baseline-index 2>/dev/null || echo "")
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
    echo -e "${GREY}└${NC}\n"
    echo -e "${GREEN}✓ Sandbox already at initial state${NC}"
    exit 0
  fi

  select_option "Reset sandbox to initial state?" "Yes" "No"
  if [ "$SELECTED_OPT" == "No" ]; then
    log_warn "Reset cancelled"
    echo -e "${GREY}└${NC}"
    exit 0
  fi

  log_step "Resetting Sandbox"
  (
    cd "$SANDBOX"
    git reset --hard sandbox-baseline --quiet
    git clean -fd --quiet
    local baseline_index
    baseline_index=$(git rev-parse sandbox-baseline-index 2>/dev/null || echo "")
    if [ -n "$baseline_index" ] && [ "$baseline_index" != "$(git write-tree)" ]; then
      git read-tree "$baseline_index"
      git checkout-index -a -f
    fi
  )
  log_info "Sandbox reset to baseline"

  echo -e "${GREY}└${NC}\n"
  echo -e "${GREEN}✓ Sandbox reset complete${NC}"
}

main() {
  SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
  PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

  export PROJECT_ROOT

  if [[ "$1" == "sync" ]]; then
    shift
    exec "$PROJECT_ROOT/scripts/sync-gov.sh" "$@"
  fi

  if [[ "$1" == "build" ]]; then
    shift
    exec "$PROJECT_ROOT/scripts/build-gov.sh" "$@"
  fi

  if [[ "$PWD" != "$PROJECT_ROOT"* ]]; then
    echo -e "${GREY}┌${NC}"
    log_error "Context Error: You must run this command from inside the 'ai-toolkit' repository."
  fi

  SANDBOX="$PROJECT_ROOT/.sandbox"
  SANDBOX_DIR="$PROJECT_ROOT/scripts/sandbox"
  LLM_MODEL="gemini-2.5-flash"

  if [[ "$1" == "-h" || "$1" == "--help" ]]; then
    show_help
  fi

  if [[ "$1" == "reset" ]]; then
    reset_sandbox
    exit 0
  fi

  resolve_command_and_category "$1"
  local category="$_CATEGORY"
  local command="$_COMMAND"

  initialize_sandbox_environment "$category" "$command"

  execute_sandbox_and_commit

  handle_post_execution_prompt "$category" "$command"
}

main "$@"
