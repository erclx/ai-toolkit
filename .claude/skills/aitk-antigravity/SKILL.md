---
name: aitk-antigravity
description: Antigravity workflow source. Use for editing antigravity/workflows/, workflows.toml, or prompts/antigravity-workflow.md.
---

# Antigravity workflows

Read `docs/antigravity.md` for system overview and workflow structure before editing.

## Rules

- Follow `prompts/antigravity-workflow.md` for all workflow authoring.
- Only add workflows that are useful in any project. Toolkit-specific operations don't belong here.
- Keep `workflows.toml` groups coherent. Add new workflows to the right group.
- When modifying a workflow, check if a corresponding plugin skill exists in `claude/skills/` or gemini command in `gemini/commands/` and update it to match.

## When adding a workflow

1. Create the `.md` file in `antigravity/workflows/` following `prompts/antigravity-workflow.md`
2. Add the filename to the appropriate group in `antigravity/workflows.toml`

## Reference

- `prompts/antigravity-workflow.md`: workflow authoring conventions
- `antigravity/workflows.toml`: group definitions
