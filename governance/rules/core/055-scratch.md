---
description: Write temporary files to the scratch folder structure
---

# Scratch standards

## Temporary files

- Write temporary files to `.claude/.tmp/<slug>/<file>.md` in the project root, a nested `<slug>/` folder with a kebab-slug tied to the topic, not a flat `<slug>-<file>.md`. The scratch-guard hook enforces the location.
