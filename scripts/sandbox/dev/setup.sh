#!/bin/bash
set -e
set -o pipefail

stage_setup() {
  export GEMINI_SKIP_AUTO_COMMIT="true"

  cat <<'EOF' >.shellcheckrc
external-sources=true
EOF

  cat <<'EOF' >commitlint.config.js
export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'header-max-length': [2, 'always', 72],
    'scope-case': [2, 'always', 'lower-case'],
    'subject-full-stop': [2, 'never', '.'],
    'subject-case': [0]
  }
};
EOF

  cat <<'EOF' >.prettierrc
{
  "semi": true,
  "singleQuote": false
}
EOF

  cat <<'EOF' >package.json
{
  "name": "sandbox-tooling",
  "version": "1.0.0",
  "scripts": {
    "format": "prettier --write ."
  }
}
EOF

  mkdir -p scripts
  cat <<'EOF' >scripts/verify.sh
#!/bin/bash
set -e
set -o pipefail

echo "1. Formatting"
bun run format
EOF

  chmod +x scripts/verify.sh

  git add .
  git commit -m "chore(tooling): init mixed state project" -q

  log_step "SCENARIO READY: Tooling Config Audit"
  log_info "Context: Project contains compliant (SKIP), drifted (UPDATE), and missing (CREATE) configs."
  log_info "Action:  gemini dev:setup standards/tooling.md"
  log_info "Expect:  Agent audits state, applies corrections, scaffolds missing files, and suggests commit."
}
