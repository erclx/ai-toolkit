---
description: State the regenerate-then-capture-then-commit obligation for assets/*.html.tmpl and its generation script
paths:
  - 'assets/*.html.tmpl'
  - 'scripts/core/regen-hero.sh'
---

# Showcase asset standards

## Regenerating a frame

- After editing a template or the generation script, run `scripts/core/regen-hero.sh`, then rebuild every image with `canon capture` (see `canon docs capture`), and commit the markup, the PNG, and the stamp together. A stamp recording a source digest the committed markup does not match fails the drift gate.
- Add a new frame as a file directly under `assets/`, named `showcase-<slug>`. A subfolder is skipped silently by the generation script, the capture command, and the drift gate alike.

## Capture source

- A capture source lives under `assets/` today. `captureBases` globs `assets/*.html` and reads no other folder, so a page rendered from anywhere else has no route to a gated capture.
