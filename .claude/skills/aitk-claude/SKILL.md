---
name: aitk-claude
description: Claude Code plugin and tooling. Use for adding or modifying plugin skills, the CLAUDE.md seed, aitk claude commands, or docs/claude.md.
---

# Claude

Read `docs/claude.md` for plugin setup, skills inventory, and aitk claude CLI before editing.

## Editing rules

- When updating an internal skill, write to `{base-dir}/SKILL.md` where `{base-dir}` is the path shown in the skill header at load time.
- Read `docs/claude.md` before adding a skill. It lists all existing skills.
- Follow `standards/skill.md` for skill structure and frontmatter conventions.

## Authoring conventions

- Task skills with preview+execute patterns must execute commands immediately after the preview. Do not add a "confirm before running" step or pause for user input. Claude Code's tool permission dialog is the confirmation gate. The user hits Enter to approve or Escape to interrupt and revise.
- When a skill persists output to `.claude/` (plans, review, audits), derive a slug from the current git branch: run `git branch --show-current` and replace `/` with `-`. Fall back to `latest` on empty output (detached HEAD). Include the slug in the filename (`feature-<slug>.md`, `review-<slug>.md`, `ui-checklist-<slug>.md`, `ux-audit-<slug>.md`). This prevents collisions across parallel worktrees.

## Couplings

Before shipping any change to the seed, a plugin skill, a snippet, or a `.claude/` state doc, grep for the identifier you are changing. Check plugin skills for quoted seed section headings, workflows for snippet paths, and `docs/claude.md` for skill descriptions.

## Sync checklist

When adding a new skill:

- Create the skill folder and `SKILL.md` in `claude/skills/`
- Add the skill to the skills table in `docs/claude.md`
- Do not create a matching Gemini command or Antigravity workflow unless explicitly requested. Parity only applies when an existing counterpart changes.

When modifying a skill:

- Update the skills table in `docs/claude.md` if the description changed
- Check if a corresponding antigravity workflow exists in `antigravity/workflows/` and update it to match
- Check if a corresponding gemini command exists in `gemini/commands/` and update it to match

## Reference

- `docs/claude.md`: plugin setup, skills inventory, aitk claude CLI
- `docs/snippets.md`: snippets catalog and invocation
- `docs/indexes.md`: index.md system rationale and contracts
- `tooling/claude/reference.md`: seed layout and design notes
- `standards/skill.md`: skill structure, frontmatter, and authoring rules
