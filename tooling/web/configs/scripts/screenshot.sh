#!/usr/bin/env bash
set -euo pipefail

: "${PREVIEW_PORT:=4173}"

if curl -sSf "http://localhost:$PREVIEW_PORT/" >/dev/null 2>&1; then
  echo "Port $PREVIEW_PORT already in use. Stop the listening process or set PREVIEW_PORT." >&2
  exit 1
fi

bun run build
bun run preview &
PREVIEW_PID=$!
trap 'kill "$PREVIEW_PID" 2>/dev/null || true' EXIT

for _ in $(seq 1 40); do
  if curl -sSf "http://localhost:$PREVIEW_PORT/" >/dev/null 2>&1; then
    break
  fi
  sleep 0.25
done

SCREENSHOT_BASE_URL="http://localhost:$PREVIEW_PORT" node --experimental-strip-types e2e/screenshot.ts
