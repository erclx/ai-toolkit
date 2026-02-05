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

SCRIPT_DIR=""
PROJECT_ROOT=""
TEMPLATE_FILE=""
OUTPUT_FILE=""
DOCS_DIR=""
PAYLOAD_FILE=""
ESCAPED_PAYLOAD_FILE=""

setup_paths() {
  SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
  PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
  TEMPLATE_FILE="$PROJECT_ROOT/commands/setup/docs.toml.template"
  OUTPUT_FILE="$PROJECT_ROOT/commands/setup/docs.toml"
  DOCS_DIR="$PROJECT_ROOT/scripts/assets/docs"
}

validate_paths() {
  if [ ! -f "$TEMPLATE_FILE" ]; then
    log_error "Template not found at $TEMPLATE_FILE"
  fi
  if [ ! -d "$DOCS_DIR" ]; then
    log_error "Docs directory not found at $DOCS_DIR"
  fi
}

build_doc_payload() {
  log_step "Building Payload"
  PAYLOAD_FILE=$(mktemp)
  
  echo "echo '📦 Installing Reference Documentation...'" > "$PAYLOAD_FILE"
  echo "mkdir -p docs" >> "$PAYLOAD_FILE"

  for doc_file in "$DOCS_DIR"/*.md; do
    if [ -f "$doc_file" ]; then
      local filename
      filename=$(basename "$doc_file")
      
      echo "" >> "$PAYLOAD_FILE"
      echo "cat << 'GEMINI_DOC_EOF' > docs/$filename" >> "$PAYLOAD_FILE"
      
      tr -d '\r' < "$doc_file" >> "$PAYLOAD_FILE"
      
      echo "" >> "$PAYLOAD_FILE"
      echo "GEMINI_DOC_EOF" >> "$PAYLOAD_FILE"
      
      echo "echo '  + docs/$filename'" >> "$PAYLOAD_FILE"
      log_info "Bundled $filename"
    fi
  done
  
  echo "" >> "$PAYLOAD_FILE"
  echo "echo '✅ Reference documentation installed successfully.'" >> "$PAYLOAD_FILE"
}

escape_payload() {
  log_step "Escaping for TOML"
  ESCAPED_PAYLOAD_FILE=$(mktemp)
  sed 's/\\/\\\\/g; s/"/\\"/g' "$PAYLOAD_FILE" > "$ESCAPED_PAYLOAD_FILE"
  log_info "Payload escaped"
}

cleanup_temp_files() {
  if [ -f "$PAYLOAD_FILE" ]; then
    rm "$PAYLOAD_FILE"
  fi
  if [ -f "$ESCAPED_PAYLOAD_FILE" ]; then
    rm "$ESCAPED_PAYLOAD_FILE"
  fi
}

inject_and_generate_output() {
  log_step "Injecting into Template"
  local split_line
  split_line=$(grep -n "{{INJECT_DOCS}}" "$TEMPLATE_FILE" | cut -d: -f1)

  if [ -z "$split_line" ]; then
    cleanup_temp_files
    log_error "Placeholder {{INJECT_DOCS}} not found in template"
  fi

  local header_lines=$((split_line - 1))
  
  head -n "$header_lines" "$TEMPLATE_FILE" > "$OUTPUT_FILE"
  cat "$ESCAPED_PAYLOAD_FILE" >> "$OUTPUT_FILE"
  echo "" >> "$OUTPUT_FILE"
  tail -n +$((split_line + 1)) "$TEMPLATE_FILE" >> "$OUTPUT_FILE"

  log_info "Artifact generated at commands/setup/docs.toml"
}

main() {
  echo -e "${GREY}┌${NC}"
  log_step "Initializing Docs Compiler"

  setup_paths
  validate_paths
  build_doc_payload
  escape_payload
  inject_and_generate_output
  cleanup_temp_files

  echo -e "${GREY}└${NC}\n"
  echo -e "${GREEN}✓ Build complete${NC}"
}

main "$@"