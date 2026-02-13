#!/bin/bash
set -e
set -o pipefail

GREEN='\033[0;32m'
RED='\033[0;31m'
WHITE='\033[1;37m'
GREY='\033[0;90m'
NC='\033[0m'

log_info()  { echo -e "${GREY}│${NC} ${GREEN}✓${NC} $1" >&2; }
log_error() { echo -e "${GREY}│${NC} ${RED}✗${NC} $1" >&2; exit 1; }
log_step()  { echo -e "${GREY}│${NC}\n${GREY}├${NC} ${WHITE}$1${NC}" >&2; }

SOURCE_DIR="$1"
TARGET_DIR_NAME="$2"
TEMPLATE_FILE="$3"
OUTPUT_FILE="$4"
PLACEHOLDER="$5"
EXTENSION="$6"

validate_inputs() {
  if [ ! -d "$SOURCE_DIR" ]; then
    log_error "Source directory not found: $SOURCE_DIR"
  fi
  if [ ! -f "$TEMPLATE_FILE" ]; then
    log_error "Template file not found: $TEMPLATE_FILE"
  fi
}

build_payload() {
  log_step "Bundling Source Assets"
  
  local payload_file
  payload_file=$(mktemp)
  
  echo "echo '📦 Installing Assets...'" > "$payload_file"
  echo "mkdir -p $TARGET_DIR_NAME" >> "$payload_file"
  
  local count=0
  
  while IFS= read -r file; do
      local filename
      filename=$(basename "$file")
      local rel_path="${file#$SOURCE_DIR/}"
      
      echo "" >> "$payload_file"
      echo "cat << 'GEMINI_EOF' > $TARGET_DIR_NAME/$filename" >> "$payload_file"
      tr -d '\r' < "$file" >> "$payload_file"
      echo "" >> "$payload_file"
      echo "GEMINI_EOF" >> "$payload_file"
      
      echo "echo '  + $TARGET_DIR_NAME/$filename'" >> "$payload_file"
      log_info "$rel_path"
      count=$((count + 1))
  done < <(find "$SOURCE_DIR" -type f -name "*$EXTENSION" | sort)
  
  echo "" >> "$payload_file"
  echo "echo '✅ Installation complete.'" >> "$payload_file"
  
  if [ "$count" -eq 0 ]; then
    log_error "No files found in $SOURCE_DIR with extension $EXTENSION"
  fi
  
  echo "$payload_file"
}

escape_payload() {
  local input_file="$1"
  
  local escaped_file
  escaped_file=$(mktemp)
  sed 's/\\/\\\\/g; s/"/\\"/g' "$input_file" > "$escaped_file"
  
  echo "$escaped_file"
}

inject_into_template() {
  local content_file="$1"
  
  local split_line
  split_line=$(grep -n "$PLACEHOLDER" "$TEMPLATE_FILE" | cut -d: -f1)
  
  if [ -z "$split_line" ]; then
    log_error "Placeholder $PLACEHOLDER not found in $TEMPLATE_FILE"
  fi
  
  local head_lines=$((split_line - 1))
  
  head -n "$head_lines" "$TEMPLATE_FILE" > "$OUTPUT_FILE"
  cat "$content_file" >> "$OUTPUT_FILE"
  echo "" >> "$OUTPUT_FILE"
  tail -n +$((split_line + 1)) "$TEMPLATE_FILE" >> "$OUTPUT_FILE"
  
  local clean_path="${OUTPUT_FILE#$PWD/}"
  log_info "Artifact generated at $clean_path"
}

main() {
  validate_inputs
  
  local raw_payload
  raw_payload=$(build_payload)
  
  local escaped_payload
  escaped_payload=$(escape_payload "$raw_payload")
  
  inject_into_template "$escaped_payload"
  
  rm "$raw_payload" "$escaped_payload"
}

main "$@"