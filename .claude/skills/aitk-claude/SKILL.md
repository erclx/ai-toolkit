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
- Audit skill bodies against both `standards/skill.md` and `standards/prose.md`. The first covers structure and frontmatter. The second covers the body.

## Authoring conventions

- Task skills with preview+execute patterns must execute commands immediately after the preview. Do not add a "confirm before running" step or pause for user input. Claude Code's tool permission dialog is the confirmation gate. The user hits Enter to approve or Escape to interrupt and revise.
- When a skill persists output to `.claude/` (plans, review, audits), derive a slug from the current git branch: run `git branch --show-current` and replace `/` with `-`. Fall back to `latest` on empty output (detached HEAD). Include the slug in the filename (`feature-<slug>.md`, `review-<slug>.md`, `ui-checklist-<slug>.md`, `ux-audit-<slug>.md`). This prevents collisions across parallel worktrees.
- Plugin skills under `claude/skills/` do not use the `aitk-*` prefix. That prefix is reserved for internal skills under `.claude/skills/`. If a plan suggests `aitk-*` for a plugin skill, flag the mismatch before creating the folder.
- When handing off a plugin skill test from a linked worktree, print the two-line invocation block: `cd` to the sandbox path, then `claude --plugin-dir <worktree-root>/claude --model sonnet`. Without `--plugin-dir`, Claude loads main's stale copy. Default to `--model sonnet` for skill testing.

## Couplings

Before shipping any change to the seed, a plugin skill, a snippet, or a `.claude/` state doc, grep for the identifier you are changing. Check plugin skills for quoted seed section headings, workflows for snippet paths, and `docs/claude.md` for skill descriptions.

When editing any file under `.claude/` in this repo, also check `tooling/claude/seeds/` for a mirror path and `tooling/claude/reference.md` for a description that needs updating.

## Sync checklist

When adding a new skill:

- Create the skill folder and `SKILL.md` in `claude/skills/`
- Add the skill to the skills table in `docs/claude.md`
- Draft a `scripts/sandbox/<category>/<skill>.sh` scenario alongside `SKILL.md`, even when the skill's output is judgment-driven. The deterministic seeded input is the point.
- Claude sandboxes provision fixture state only. The user runs `claude` from the scenario directory and invokes the skill manually. "Sandbox cannot drive Claude" is not a reason to skip one, because driving is not its job.
- Do not create a matching Gemini command unless explicitly requested. Parity only applies when an existing counterpart changes. Never create a new Antigravity workflow, the surface is frozen.

When modifying a skill:

- Update the skills table in `docs/claude.md` if the description changed
- Check if a corresponding gemini command exists in `gemini/commands/` and update it to match
- Check if a corresponding sandbox scenario exists in `scripts/sandbox/` and update it if the skill's behavior changed
- Run `/skill-sandbox-check` before shipping to audit which skills changed without a paired scenario edit
- Antigravity workflows are frozen, so do not propagate changes there

When modifying the CLAUDE.md seed:

- Check the root `CLAUDE.md` for drift. Rules that govern both target projects and the toolkit itself should stay mirrored.

When modifying the root CLAUDE.md:

- Check `tooling/claude/seeds/CLAUDE.md` for a mirror. Project-agnostic rules like behavior, scope discipline, worktree gotchas, and scratch structure belong in both. Toolkit-specific rules like the domain skill table, wiki policy, and tool-agnosticism stay at root only.

## Reference

- `docs/claude.md`: plugin setup, skills inventory, aitk claude CLI
- `docs/snippets.md`: snippets catalog and invocation
- `docs/indexes.md`: index.md system rationale and contracts
- `tooling/claude/reference.md`: seed layout and design notes
- `standards/skill.md`: skill structure, frontmatter, and authoring rules
