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
- Cite a standard in the form its carrier resolves. The corpus has no consumed copy, so no single spelling answers on every surface.
- Cite `${CLAUDE_SKILL_DIR}/../../standards/<name>.md` from a body under `claude/`, which resolves off the `claude/standards` symlink in every plugin cache.
- Call `canon standards <name>` from a rule or a seed. Both are read with no skill context, so `${CLAUDE_SKILL_DIR}` expands to nothing there.
- Cite `standards/<name>.md` from a file that stays in this repository, which is the working root the resolver reads first.

## Before shipping

- Run `scripts/core/check-plugin-boundary.sh` on a change under `claude/`. It fails on any shipped file resolving under `internal/`.
