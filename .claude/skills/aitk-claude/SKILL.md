---
name: aitk-claude
description: Claude Code plugin and tooling. Use for adding or modifying plugin skills, the `CLAUDE.md` seed, `aitk claude` commands, or the Claude context entries.
---

# Claude

Read `.claude/context/claude-plugin/` for the shipped plugin, starting at its `index.md`, and `.claude/context/claude-internal.md` for internal skills and plugin setup, before editing. The plugin folder splits into `skills.md` for the catalog and strategy, `distribution.md` for the marketplace and release wiring, `cli.md` for `aitk claude`, and `boundaries.md` for built-in feature overlap.

## Editing rules

- When updating an internal skill, write to `{base-dir}/SKILL.md` where `{base-dir}` is the path shown in the skill header at load time.
- Read `.claude/context/claude-plugin/skills.md` before adding a plugin skill and `.claude/context/claude-internal.md` before adding an internal one. Each lists its existing skills.
- Follow `.claude/standards/skill.md` for skill structure and frontmatter conventions.
- Audit skill bodies against both `.claude/standards/skill.md` and `.claude/standards/prose.md`. The first covers structure and frontmatter. The second covers the body.

## Authoring conventions

- Write a new skill only when it encodes workflow specific to this toolkit or a convention the author consistently applies. The test: would this same skill be invoked on every target project the author owns?
- Install a community skill rather than writing one when the need is domain expertise the toolkit does not maintain, such as frontend design, security audits, or stack-specific patterns. Reference it in per-tier install recommendations rather than absorbing it.
- Do not fork a community skill. Propose a thin toolkit wrapper that composes the upstream one, and fork only when upstream diverges hard from a stated need and the maintenance cost is accepted explicitly. See Skill strategy in `.claude/context/claude-plugin/skills.md` for the reasoning and the redundancy audit.
- Task skills with preview+execute patterns must execute commands immediately after the preview. Do not add a "confirm before running" step or pause for user input. Claude Code's tool permission dialog is the confirmation gate. The user hits Enter to approve or Escape to interrupt and revise.
- When a skill persists output to `.claude/` (plans, review, audits), follow `.claude/standards/slug.md`. Cite that standard from the skill body and state which empty-case the skill takes, rather than restating the derivation.
- Never reference a repo-local path such as `wiki/` from a file under `claude/skills/`. It resolves to nothing in a target project, and the Skill paths stage of `bun run check` fails on it.
- Reach supporting prose from a shipped skill through an `aitk docs <topic>` command, a bundled reference copied in by a `consumers:` frontmatter field, or text inlined in the skill body.
- Plugin skills under `claude/skills/` do not use the `aitk-*` prefix. That prefix is reserved for internal skills under `.claude/skills/`. If a plan suggests `aitk-*` for a plugin skill, flag the mismatch before creating the folder.
- When handing off a plugin skill test from a linked worktree, print the two-line invocation block: `cd` to the sandbox path, then `claude --plugin-dir <worktree-root>/claude --model sonnet`. Without `--plugin-dir`, Claude loads main's stale copy. Default to `--model sonnet` for skill testing.
- For unconditional pre-push or per-edit automation (formatters, audits, scaffold checks), propose a husky hook instead of a CLAUDE.md or skill bullet. CLAUDE.md only fires when Claude is acting. A hook fires for everyone.
- When extending PostToolUse hooks (`standards-audit` and similar), ship punctuation bans and closed-set wordlists, reading the list out of the standard at runtime rather than hardcoding a second copy. Defer structural checks such as negative parallelism, hollow openers, and paragraph length to the end-of-cycle `claude-standards-audit` skill, since regex detection on those fires against legitimate prose. State the two-layer split when proposing hook scope changes.
- Default cross-project Claude behavior rules (output formatting, path-printing, etc.) to the seeded `CLAUDE.md` plus the toolkit's own `CLAUDE.md`. Reserve `~/.claude/` for environment-specific config (terminal capability, machine specifics).

## Couplings

Before shipping any change to the seed, a plugin skill, a snippet, or a `.claude/` state doc, grep for the identifier you are changing. Check plugin skills for quoted seed section headings, workflows for snippet paths, and the Claude context entries for skill descriptions.

When editing any file under `.claude/` in this repo, also check `tooling/claude/seeds/` for a mirror path and `tooling/claude/reference.md` for a description that needs updating.

## Sync checklist

When adding a new skill:

- Create the skill folder and `SKILL.md` in `claude/skills/`
- Add the skill to the skills catalog in `.claude/context/claude-plugin/skills.md`, or the table in `.claude/context/claude-internal.md` for an internal skill. The plugin catalog is a bullet list rather than a table, so add one line and leave the rest untouched.
- Draft a `scripts/sandbox/<category>/<skill>.sh` scenario alongside `SKILL.md`, even when the skill's output is judgment-driven. The deterministic seeded input is the point. Exception: skills whose body explicitly forbids probing, listing, grepping, or reading project surfaces have nothing for a seeded sandbox to anchor against. Skip the scenario for these and do not list it as a follow-up.
- Claude sandboxes provision fixture state only. The user runs `claude` from the scenario directory and invokes the skill manually. "Sandbox cannot drive Claude" is not a reason to skip one, because driving is not its job.

When modifying a skill:

- Read the skill's sibling `REQUIREMENT.md` first when one exists. If the change closes no gap it states, change the requirement first or drop the change.
- Update the matching entry in `.claude/context/claude-plugin/skills.md` or `.claude/context/claude-internal.md` if the description changed
- Check if a corresponding sandbox scenario exists in `scripts/sandbox/` and update it if the skill's behavior changed
- Run `/aitk-sandbox-check` before shipping to audit which skills changed without a paired scenario edit

When modifying the CLAUDE.md seed:

- Check the root `CLAUDE.md` for drift. Rules that govern both target projects and the toolkit itself should stay mirrored.
- The seed's "Context" section defines the three-tier context model (always-loaded / path-scoped lazy / on-demand lookup at `.claude/context/`). Keep the section coherent with the same model in `.claude/context/context-model.md`.

When modifying the root CLAUDE.md:

- Check `tooling/claude/seeds/CLAUDE.md` for a mirror. Project-agnostic rules like behavior, scope discipline, worktree gotchas, and scratch structure belong in both. Toolkit-specific rules like the domain skill table, wiki policy, and tool-agnosticism stay at root only.

## Reference

- `.claude/context/claude-plugin/`: plugin skills catalog and strategy, distribution and release, aitk claude CLI, built-in feature overlap
- `.claude/context/claude-internal.md`: internal skills, orchestration, plugin discovery
- `.claude/context/context-model.md`: three-tier context model and how entries get populated
- `.claude/context/snippets.md`: snippets catalog and invocation
- `.claude/context/indexes.md`: index.md system rationale and contracts
- `tooling/claude/reference.md`: seed layout and design notes
- `.claude/standards/skill.md`: skill structure, frontmatter, and authoring rules
