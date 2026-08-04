---
title: Skill strategy
description: Where a plugin skill lives, the catalog command, the workflow against domain-knowledge split, and the redundancy audit
---

# Skill strategy

Plugin skills live in `claude/skills/` and are auto-discovered from the plugin root, whether that root is a marketplace install or a `--plugin-dir` pointed at a checkout. No registration needed, folder presence is enough. Each skill is a kebab-case folder containing `SKILL.md`.

Skills that perform a one-time structural move of an existing project into a newer toolkit layout use the `migration-*` prefix (`migration-claude-md`, `migration-context`, `migration-standards`). Add new one-shot relocations to this family. Recurring reconciliation tools like `claude-seed-sync` are not migrations and stay outside it.

## The catalog

`aitk claude skills list` is the catalog. It reports every folder under `claude/skills/`, `--names` emits those names one per line for a shell caller, and `aitk claude skills list --json` returns the set as objects carrying `name`, `description`, and `requirement`. A session looking for which skills exist runs the first, and one looking for what a skill claims to do runs the third.

These entries hold the reasons instead: why a skill exists, where its boundary against a sibling sits, and what a coverage verdict turned on. None of that is recoverable from a listing, and the roster is recoverable from nothing else.

A hand-written copy of the roster stood here and drifted the way `.claude/standards/context.md` predicts, describing two skills the plugin had already stopped shipping. That standard puts a catalog a `list` command already returns under what does not go in, and says to link the command so the entry cannot drift from it.

## Workflow skills and domain-knowledge skills

Skills split into two categories by function. The toolkit owns the first and installs the second, and mixing them is the most common source of skill bloat and maintenance drag.

Workflow skills wrap how this toolkit operates: groundwork, planning, review, shipping, debugging, git, and governance install. They are thin, opinionated, and specific to the author's process. Domain-knowledge skills encode expertise curated over many hours, such as frontend design anti-patterns, security audit patterns, and industry-specific UI rules. The wider ecosystem supplies those as `frontend-design`, `impeccable`, `ui-ux-pro-max`, `taste-skill`, and `trailofbits/skills`. Curation is the whole value of the second kind, so forking one means inheriting the cost of maintaining that curation against an upstream that keeps moving.

| Location                         | Purpose                                                | Scope  |
| -------------------------------- | ------------------------------------------------------ | ------ |
| `claude/skills/`                 | Workflow skills, installable into target projects      | Shared |
| `.claude/skills/`                | Toolkit-internal authoring skills, the `aitk-*` family | Local  |
| Target project `.claude/skills/` | Per-project customization not worth upstreaming        | Local  |
| `~/.claude/skills/`              | Global user skills active across every session         | User   |
| Plugin marketplace               | Community and official plugins installed via `/plugin` | User   |

Which location is right follows from who benefits. A commit style specific to one project stays in that project's `.claude/skills/`. A commit skill the author uses everywhere goes in `claude/skills/`. A frontend design anti-pattern skill maintained by a third party stays a plugin install. Forking has not been necessary in practice, and when one looks tempting a thin toolkit wrapper composing the upstream skill has met the need instead.

The rules this argument produces fire when a skill is being written, so they live in `.claude/skills/aitk-claude/SKILL.md` rather than here.

## What a skill carries

A file a skill body cites has to arrive by the channel the skill itself travels on. Skills load live from the plugin root while standards, snippets, and governance rules are copied by an `aitk` command, so a body naming an installed path is a dependency crossing that boundary and resolves only for a project that ran the matching install. Nothing reports the break, because an unresolved path produces no error until a session opens it.

The three orchestrator runbooks settled the rule. They were snippets cited by `claude-orchestrate` as `@.claude/snippets/claude/<name>.md`, and they now sit in that skill's `references/` cited with `${CLAUDE_SKILL_DIR}`, which resolves from any working directory in any target. `claude-groundwork` had reached the same shape earlier with `folder-format.md`. What this narrows to is a test on readership rather than on topic: a file one skill reads ships inside it, and a file several surfaces reach stays in the catalog that publishes it.

The cost is the typed entry point, which is the part worth knowing before moving anything else. A person fires a snippet by typing its path and cannot type a reference, so a runbook whose moment the loop cannot detect has to be reachable some other way. An invocation word looks like the answer and is banned by `.claude/standards/skill.md`, which turns down a flag that selects an alternate flow because the model misreads it and runs the vanilla path, and a handoff that silently does not happen is lost at the next compaction. What replaces it is a body that routes a plain request to the runbook serving it, leaving one flow with no flag in it. `claude-orchestrate` does this for both compaction sides, while the sweep needs nothing because the loop already reaches it.

Routing through the body moves the failure rather than removing it, and a skill carrying `disable-model-invocation` has to say so. The routing is only in play while the body is loaded, and a long session approaching a compaction is the likeliest place to have dropped it, which is the same moment the runbook exists for. A body that stops at the routing leaves the request landing as ordinary conversation with nothing reporting the miss, so it owes two recoveries: re-invoke the skill, and name the runbook paths so a reader can open one with the skill unloaded.

## Redundancy audit

Five toolkit skills were compared against community counterparts. All five are kept and one took a borrowed section.

- `aitk:systematic-debugging` vs `obra/superpowers/systematic-debugging`. Same methodology. Ours is 71 lines to their 296, capturing the four phases, circuit breaker, and red flags in a prose-tight form that matches toolkit conventions. No borrow.
- `aitk:claude-review` vs Anthropic's `code-review` plugin. Different scopes. Ours runs on a local branch diff and reads four project docs. Theirs runs on a PR URL with multi-agent fan-out and posts inline comments via GitHub MCP. Added a high-signal filter section borrowed from Anthropic's framing to sharpen severity judgment.
- `aitk:claude-ux-audit` vs `impeccable`'s `/audit` and `/critique`. Different lenses. Ours enumerates UI surfaces to find missing states, edge cases, and inconsistencies. `/audit` scores technical quality across five dimensions and `/critique` scores design with Nielsen heuristics. They compose, so run `claude-ux-audit` first to find gaps, then the `impeccable` commands to polish what exists. No skill body change, because third-party skill references belong on this surface rather than in a `SKILL.md` body.
- `aitk:claude-feature` vs the `obra/superpowers` planning skills `brainstorming`, `writing-plans`, and `executing-plans`. Different slots. Ours reads the full `.claude/` doc set and produces a structured plan at a coarser grain than the task-atomized `writing-plans`. Plan mode and Ultraplan are positioned separately in `.claude/context/claude-plugin/boundaries.md`. No borrow, since the approval gate between plan and implement already covers the clarification case `brainstorming` handles upfront.
- `aitk:claude-groundwork` vs `obra/superpowers/brainstorming`. Closest external analogue, different output. `brainstorming` is an upfront clarification conversation feeding straight into a plan, so its product is a better-specified plan. Groundwork produces a durable numbered folder of measurements and rejected options that can legitimately conclude in doing nothing, and it runs before a plan is warranted rather than while one is being written. No borrow.

`wiki/claude-skills.md` covers the Claude Code skill feature itself, and `docs/visual-design-workflow.md` is the worked example of per-workflow skill recommendations.
