---
description: State the regenerate-then-capture-then-commit obligation for assets/captures/*.html.tmpl and its generation script
paths:
  - 'assets/captures/*.html.tmpl'
  - 'scripts/core/regen-hero.sh'
---

# Showcase asset standards

## Regenerating a frame

- After editing a template or the generation script, run `scripts/core/regen-hero.sh`, then rebuild every image with `canon capture` (see `canon docs capture`), and commit the markup, the PNG, and the stamp together. A stamp recording a source digest the committed markup does not match fails the drift gate.
- Add a new frame as a template directly under `assets/captures/`, named for the frame alone. A folder of its own is skipped silently by the generation script, the capture command, and the drift gate alike, so the nesting stops at that one level.

## Capture source

- A capture source lives under `assets/captures/` and the image it renders to lives in `assets/`. `captureBases` globs `assets/captures/*.html` and reads no other folder, so a page rendered from anywhere else has no route to a gated capture, and `readCaptureSet` looks for the `.png` and the `.stamp` in `assets/` rather than beside the markup.
