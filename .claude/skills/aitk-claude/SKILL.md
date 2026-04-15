---
name: aitk-claude
description: Claude Code plugin and tooling. Use for adding or modifying plugin skills, aitk claude commands, or docs/claude.md.
---

# Claude

## Internal skills

- Internal skills live in `.claude/skills/` and are toolkit-only, not installed into target projects.
- Each skill is a folder named in kebab-case containing `SKILL.md`.
- Internal skill names must use the `aitk-` prefix (e.g., `aitk-claude`, `aitk-session-resume`).
- When updating an internal skill, write to `{base-dir}/SKILL.md` where `{base-dir}` is the path shown in the skill header at load time.

## Plugin skills

- Plugin skills live in `claude/skills/` and are auto-discovered when Claude Code loads with `--plugin-dir`. No registration needed, folder presence is enough.
- Each skill is a folder named in kebab-case containing `SKILL.md`.
- Read `docs/claude.md` before adding a skill. It lists all existing skills.
- Follow `standards/skill.md` for skill structure and frontmatter conventions.

## Authoring conventions

- Task skills with preview+execute patterns must execute commands immediately after the preview. Do not add a "confirm before running" step or pause for user input. Claude Code's tool permission dialog is the confirmation gate. The user hits Enter to approve or Escape to interrupt and revise.

## Sync checklist

When adding a new skill:

- Create the skill folder and `SKILL.md` in `claude/skills/`
- Add the skill to the skills table in `docs/claude.md`
- Do not create a matching Gemini command or Antigravity workflow unless explicitly requested. Parity only applies when an existing counterpart changes.

When modifying a skill:

- Update the skills table in `docs/claude.md` if the description changed
- Check if a corresponding antigravity workflow exists in `antigravity/workflows/` and update it to match
- Check if a corresponding gemini command exists in `gemini/commands/` and update it to match

## Full reference

- `docs/claude.md`: plugin setup, skills inventory, aitk claude CLI
- `standards/skill.md`: skill structure, frontmatter, and authoring rules
