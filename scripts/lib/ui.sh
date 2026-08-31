#!/usr/bin/env bash

if [ "${BASH_VERSINFO[0]:-0}" -lt 4 ]; then
  echo "aitk requires bash 4 or newer. Current: ${BASH_VERSION:-unknown}." >&2
  echo "Install via Homebrew: brew install bash" >&2
  exit 1
fi

# Resolved from this file's own location rather than `$PROJECT_ROOT`, because
# `require_project_root` is what several scripts call before anything has
# established a root.
# shellcheck source=/dev/null
source "$(dirname "$(readlink -f "${BASH_SOURCE[0]}")")/sandbox-path.sh"

# `NO_COLOR` follows the published convention, where any non-empty value turns
# color off whatever the value says.
supports_color() {
  [ -z "${NO_COLOR:-}" ] && [ -t "$1" ]
}

# Assigns the six palette names for one file descriptor. The blank palette keeps
# every frame character and drops only the escapes, so a captured run still
# reads as one block.
#
# Bash returns a string and nothing richer, so the palette arrives through the
# caller's own scope. A writer declaring all six `local` before calling this
# keeps the assignment to itself, which is what leaves the source-time answer
# below standing for anything that sources this file.
set_palette() {
  if supports_color "$1"; then
    GREEN='\033[0;32m'
    RED='\033[0;31m'
    YELLOW='\033[0;33m'
    WHITE='\033[1;37m'
    GREY='\033[0;90m'
    NC='\033[0m'
  else
    GREEN=''
    RED=''
    YELLOW=''
    WHITE=''
    GREY=''
    NC=''
  fi
}

# Every writer below frames to stderr and asks about that stream at write time,
# so no answer is frozen before a caller's redirect is in place. This one answers
# for stdout instead, because it is read by a sourcing script writing its own
# frame with a bare `echo`, and that is the stream a bare `echo` reaches.
set_palette 1

log_info() {
  local GREEN RED YELLOW WHITE GREY NC
  set_palette 2
  echo -e "${GREY}│${NC} ${GREEN}✓${NC} $1" >&2
}
log_warn() {
  local GREEN RED YELLOW WHITE GREY NC
  set_palette 2
  echo -e "${GREY}│${NC} ${YELLOW}!${NC} $1" >&2
}
log_error() {
  local GREEN RED YELLOW WHITE GREY NC
  set_palette 2
  echo -e "${GREY}│${NC} ${RED}✗${NC} $1" >&2
  exit 1
}
log_step() {
  local GREEN RED YELLOW WHITE GREY NC
  set_palette 2
  echo -e "${GREY}│${NC}\n${GREY}├${NC} ${WHITE}$1${NC}" >&2
}
log_add() {
  local GREEN RED YELLOW WHITE GREY NC
  set_palette 2
  echo -e "${GREY}│${NC} ${GREEN}+${NC} $1" >&2
}
log_rem() {
  local GREEN RED YELLOW WHITE GREY NC
  set_palette 2
  echo -e "${GREY}│${NC} ${RED}-${NC} $1" >&2
}

pipe_output() {
  local GREEN RED YELLOW WHITE GREY NC
  set_palette 2
  while IFS= read -r line; do echo -e "${GREY}│${NC}  $line" >&2; done
}

open_timeline() {
  local GREEN RED YELLOW WHITE GREY NC
  set_palette 2
  echo -e "${GREY}┌${NC}" >&2
  if [ -n "${1:-}" ]; then
    echo -e "${GREY}│${NC} ${WHITE}$1${NC}" >&2
  fi
}

close_timeline() {
  local GREEN RED YELLOW WHITE GREY NC
  set_palette 2
  echo -e "${GREY}└${NC}" >&2
}

guard_root() {
  local target="$1"
  local target_abs
  target_abs=$(cd "$target" && pwd)
  if [ "$target_abs" = "$PROJECT_ROOT" ]; then
    log_error "Cannot run against toolkit root. Files here are the source of truth."
  fi
}

require_project_root() {
  local GREEN RED YELLOW WHITE GREY NC
  set_palette 2
  local sandbox in_sandbox=0
  if [ -n "${AITK_SANDBOX_DIR:-}" ]; then
    sandbox="$AITK_SANDBOX_DIR"
    [[ "$PWD" == "$sandbox" || "$PWD" == "$sandbox"/* ]] && in_sandbox=1
  else
    sandbox="$(sandbox_dir_prefix)"
    [[ "$PWD" == "$sandbox" || "$PWD" == "$sandbox"/* || "$PWD" == "$sandbox"-* ]] && in_sandbox=1
  fi
  if [ "$in_sandbox" -eq 1 ]; then
    echo -e "${GREY}┌${NC}" >&2
    log_error "Execution restricted: Command cannot be run from inside the sandbox environment."
  fi
  if [[ "$PWD" != "$PROJECT_ROOT"* ]]; then
    echo -e "${GREY}┌${NC}" >&2
    log_error "Context Error: You must run this command from inside the repository."
  fi
}

ask() {
  local GREEN RED YELLOW WHITE GREY NC
  set_palette 2
  local prompt_text=$1
  local var_name=$2
  local default_val=$3
  local input=""
  local char
  local display_default=""
  if [ -n "$default_val" ]; then
    display_default=" (${default_val})"
  fi
  if [[ "${AITK_NON_INTERACTIVE:-}" == "1" ]]; then
    echo -e "${GREY}│${NC}" >&2
    echo -e "${GREY}◇${NC} ${prompt_text} ${WHITE}${default_val}${NC}" >&2
    export "$var_name"="$default_val"
    return
  fi
  echo -e "${GREY}│${NC}" >&2
  echo -ne "${GREEN}◆${NC} ${prompt_text}${display_default} " >&2
  while IFS= read -r -s -n1 char; do
    if [[ $char == $'\x1b' ]]; then
      read -rsn2 -t 0.001 _ || true
      echo -ne "\r\033[K" >&2
      echo -e "${GREY}◇${NC} ${prompt_text} ${RED}Cancelled${NC}" >&2
      exit 1
    elif [[ $char == $'\x7f' || $char == $'\x08' ]]; then
      if [ -n "$input" ]; then
        input="${input%?}"
        echo -ne "\b \b" >&2
      fi
    elif [[ -z "$char" ]]; then
      break
    else
      input+="$char"
      echo -n "$char" >&2
    fi
  done
  [ -z "$input" ] && input="$default_val"
  echo -ne "\r\033[K" >&2
  echo -e "${GREY}◇${NC} ${prompt_text} ${WHITE}${input}${NC}" >&2
  export "$var_name"="$input"
}

select_or_route_scenario() {
  local GREEN RED YELLOW WHITE GREY NC
  set_palette 2
  local prompt_text=$1
  shift
  local options=("$@")

  if [ -n "${SANDBOX_SCENARIO:-}" ]; then
    echo -e "${GREY}│${NC}" >&2
    echo -e "${GREY}◇${NC} ${prompt_text} ${WHITE}${SANDBOX_SCENARIO}${NC}" >&2
    export SELECTED_OPTION="$SANDBOX_SCENARIO"
    return
  fi

  select_option "$prompt_text" "${options[@]}"
}

select_option() {
  local GREEN RED YELLOW WHITE GREY NC
  set_palette 2
  local prompt_text=$1
  shift
  local options=("$@")
  local cur=0
  local count=${#options[@]}

  if [[ "${AITK_NON_INTERACTIVE:-}" == "1" ]]; then
    echo -e "${GREY}│${NC}" >&2
    echo -e "${GREY}◇${NC} ${prompt_text} ${WHITE}${options[0]}${NC}" >&2
    export SELECTED_OPTION="${options[0]}"
    return
  fi

  if [ ! -t 0 ]; then
    log_error "${prompt_text} requires a TTY. Pass an argument or set AITK_NON_INTERACTIVE=1."
  fi

  echo -e "${GREY}│${NC}" >&2
  echo -ne "${GREEN}◆${NC} ${prompt_text}\n" >&2

  while true; do
    for i in "${!options[@]}"; do
      if [ "$i" -eq "$cur" ]; then
        echo -e "${GREY}│${NC}  ${GREEN}❯ ${options[$i]}${NC}" >&2
      else
        echo -e "${GREY}│${NC}    ${GREY}${options[$i]}${NC}" >&2
      fi
    done

    read -rsn1 key
    case "$key" in
    $'\x1b')
      if read -rsn2 -t 0.001 key_seq; then
        if [[ "$key_seq" == "[A" ]]; then cur=$(((cur - 1 + count) % count)); fi
        if [[ "$key_seq" == "[B" ]]; then cur=$(((cur + 1) % count)); fi
      else
        echo -ne "\033[$((count + 1))A\033[J" >&2
        echo -e "${GREY}◇${NC} ${prompt_text} ${RED}Cancelled${NC}" >&2
        exit 1
      fi
      ;;
    "k") cur=$(((cur - 1 + count) % count)) ;;
    "j") cur=$(((cur + 1) % count)) ;;
    "q")
      echo -ne "\033[$((count + 1))A\033[J" >&2
      echo -e "${GREY}◇${NC} ${prompt_text} ${RED}Cancelled${NC}" >&2
      exit 1
      ;;
    "") break ;;
    esac
    echo -ne "\033[${count}A" >&2
  done

  echo -ne "\033[$((count + 1))A\033[J" >&2
  echo -e "${GREY}◇${NC} ${prompt_text} ${WHITE}${options[$cur]}${NC}" >&2
  export SELECTED_OPTION="${options[$cur]}"
}
