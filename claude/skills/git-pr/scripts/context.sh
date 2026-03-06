#!/usr/bin/env bash

echo "<REMOTE_URL>"
git remote get-url origin 2>/dev/null || echo "NO_REMOTE"
echo "</REMOTE_URL>"

echo "<CURRENT_BRANCH>"
git branch --show-current 2>/dev/null || echo "unknown"
echo "</CURRENT_BRANCH>"

echo "<COMMIT_LOG>"
git log main..HEAD --oneline 2>/dev/null || echo "NO_COMMITS"
echo "</COMMIT_LOG>"

echo "<DIFF_STATS>"
git diff main..HEAD --stat 2>/dev/null || echo "NO_STATS"
echo "</DIFF_STATS>"

echo "<GIT_DIFF>"
git diff main..HEAD -- . \
  ':(exclude)*.lock' \
  ':(exclude)*-lock.json' 2>/dev/null || echo "NO_DIFF"
echo "</GIT_DIFF>"
