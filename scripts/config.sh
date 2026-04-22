#!/bin/bash

if [ -z "${GITHUB_ORG:-}" ]; then
  _origin_url="$(git config --get remote.origin.url 2>/dev/null || true)"
  if [ -n "$_origin_url" ]; then
    GITHUB_ORG="$(echo "$_origin_url" | sed -nE 's#^(git@github\.com:|https://github\.com/)([^/]+)/.+#\2#p')"
  fi
  unset _origin_url
fi

export GITHUB_ORG="${GITHUB_ORG:-}"
