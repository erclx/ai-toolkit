---
name: create-skill
description: Creates a new `SKILL.md` in `.claude/skills/`. Use when asked to create a skill, add a skill, or make a new skill.
disable-model-invocation: true
---

# Create skill

Read these files in parallel:

- `${CLAUDE_SKILL_DIR}/../../standards/skill.md`: skill structure, skill types, frontmatter fields, invocation rules
- `${CLAUDE_SKILL_DIR}/../../standards/markdown.md`: banned words, punctuation, and formatting for skill body text
- The `write-human` skill: voice, rhythm, and sentence construction for skill body text

## Guards

- If `${CLAUDE_SKILL_DIR}/../../standards/skill.md` is not present, stop: `❌ skill.md standard not found. Reinstall the aitk plugin.`

## Steps

1. Draft the full `SKILL.md` from the user's description
2. Draft the sibling `REQUIREMENT.md` from what the skill is for, in the shape the standard states. Write the gaps from the user's description rather than from the drafted body, since a requirement derived from the body records whatever the draft overfitted to.
3. Confirm the skill name and both files with the user before writing
4. Write to `.claude/skills/<name>/SKILL.md` and `.claude/skills/<name>/REQUIREMENT.md`

Every skill carries a requirement. A skill created without one is a gap someone closes in a later sweep, and the sweep has to reconstruct what the skill was for from the body it already shipped.
