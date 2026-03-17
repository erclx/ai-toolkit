---
name: aitk-claude
description: Claude Code plugin and tooling. Use for adding or modifying plugin skills, aitk claude commands, or docs/claude.md.
---

# Claude

## Plugin skills

- Plugin skills live in `claude/skills/` and are auto-discovered when Claude Code loads with `--plugin-dir`. No registration needed, folder presence is enough.
- Each skill is a folder named in kebab-case containing `SKILL.md`.
- Read `docs/claude.md` before adding a skill. It lists all existing skills.
- Follow `standards/skill.md` for skill structure and frontmatter conventions.

## Sync checklist

When adding a new skill:

- Create the skill folder and `SKILL.md` in `claude/skills/`
- Add the skill to the skills table in `docs/claude.md`

When modifying a skill:

- Update the skills table in `docs/claude.md` if the description changed

## Full reference

- `docs/claude.md`: plugin setup, skills inventory, aitk claude CLI
- `standards/skill.md`: skill structure, frontmatter, and authoring rules
