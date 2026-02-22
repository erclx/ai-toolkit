#!/bin/bash

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
WHITE='\033[1;37m'
GREY='\033[0;90m'
NC='\033[0m'

log_info() { echo -e "${GREY}│${NC} ${GREEN}✓${NC} $1" >&2; }
log_warn() { echo -e "${GREY}│${NC} ${YELLOW}!${NC} $1" >&2; }
log_error() {
  echo -e "${GREY}│${NC} ${RED}✗${NC} $1" >&2
  exit 1
}
log_step() { echo -e "${GREY}│${NC}\n${GREY}├${NC} ${WHITE}$1${NC}" >&2; }
log_add() { echo -e "${GREY}│${NC} ${GREEN}+${NC} $1" >&2; }
log_rem() { echo -e "${GREY}│${NC} ${RED}-${NC} $1" >&2; }

pipe_output() { while IFS= read -r line; do echo -e "${GREY}│${NC}  $line" >&2; done; }

require_project_root() {
  if [[ "$PWD" == *".sandbox"* ]]; then
    echo -e "${GREY}┌${NC}" >&2
    log_error "Execution restricted: Command cannot be run from inside the sandbox environment."
  fi
  if [[ "$PWD" != "$PROJECT_ROOT"* ]]; then
    echo -e "${GREY}┌${NC}" >&2
    log_error "Context Error: You must run this command from inside the repository."
  fi
}

select_option() {
  local prompt_text=$1
  shift
  local options=("$@")
  local cur=0
  local count=${#options[@]}
  echo -e "${GREY}│${NC}" >&2
  echo -ne "${GREEN}◆${NC} ${prompt_text}\n" >&2

  while true; do
    for i in "${!options[@]}"; do
      if [ "$i" -eq $cur ]; then
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
        log_error "Selection cancelled"
      fi
      ;;
    "k") cur=$(((cur - 1 + count) % count)) ;;
    "j") cur=$(((cur + 1) % count)) ;;
    "") break ;;
    "q")
      echo -ne "\033[$((count + 1))A\033[J" >&2
      log_error "Selection cancelled"
      ;;
    esac
    echo -ne "\033[${count}A" >&2
  done

  echo -ne "\033[$((count + 1))A\033[J" >&2
  echo -e "${GREY}◇${NC} ${prompt_text} ${WHITE}${options[$cur]}${NC}" >&2
  export SELECTED_OPTION="${options[$cur]}"
}
