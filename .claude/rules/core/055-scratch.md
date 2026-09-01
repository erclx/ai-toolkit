---
description: Write temporary files to the scratch folder structure
---

# Scratch standards

## Temporary files

- Write temporary files to `.canon/tmp/<slug>/<file>.md` in the project root, a nested `<slug>/` folder with a kebab-slug tied to the topic, not a flat `<slug>-<file>.md`. The scratch-guard hook enforces the location.
- Write to `.claude/.tmp/<slug>/` instead in a project that carries no `.canon/` root, which is one the record move has not reached. The hook accepts either, and `canon migrate records` is what moves a project from the first spelling to the second. <!-- canon-keep-record-root -->
