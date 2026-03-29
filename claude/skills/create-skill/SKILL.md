---
name: create-skill
description: Creates a new SKILL.md in .claude/skills/. Use when asked to create a skill, add a skill, or make a new skill.
disable-model-invocation: true
---

# Create skill

Read these files from the project root in parallel:

- `standards/skill.md`: skill structure, frontmatter fields, invocation rules
- `standards/prose.md`: prose conventions for skill body text

If `prompts/claude-skill.md` is present, read it for additional guidance on skill types and output format templates.

## Guards

- If `standards/skill.md` is not present, stop: `❌ standards/skill.md not found. Run aitk standards install first.`

## Steps

1. Draft the full `SKILL.md` from the user's description
2. Confirm the skill name and full content with the user before writing
3. Write to `.claude/skills/<name>/SKILL.md`
