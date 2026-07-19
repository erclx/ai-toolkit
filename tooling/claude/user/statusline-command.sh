#!/usr/bin/env bash
input=$(cat)

{
  IFS= read -r model
  IFS= read -r effort
  IFS= read -r remaining
  IFS= read -r used_pct
  IFS= read -r ctx_size
} <<<"$(
  echo "$input" | jq -r '
    .model.display_name // "",
    .effort.level // "",
    .context_window.remaining_percentage // "",
    .context_window.used_percentage // "",
    .context_window.context_window_size // ""' | tr -d '\r'
)"

real_ctx="$ctx_size"
if [[ "${ANTHROPIC_BASE_URL:-}" == *"localhost"* ]] && command -v ollama &>/dev/null; then
  ollama_ctx=$(ollama ps 2>/dev/null | awk 'NR>1 {print $7; exit}')
  [ -n "$ollama_ctx" ] && real_ctx="$ollama_ctx"
fi

parts=""

[ -n "$model" ] && parts="$model"

if [ -n "$effort" ]; then
  [ -n "$parts" ] && parts="$parts | $effort" || parts="$effort"
fi

if [ -n "$used_pct" ] && [ -n "$ctx_size" ]; then
  used_k=$(awk "BEGIN {printf \"%.0f\", ($used_pct/100)*$ctx_size/1000}")
  total_k=$(awk "BEGIN {printf \"%.0f\", $real_ctx/1000}")
  tokens_part="${used_k}k / ${total_k}k"
  [ -n "$parts" ] && parts="$parts | $tokens_part" || parts="$tokens_part"
fi

if [ -n "$remaining" ]; then
  rounded=$(printf '%.0f' "$remaining")
  reset=$'\033[0m'
  if [ "$rounded" -lt 15 ]; then
    ctx_part=$'\033[31m'"⚠ ${rounded}%${reset}"
  elif [ "$rounded" -lt 30 ]; then
    ctx_part=$'\033[33m'"${rounded}%${reset}"
  else
    ctx_part=$'\033[32m'"${rounded}%${reset}"
  fi
  [ -n "$parts" ] && parts="$parts | $ctx_part" || parts="$ctx_part"
fi

printf "%s" "$parts"
