#!/bin/bash

EXPECTED_PATTERN="^(fix|refactor|perf|chore|feat)(\(.*\))?: .+"

stage_setup() {
export GEMINI_SKIP_AUTO_COMMIT="true"

git init -q
git config user.email "architect@erclx.com"
git config user.name "Senior Architect"

echo 'export const MAX_CONNECTIONS = "5";' > config.js
git add . && git commit -m "feat(git): initial config" -q

echo 'export const MAX_CONNECTIONS = 5;' > config.js
git add config.js
}
