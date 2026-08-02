---
name: claude-design-propose
description: Retired. `claude-design-extract` absorbed this skill and now takes the greenfield path itself. Invoke `aitk:claude-design-extract` instead.
disable-model-invocation: true
---

# Design propose

Retired. `claude-design-extract` absorbed the greenfield path, picks it from what the project has, and its description carries every trigger this skill used to route on.

Invoke `aitk:claude-design-extract` instead. It reads `.claude/REQUIREMENTS.md` for the `## Personality` paragraph and `.claude/ARCHITECTURE.md` for platform signals when the project has no UI code, which is what this skill did.

This body exists so a project that installed the plugin before the merge keeps resolving the old name for one sync cycle. It ships in `0.18.0` and is removed in `0.19.0`.

`scripts/sandbox/claude/design-propose.sh` goes at the same time, but its fixture does not. That scenario is the only greenfield coverage the survivor has, so `0.19.0` folds it into `scripts/sandbox/claude/design-extract.sh` as a second arm rather than deleting it. Removing the file outright drops the greenfield path from the catalog.
