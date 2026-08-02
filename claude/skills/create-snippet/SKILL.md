---
name: create-snippet
description: Retired. `create-standard` absorbed this skill and writes snippets as well as standards. Invoke `aitk:create-standard` instead.
disable-model-invocation: true
---

# Create snippet

Retired. `create-standard` absorbed the snippet surface, resolves `snippets/` or `.claude/snippets/` the same way it resolves the standards folders, and its description carries every trigger this skill used to route on.

Invoke `aitk:create-standard` instead and ask for a snippet. The name understates what the skill covers, which is why its description names both surfaces.

This body exists so a project that installed the plugin before the merge keeps resolving the old name for one sync cycle. It ships in `0.18.0` and is removed in `0.19.0`.
