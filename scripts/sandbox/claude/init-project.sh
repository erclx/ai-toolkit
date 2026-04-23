#!/bin/bash
set -e
set -o pipefail

use_config() {
  export SANDBOX_SKIP_AUTO_COMMIT="true"
}

stage_setup() {
  select_or_route_scenario "Which scenario?" "fresh" "vite-react" "astro"

  case "$SELECTED_OPTION" in
  "fresh")
    cat <<'EOF' >package.json
{
  "name": "sandbox-fresh",
  "version": "1.0.0",
  "private": true,
  "type": "module"
}
EOF

    git add . && git commit -m "chore(sandbox): fresh empty project" --no-verify -q

    log_step "Scenario ready: init-project skill on an empty repo"
    log_info "Context: package.json only, no framework evidence"
    log_info "Action:  /toolkit:init-project"
    log_info "Expect:  stack resolves to 'base' (fallback), aitk init runs and auto-builds .claude/GOV.md, tooling sync is skipped (tooling stack also 'base' = already synced), verify-scaffold finds no stack scripts and reports base scripts only"
    ;;
  "vite-react")
    log_step "Running bun create vite"
    bun create vite@latest _tmp_vite --template react-ts >/dev/null 2>&1
    rm -rf _tmp_vite/.git
    (
      shopt -s dotglob
      mv _tmp_vite/* .
    )
    rmdir _tmp_vite

    git add . && git commit -m "chore(sandbox): vite + react scaffold via bun create vite" --no-verify -q

    log_step "Scenario ready: init-project skill on a Vite + React project"
    log_info "Context: real bunx create-vite output (index.html, public/, src/App.tsx, src/index.css)"
    log_info "Action:  /toolkit:init-project"
    log_info "Expect:  governance stack 'react', tooling stack 'vite-react', aitk init builds .claude/GOV.md, tooling sync drops golden configs from tooling/web and tooling/vite-react, verify-scaffold runs lint/typecheck/check/test/build"
    ;;
  "astro")
    log_step "Running bun create astro"
    bun create astro@latest _tmp_astro -- --template minimal --typescript strict --no-install --no-git --skip-houston --yes >/dev/null 2>&1
    rm -rf _tmp_astro/.git
    (
      shopt -s dotglob
      mv _tmp_astro/* .
    )
    rmdir _tmp_astro

    git add . && git commit -m "chore(sandbox): astro scaffold via bun create astro" --no-verify -q

    log_step "Scenario ready: init-project skill on an Astro project"
    log_info "Context: real bunx create-astro output (src/pages, astro.config.mjs, tsconfig.json)"
    log_info "Action:  /toolkit:init-project"
    log_info "Expect:  governance stack 'astro', tooling stack 'astro', aitk init builds .claude/GOV.md, tooling sync drops golden configs from tooling/web and tooling/astro, verify-scaffold runs lint/typecheck/check/test/build"
    ;;
  *)
    log_error "Unknown scenario: $SELECTED_OPTION"
    ;;
  esac
}
