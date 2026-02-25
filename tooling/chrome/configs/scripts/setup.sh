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
log_add() { echo -e "${GREY}│${NC} ${GREEN}+${NC} $1"; }
log_rem() { echo -e "${GREY}│${NC} ${RED}-${NC} $1"; }

ask() {
  local prompt_text=$1
  local var_name=$2
  local default_val=$3
  if [ -n "$default_val" ]; then
    echo -ne "${GREY}│${NC}\n${GREEN}◆${NC} ${prompt_text} (${default_val}) "
  else
    echo -ne "${GREY}│${NC}\n${GREEN}◆${NC} ${prompt_text} "
  fi
  read -r input
  [ -z "$input" ] && input="$default_val"
  export "$var_name"="$input"
  echo -e "\033[1A\r\033[K${GREY}◇${NC} ${prompt_text} ${WHITE}${input}${NC}"
}

select_option() {
  local prompt_text=$1
  shift
  local options=("$@")
  local cur=0
  local count=${#options[@]}

  echo -ne "${GREY}│${NC}\n${GREEN}◆${NC} ${prompt_text}\n"

  while true; do
    for i in "${!options[@]}"; do
      if [ "$i" -eq "$cur" ]; then
        echo -e "${GREY}│${NC}  ${GREEN}❯ ${options[$i]}${NC}"
      else
        echo -e "${GREY}│${NC}    ${GREY}${options[$i]}${NC}"
      fi
    done

    read -rsn1 key
    case "$key" in
    $'\x1b')
      if read -rsn2 -t 0.001 key_seq; then
        if [[ "$key_seq" == "[A" ]]; then cur=$(((cur - 1 + count) % count)); fi
        if [[ "$key_seq" == "[B" ]]; then cur=$(((cur + 1) % count)); fi
      else
        echo -en "\033[$((count + 1))A\033[J"
        echo -e "\033[1A${GREY}◇${NC} ${prompt_text} ${RED}Cancelled${NC}"
        exit 1
      fi
      ;;
    "k") cur=$(((cur - 1 + count) % count)) ;;
    "j") cur=$(((cur + 1) % count)) ;;
    "q")
      echo -en "\033[$((count + 1))A\033[J"
      echo -e "\033[1A${GREY}◇${NC} ${prompt_text} ${RED}Cancelled${NC}"
      exit 1
      ;;
    "") break ;;
    esac

    echo -en "\033[${count}A"
  done

  echo -en "\033[$((count + 1))A\033[J"
  echo -e "\033[1A${GREY}◇${NC} ${prompt_text} ${WHITE}${options[$cur]}${NC}"
  SELECTED_OPTION="${options[$cur]}"
}

check_dependencies() {
  command -v git >/dev/null 2>&1 || log_error "git is not installed"
  command -v node >/dev/null 2>&1 || log_error "node is not installed"
  command -v bun >/dev/null 2>&1 || log_error "bun is not installed"
  [ -f "package.json" ] || log_error "package.json missing — run from project root"
}

configure_identity() {
  ask "Extension Name?" "RAW_NAME" "my-chrome-extension"

  [ -z "$RAW_NAME" ] && log_error "Extension name cannot be empty"

  PROJECT_NAME=$(echo "$RAW_NAME" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]/-/g' | sed 's/-\+/-/g' | sed 's/^-//;s/-$//')
  export PROJECT_NAME

  if [ "$RAW_NAME" != "$PROJECT_NAME" ]; then
    log_info "Normalized to kebab-case: ${WHITE}$PROJECT_NAME${NC}"
  fi

  TITLE=$(echo "$PROJECT_NAME" | sed 's/-/ /g' | awk '{for(i=1;i<=NF;i++) $i=toupper(substr($i,1,1)) tolower(substr($i,2))}1')
  export TITLE

  PKG_DESC="Chrome extension built with React & Vite"
  export PKG_DESC

  PKG_AUTHOR=$(git config user.name 2>/dev/null || echo "")
  export PKG_AUTHOR

  echo -e "${GREY}│${NC}"
  log_info "Extension: ${WHITE}$PROJECT_NAME${NC}"
  log_info "This will reset git history and cannot be undone."
  select_option "Apply changes?" "Yes" "No"
  if [ "$SELECTED_OPTION" = "No" ]; then
    echo -e "${GREY}└${NC}"
    exit 0
  fi
}

update_package_json() {
  # shellcheck disable=SC2016
  node -e '
    const fs = require("fs");
    const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));
    pkg.name = process.env.PROJECT_NAME;
    pkg.description = process.env.PKG_DESC;
    pkg.author = process.env.PKG_AUTHOR;
    pkg.version = "0.1.0";
    pkg.scripts.verify = "./scripts/verify.sh";
    pkg.scripts.clean = "./scripts/clean.sh";
    pkg.scripts.update = "./scripts/update.sh";
    delete pkg.scripts.setup;
    fs.writeFileSync("package.json", JSON.stringify(pkg, null, 2) + "\n");
  ' || log_error "package.json update failed"
  log_add "package.json"
}

update_html_titles() {
  local files=("src/popup/index.html" "src/sidepanel/index.html")
  for file in "${files[@]}"; do
    [ -f "$file" ] || continue
    # shellcheck disable=SC2016
    FILE="$file" node -e '
    const fs = require("fs");
      const file = process.env.FILE;
    const title = process.env.TITLE || "Extension";
      let html = fs.readFileSync(file, "utf8");
      if (html.includes("<title>")) {
        html = html.replace(/<title[^>]*>.*?<\/title>/, "<title>" + title + "</title>");
      } else {
        html = html.replace("</head>", "  <title>" + title + "</title>\n  </head>");
      }
      fs.writeFileSync(file, html);
    ' || log_error "$file title update failed"
    log_add "$file"
  done
}

update_metadata() {
  log_step "Updating Extension Metadata"
  update_package_json
  update_html_titles
}

reset_git_history() {
  log_step "Resetting Git History"

  if [ -d "scripts" ]; then
    chmod +x scripts/*.sh 2>/dev/null || true
    log_info "Scripts made executable"
  fi

  rm -rf .git
  git init --initial-branch=main --quiet

  local script_path="$0"
  if [ -f "$script_path" ]; then
    rm "$script_path"
    log_rem "scripts/setup.sh"
  fi

  git add --all
  git commit --quiet -m "chore(root): initialize $PROJECT_NAME"
  log_add ".git/"
  log_info "Clean history initialized"
}

finalize_folder() {
  local folder
  local parent
  folder=$(basename "$PWD")
  parent=$(dirname "$PWD")
  NEW_PATH="$parent/$PROJECT_NAME"

  if [ "$folder" != "$PROJECT_NAME" ]; then
    log_step "Renaming Project Folder"
    cd "$parent"
    mv "$folder" "$PROJECT_NAME"
    log_info "Renamed: $folder → $PROJECT_NAME"
  else
    NEW_PATH="$PWD"
  fi
}

prompt_editor() {
  local auto_install=false
  echo -e "${GREY}│${NC}"
  select_option "Open in Editor?" "No" "VS Code" "Cursor"

  case "$SELECTED_OPTION" in
  "VS Code")
    if command -v code &>/dev/null; then
      code "$NEW_PATH" >/dev/null 2>&1 &
      log_info "Launching VS Code..."
      auto_install=true
    else
      log_warn "'code' not found in PATH"
    fi
    ;;
  "Cursor")
    if command -v cursor &>/dev/null; then
      cursor "$NEW_PATH" >/dev/null 2>&1 &
      log_info "Launching Cursor..."
      auto_install=true
    else
      log_warn "'cursor' not found in PATH"
    fi
    ;;
  esac

  AUTO_INSTALL="$auto_install"
}

install_dependencies() {
  if [ "$AUTO_INSTALL" = true ]; then
    log_step "Installing Dependencies"
    cd "$NEW_PATH"
    bun install
    log_info "Dependencies installed"
  fi
}

print_next_steps() {
  echo -e "${GREY}└${NC}\n"
  echo -e "${GREEN}✓ Setup Complete!${NC}"
  if [ "$AUTO_INSTALL" = true ]; then
    echo -e "  Run ${WHITE}\`bun run dev\`${NC} to start development"
  else
    echo -e "  1. Run ${WHITE}\`cd '$NEW_PATH'\`${NC}"
    echo -e "  2. Run ${WHITE}\`bun install\`${NC}"
    echo -e "  3. Run ${WHITE}\`bun run dev\`${NC}"
  fi
  echo ""
}

main() {
  check_dependencies

  echo -e "${GREY}┌${NC}"
  log_step "Chrome Extension Setup"

  configure_identity
  update_metadata
  reset_git_history
  finalize_folder
  prompt_editor
  install_dependencies
  print_next_steps
}

main "$@"
