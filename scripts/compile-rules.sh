#!/bin/bash
set -e
set -o pipefail

GREEN='\033[0;32m'
RED='\033[0;31m'
WHITE='\033[1;37m'
GREY='\033[0;90m'
NC='\033[0m'

log_info() { echo -e "${GREY}│${NC} ${GREEN}✓${NC} $1"; }
log_error() { echo -e "${GREY}│${NC} ${RED}✗${NC} $1"; exit 1; }
log_step() { echo -e "${GREY}│${NC}\n${GREY}├${NC} ${WHITE}$1${NC}"; }

main() {
  echo -e "${GREY}┌${NC}"
  log_step "Initializing Rules Compiler"

  local script_dir
  script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
  local project_root
  project_root="$(dirname "$script_dir")"
  local template_file="$project_root/commands/setup/rules.toml.template"
  local output_file="$project_root/commands/setup/rules.toml"
  local rules_dir="$project_root/scripts/assets/cursor/rules"

  if [ ! -f "$template_file" ]; then
    log_error "Template not found at $template_file"
  fi

  if [ ! -d "$rules_dir" ]; then
    log_error "Rules directory not found at $rules_dir"
  fi

  log_step "Building Payload"
  local payload_file
  payload_file=$(mktemp)
  echo "mkdir -p .cursor/rules" > "$payload_file"

  for rule_file in "$rules_dir"/*.mdc; do
    if [ -f "$rule_file" ]; then
      local filename
        filename=$(basename "$rule_file")
      
      echo "" >> "$payload_file"
      echo "cat << 'GEMINI_RULE_EOF' > .cursor/rules/$filename" >> "$payload_file"
      
      tr -d '\r' < "$rule_file" >> "$payload_file"
      
      echo "" >> "$payload_file"
      echo "GEMINI_RULE_EOF" >> "$payload_file"
      log_info "Bundled $filename"
    fi
done

  echo "" >> "$payload_file"
  echo "echo '✅ Governance rules installed successfully.'" >> "$payload_file"

  log_step "Escaping for TOML"
  local escaped_payload_file
  escaped_payload_file=$(mktemp)
  sed 's/\\/\\\\/g; s/"/\\"/g' "$payload_file" > "$escaped_payload_file"
  log_info "Payload escaped"

  log_step "Injecting into Template"
  local split_line
  split_line=$(grep -n "{{INJECT_ALL_RULES}}" "$template_file" | cut -d: -f1)

  if [ -z "$split_line" ]; then
    rm "$payload_file" "$escaped_payload_file"
    log_error "Placeholder {{INJECT_ALL_RULES}} not found in template"
  fi

  local header_lines=$((split_line - 1))
  
  head -n "$header_lines" "$template_file" > "$output_file"
  cat "$escaped_payload_file" >> "$output_file"
  echo "" >> "$output_file"
  tail -n +$((split_line + 1)) "$template_file" >> "$output_file"

  rm "$payload_file" "$escaped_payload_file"

  log_info "Artifact generated at commands/setup/rules.toml"
  echo -e "${GREY}└${NC}\n"
  echo -e "${GREEN}✓ Build complete${NC}"
}

main "$@"