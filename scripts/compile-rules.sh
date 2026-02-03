#!/bin/bash
set -e
set -o pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
TEMPLATE_FILE="$PROJECT_ROOT/commands/setup/rules.toml.template"
OUTPUT_FILE="$PROJECT_ROOT/commands/setup/rules.toml"
RULES_DIR="$PROJECT_ROOT/scripts/assets/cursor/rules"

if [ ! -f "$TEMPLATE_FILE" ]; then
    echo "Error: Template not found at $TEMPLATE_FILE"
    exit 1
fi

if [ ! -d "$RULES_DIR" ]; then
    echo "Error: Rules directory not found at $RULES_DIR"
    exit 1
fi

INJECTED_CONTENT="mkdir -p .cursor/rules"

for rule_file in "$RULES_DIR"/*.mdc; do
    if [ -f "$rule_file" ]; then
        filename=$(basename "$rule_file")
        
        INJECTED_CONTENT+=$'\n\n'
        INJECTED_CONTENT+="cat << 'GEMINI_RULE_EOF' > .cursor/rules/$filename"$'\n'
        
        file_content=$(cat "$rule_file")
        INJECTED_CONTENT+="$file_content"$'\n'
        INJECTED_CONTENT+="GEMINI_RULE_EOF"$'\n'
    fi
done

awk -v content="$INJECTED_CONTENT" '
    BEGIN {
        gsub(/\\/, "\\\\", content)
        gsub(/&/, "\\\\&", content)
    }
    {
        gsub("{{INJECT_ALL_RULES}}", content)
        print
    }
' "$TEMPLATE_FILE" > "$OUTPUT_FILE"

echo "Build complete: commands/setup/rules.toml generated."