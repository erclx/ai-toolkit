---
name: create-skill
description: Creates a new `SKILL.md` in `.claude/skills/`. Use when asked to create a skill, add a skill, or make a new skill.
disable-model-invocation: true
---

# Create skill

Read these files from the project root in parallel:

- `.claude/standards/skill.md`: skill structure, skill types, frontmatter fields, invocation rules
- `.claude/standards/prose.md`: prose conventions for skill body text

Read a standard from `${CLAUDE_SKILL_DIR}/../../standards/` instead when the project does not have it.

## Guards

- If neither `.claude/standards/skill.md` nor `${CLAUDE_SKILL_DIR}/../../standards/skill.md` is present, stop: `❌ skill.md standard not found. Run aitk standards install first.`

## Steps

1. Draft the full `SKILL.md` from the user's description
2. Draft the sibling `REQUIREMENT.md` from what the skill is for, in the shape the standard states. Write the gaps from the user's description rather than from the drafted body, since a requirement derived from the body records whatever the draft overfitted to.
3. Confirm the skill name and both files with the user before writing
4. Write to `.claude/skills/<name>/SKILL.md` and `.claude/skills/<name>/REQUIREMENT.md`

Every skill carries a requirement. A skill created without one is a gap someone closes in a later sweep, and the sweep has to reconstruct what the skill was for from the body it already shipped.
