#!/usr/bin/env bash
input=$(cat)
model=$(echo "$input" | jq -r '.model.display_name // empty')
remaining=$(echo "$input" | jq -r '.context_window.remaining_percentage // empty')
used_pct=$(echo "$input" | jq -r '.context_window.used_percentage // empty')
ctx_size=$(echo "$input" | jq -r '.context_window.context_window_size // empty')

real_ctx="$ctx_size"
if [[ "${ANTHROPIC_BASE_URL:-}" == *"localhost"* ]] && command -v ollama &>/dev/null; then
  ollama_ctx=$(ollama ps 2>/dev/null | awk 'NR>1 {print $7; exit}')
  [ -n "$ollama_ctx" ] && real_ctx="$ollama_ctx"
fi

parts=""

[ -n "$model" ] && parts="$model"

if [ -n "$used_pct" ] && [ -n "$ctx_size" ]; then
  used_k=$(awk "BEGIN {printf \"%.0f\", ($used_pct/100)*$ctx_size/1000}")
  total_k=$(awk "BEGIN {printf \"%.0f\", $real_ctx/1000}")
  tokens_part="${used_k}k / ${total_k}k"
  [ -n "$parts" ] && parts="$parts | $tokens_part" || parts="$tokens_part"
fi

if [ -n "$remaining" ]; then
  rounded=$(printf '%.0f' "$remaining")
  if [ "$rounded" -lt 15 ]; then
    ctx_part="⚠ ${rounded}%"
  else
    ctx_part="${rounded}%"
  fi
  [ -n "$parts" ] && parts="$parts | $ctx_part" || parts="$ctx_part"
fi

printf "%s" "$parts"
