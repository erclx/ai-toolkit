---
name: create-skill
description: Creates a new `SKILL.md` in `.claude/skills/`. Use when asked to create a skill, add a skill, or make a new skill.
disable-model-invocation: true
---

# Create skill

Read these files from the project root in parallel:

- `.claude/standards/skill.md`: skill structure, skill types, frontmatter fields, invocation rules
- `.claude/standards/prose.md`: prose conventions for skill body text

## Guards

- If `.claude/standards/skill.md` is not present, stop: `❌ .claude/standards/skill.md not found. Run aitk standards install first.`

## Steps

1. Draft the full `SKILL.md` from the user's description
2. Confirm the skill name and full content with the user before writing
3. Write to `.claude/skills/<name>/SKILL.md`
