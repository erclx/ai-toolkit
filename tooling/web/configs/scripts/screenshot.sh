#!/usr/bin/env bash
set -euo pipefail

: "${PREVIEW_PORT:=4173}"

if curl -sSf "http://localhost:$PREVIEW_PORT/" >/dev/null 2>&1; then
  echo "Port $PREVIEW_PORT already in use. Stop the listening process or set PREVIEW_PORT." >&2
  exit 1
fi

bun run build
bun run preview >/dev/null 2>&1 &
PREVIEW_PID=$!
# shellcheck disable=SC2154 # pid is bound by the for loop inside the single-quoted trap body, which shellcheck does not track there
trap 'kill "$PREVIEW_PID" 2>/dev/null || true; for pid in $(lsof -ti tcp:"$PREVIEW_PORT" 2>/dev/null); do kill "$pid" 2>/dev/null || true; done; wait "$PREVIEW_PID" 2>/dev/null || true' EXIT

for _ in $(seq 1 40); do
  if curl -sSf "http://localhost:$PREVIEW_PORT/" >/dev/null 2>&1; then
    break
  fi
  sleep 0.25
done

if ! curl -sSf "http://localhost:$PREVIEW_PORT/" >/dev/null 2>&1; then
  echo "Preview server not responding on port $PREVIEW_PORT after 10s." >&2
  exit 1
fi

SCREENSHOT_BASE_URL="http://localhost:$PREVIEW_PORT" bun e2e/screenshot.ts
