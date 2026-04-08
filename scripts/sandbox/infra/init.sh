#!/bin/bash
set -e
set -o pipefail

source "$PROJECT_ROOT/scripts/lib/inject.sh"

use_config() {
  export SANDBOX_SKIP_AUTO_COMMIT="true"
  export SANDBOX_INJECT_GOV="true"
}

stage_setup() {
  cat <<'EOF' >package.json
{
  "name": "sandbox-init-infra",
  "version": "1.0.0",
  "private": true,
  "type": "module"
}
EOF

  mkdir -p scripts
  cat <<'SCRIPT' >scripts/placeholder.sh
#!/bin/bash
echo "placeholder"
SCRIPT
  chmod +x scripts/placeholder.sh

  git add .
  git commit -m "chore(sandbox): scaffold init infra test directory" --no-verify -q

  log_step "Running: aitk init"
  exec "$PROJECT_ROOT/scripts/manage-init.sh" .
}
