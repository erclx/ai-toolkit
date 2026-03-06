#!/usr/bin/env bash

echo "<CURRENT_BRANCH>"
git branch --show-current 2>/dev/null || echo "NO_BRANCH"
echo "</CURRENT_BRANCH>"

echo "<REMOTE_STATUS>"
git rev-parse --verify "origin/$(git branch --show-current)" 2>/dev/null && echo "EXISTS" || echo "LOCAL_ONLY"
echo "</REMOTE_STATUS>"

echo "<COMMIT_LOG>"
git log main..HEAD --oneline 2>/dev/null || echo "NO_COMMITS"
echo "</COMMIT_LOG>"
