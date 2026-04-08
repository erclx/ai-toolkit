---
name: aitk-antigravity
description: Antigravity workflow source. Use for editing antigravity/workflows/, workflows.toml, or standards/antigravity.md.
---

# Antigravity workflows

## Scope

- `antigravity/workflows/`: source workflows shipped to target projects
- `antigravity/workflows.toml`: group manifest (git, docs, review)
- `standards/antigravity.md`: conventions for writing and structuring workflows

## Rules

- Follow `standards/antigravity.md` for all workflow authoring
- Only add workflows that are useful in any project. Toolkit-specific operations don't belong here.
- Keep `workflows.toml` groups coherent. Add new workflows to the right group.
- When modifying a workflow, check if a corresponding plugin skill exists in `claude/skills/` or gemini command in `gemini/commands/` and update it to match.

## When adding a workflow

1. Create the `.md` file in `antigravity/workflows/` following `standards/antigravity.md`
2. Add the filename to the appropriate group in `antigravity/workflows.toml`

No other registration is needed.

## Full reference

- `standards/antigravity.md`: workflow authoring conventions
- `antigravity/workflows.toml`: group definitions
