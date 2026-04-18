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

  log_step "Init sandbox"
  log_info "default     : interactive full init (prompts for optional domains)"
  log_info "with-flags  : non-interactive init with --stack, --with, --skip"

  select_or_route_scenario "Which scenario?" "default" "with-flags"

  case "$SELECTED_OPTION" in
  "default")
    log_step "Running: aitk init ."
    exec "$PROJECT_ROOT/scripts/manage-init.sh" .
    ;;
  "with-flags")
    log_step "Running: aitk init --stack base --with standards --skip wiki ."
    export AITK_NON_INTERACTIVE=1
    exec "$PROJECT_ROOT/scripts/manage-init.sh" --stack base --with standards --skip wiki .
    ;;
  *)
    log_error "Unknown scenario: $SELECTED_OPTION"
    ;;
  esac
}
