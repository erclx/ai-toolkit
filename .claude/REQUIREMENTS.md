# Requirements

Describe what the toolkit does and why. Not how it works. Domain architecture lives in `docs/<domain>.md`. Behavioral rules live in `CLAUDE.md`. Update this doc when scope changes, goals shift, or a non-goal is promoted to a feature.

What belongs:

- The problem being solved and for whom
- Worldview: the beliefs about AI tooling that shape every decision in this repo
- User-facing goals stated as outcomes, not implementation
- Explicit non-goals: scope boundaries that prevent feature creep. Mark deferred items "(deferred)" to signal they are not permanently excluded.
- MVP features as a numbered list: feature name and one-line description. No implementation detail.
- Tech stack as a plain list of tools. Rationale lives in the relevant `docs/<domain>.md`.
- Hard constraints that shape all decisions

What does not belong:

- Implementation details, API names, or internal component references
- Rationale for tech choices. That lives in the relevant `docs/<domain>.md`.
- Anything that describes how a feature is built rather than what it does

## Worldview

- Code is free. Context and human attention are scarce.
- Claude Code is the platform. Tools live inside it or attach to it through skills, hooks, and the plugin system.
- Humans stay in the loop only where judgment is non-obvious. Process and planning carry the leverage.
- The toolkit is agent-first throughout. Human-friendly UX layers on top where needed.
- Consistency is a prompt. Same patterns across domains reduce context load and make refactors cheap.

## Problem

Every repository accumulates the same boilerplate: governance rules, prose standards, Claude Code skills, Gemini commands, snippet libraries, seed docs, sync scripts. Re-authoring these per project wastes time and drifts over time. Without a central source, rules diverge and agents cannot rely on consistent signals across projects.

## Goals

- Agent-first CLI surface with non-interactive paths, JSON catalogs, and composable flags on every command.
- One authoritative source for governance rules, prose standards, Claude seeds, and workflow skills.
- Installable Claude Code plugin that brings a curated skill set to any project scaffolded through `aitk`.
- Behavior and conventions captured as text that both humans and agents can read and enforce.
- Low-friction install and sync so target projects pull updates without hand-patching.

## Non-goals

- Replace human code review on risky changes. Agents augment the review loop. Humans still own the final call.
- Ship runtime dependencies or application code to target projects. The toolkit ships configs, seeds, prompts, and rules.
- Lock in a single AI tool. Claude Code is primary. Gemini CLI is a first-class alternative. Antigravity is in maintenance mode: existing workflows install and sync, no new behavior is added.
- Wrap framework scaffolding. Users run `bun init`, `npm create vite`, and similar themselves. The toolkit layers on top.
- Provide a hosted service. Everything runs locally against local CLIs.

## MVP features

1. `aitk init`: one-shot bootstrap that layers base tooling, Claude seeds, governance, snippets, and wiki into a project.
2. Per-domain `list`, `install`, and `sync` subcommands so skills can read catalogs and apply updates.
3. Governance stacks and rules installed as `.cursor/rules/`, re-buildable into `.claude/GOV.md` for Claude Code.
4. Claude Code plugin with skills covering planning, review, UI tests, docs sync, memory review, and the git ship chain.
5. Sandbox scenarios that provision representative project states for verifying each domain flow.
6. Prose, commit, branch, PR, and skill authoring standards synced into every project.
7. Snippets and prompt templates for recurring chat workflows.

## Tech stack

- Bun for CLI runtime and scripts
- TypeScript with Commander for the CLI entry point
- Bash for domain scripts, sandbox provisioning, and hook functions
- Markdown for all authored content
- Git and GitHub CLI for ship workflows

## Constraints

- Every command must have a non-interactive path via args or `AITK_NON_INTERACTIVE=1`. Never require a TTY.
- JSON output on `list` commands must pipe clean through any wrapper. UI and logs go to stderr.
- The toolkit is the authoritative source. Target projects consume via install and sync, never author in place.
- Skills detect and call the CLI. They do not reimplement CLI logic.
- Authored content follows `standards/prose.md`. No em dashes, no semicolons, no marketing buzzwords.
