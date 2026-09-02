#!/usr/bin/env bash
set -e
set -o pipefail

use_config() {
  export SANDBOX_SKIP_AUTO_COMMIT="true"
  export SANDBOX_INJECT_SEEDS="true"
}

stage_setup() {
  cat <<'EOF' >package.json
{
  "name": "sandbox-draft-and-pick",
  "version": "1.0.0",
  "private": true,
  "type": "module"
}
EOF

  # The page carries one unresolved treatment and nothing else worth deciding,
  # so a run has one subject to draft arms against. The callout ships flat, which
  # is arm 0 for any candidate set drawn off this page.
  cat <<'EOF' >index.html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Release notes</title>
    <style>
      body {
        font: 16px/1.5 system-ui, sans-serif;
        margin: 0 auto;
        max-width: 40rem;
        padding: 3rem 1rem;
      }
      .callout {
        background: #f4f4f5;
        padding: 1rem;
      }
    </style>
  </head>
  <body>
    <h1>Release notes</h1>
    <p>Every change since the last tag, grouped by the surface it reaches.</p>
    <div class="callout">
      <p>Upgrading from 3.x needs one manual step. Read the migration note first.</p>
    </div>
    <p>Nothing else on this page has an unresolved treatment.</p>
  </body>
</html>
EOF

  mkdir -p .claude
  cat <<'EOF' >.claude/DESIGN.md
---
title: Design
description: Tokens, typography, and the treatments still unresolved
---

# Design

## Tokens

- Ground: `#ffffff`
- Ink: `#18181b`
- Muted ground: `#f4f4f5`

## Unresolved

The callout on `index.html` reads as a flat grey block and carries no signal
that it is a warning rather than an aside. How it should separate from the
prose around it is undecided, and the decision is taste rather than
correctness: a border, a ground shift, and a rule down one edge are all
defensible and nobody has looked at them side by side.
EOF

  git add . && git commit -m "feat(page): release notes with an undecided callout treatment" --no-verify -q

  log_step "Scenario ready: a stated visual decision on a browser-free machine"
  log_info "Context: index.html carries one flat callout, and .claude/DESIGN.md states the"
  log_info "         treatment as undecided between a border, a ground shift, and an edge rule"
  log_info "Browser: none. Nothing here installs a browser binary and a sandbox cannot fetch one,"
  log_info "         so canon capture refuses and the honest-degradation path is what runs."
  log_info "Action:  /canon:draft-and-pick draft candidates for the callout treatment on index.html, and take arm 2 when you put the pick to me"
  log_info "Expect:  a candidate set authored to .canon/tmp/<slug>/candidates.html carrying"
  log_info "         every arm on one page with its id and its cost, index.html untouched,"
  log_info "         and the render refusal reported naming bunx playwright install chromium"
  log_info "         rather than a description of arms nobody has seen"
  log_info "Not reached: the pick and the loop. Both sit behind the render, so the pre-supplied"
  log_info "         answer in the prompt is never asked for and those claims stay manual."
}
