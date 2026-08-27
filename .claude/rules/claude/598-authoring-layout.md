---
description: Enforce where toolkit content is authored and which copy a rule, skill, or seed cites
paths:
  - 'internal/**'
  - 'standards/**'
  - 'snippets/**'
  - 'claude/**'
  - 'governance/rules/**'
---

# Authoring layout standards

## Where to author

- Author toolkit-internal content under `internal/`, never inside an installable surface.
- Author standards at `standards/` and snippets at `snippets/`, both at the project root.
- Author a toolkit-only rule at `internal/rules/` and a rule that ships to targets at `governance/rules/`.

## Which copy to edit and cite

- Edit the authoring root, never the consumed copy under `.claude/`. Regenerate that copy with `bun run check`.
- Cite `.claude/standards/X.md` from a rule, skill, or seed. Cite `aitk standards <name>` from anything a target reads. <!-- audit-ignore-citations -->

## Before shipping

- Run `scripts/core/check-plugin-boundary.sh` on a change under `claude/`. It fails on any shipped file resolving under `internal/`.
