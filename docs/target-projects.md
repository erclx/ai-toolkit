---
title: Target projects
description: Scaffold, add domains later, and sync upstream drift in a toolkit-managed project
category: Agent surface
---

# Target projects

How a project outside this repo consumes the toolkit across its lifecycle. Three phases: scaffold once, add a domain later when a new need appears, and sync when the upstream toolkit moves.

This doc stays at the narrative layer. For command flags and JSON shapes, see [agents](agents.md). For per-domain mechanics, see each `docs/<domain>.md`.

## Scaffold

Two steps, in order:

1. Run the framework's own scaffold if the project needs one, such as `bun init`, `npm create vite`, or `npm create astro`. The toolkit does not wrap framework scaffolding.
2. Invoke `toolkit:init-project` in Claude Code. The skill detects the stack, resolves flags, previews the chain, and runs `aitk init`.

### Stack decision

The default path is `base`. `aitk init` on `base` installs base tooling configs, Claude seeds, governance core rules, snippets, and wiki. Most projects need nothing more.

Escalate only for real web apps. The `init-project` skill reads `package.json` and root configs, then picks the matching tooling stack (`vite-react` today) and the matching governance stack (`react`, `astro`, `node`).

Markdown-heavy projects, CLI tools, docs sites, research notebooks, and scripting repos stay on `base`. Escalation is a ceiling move, not a default.

Run `aitk tooling list --json` and `aitk gov list --json` to see the current catalogs. Never hardcode stack names.

### Optional domains

`toolkit:init-project` passes optional domains through `--with`:

- `standards`: auto-enabled when `docs/`, `standards/`, or `.claude/` already exist in the project
- `prompts`: off by default, add only when the project uses AI chat role prompts
- `antigravity`: off by default, add only when the project runs Antigravity workflows

`wiki` is on by default. Pass `--skip wiki` to opt out.

## Add a domain later

When a new need appears after scaffold, install the one domain without re-running `aitk init`.

- Governance rule for a newly adopted library: invoke `toolkit:gov-install`, or run `aitk gov install <stack> --add <rule> <path>`
- Index.md system for a markdown-heavy folder that emerged: invoke `toolkit:indexes-install`
- A single snippet: `aitk snippets install <name> <path>`
- A single standard: `aitk standards install <name> <path>`

Per-domain mechanics live in the corresponding `docs/<domain>.md`. The skill body in `claude/skills/<skill>/SKILL.md` covers detection and preview.

## Sync upstream drift

When the toolkit updates, target projects pull changes per domain. There is one catch-all and several targeted entry points.

### Catch-all

`aitk sync <path>` runs every installed domain's sync in sequence. Safe to run on a cadence. It never touches user-owned seed files. Role prompts, governance rules, tooling configs, and generated files like `.claude/GOV.md` refresh in place.

### Targeted

- Claude seed docs such as `CLAUDE.md` and `.claude/REQUIREMENTS.md`: invoke `toolkit:claude-seed-sync`. The skill diffs section by section and proposes per-section edits. User customizations are preserved.
- Governance rules already installed: `aitk gov sync <path>` diffs and applies, and never adds new rules
- Tooling configs and seeds: `aitk tooling <stack> <path>` overwrites golden configs and merges seeds
- Reference docs for a stack: `aitk tooling ref <stack> <path>`
- Index regeneration after markdown edits: `aitk indexes regen`

Use a targeted entry point when only one surface moved upstream. Use the catch-all when the toolkit lands a bundled release.

## Verify a sync

Before running a sync against a real project, run the relevant sandbox scenario. The sandbox provisions a representative project state and routes `SANDBOX_SCENARIO=sync` through the domain flow. See [sandbox](sandbox.md) for the scenario catalog and routing patterns.

## Scenarios

### Markdown-heavy project

```bash
cd ~/repos/my-notes
claude --plugin-dir ~/repos/ai/toolkit/claude
```

In the session, invoke `toolkit:init-project`. The skill detects no framework, resolves tooling to `base`, governance to `base`, snippets to `all`, and auto-enables `standards` if `docs/` exists. It previews the chain, then runs `aitk init`.

Ongoing: invoke `toolkit:claude-seed-sync` for seed drift, or run `aitk sync .` for a catch-all refresh.

### Web application

```bash
cd ~ && bun create vite my-app && cd my-app
claude --plugin-dir ~/repos/ai/toolkit/claude
```

Invoke `toolkit:init-project`. The skill reads `package.json` and the Vite config, resolves tooling to `vite-react` and governance to `react`, and runs `aitk init` with the resolved flags.

Ongoing maintenance:

- Seed drift: invoke `toolkit:claude-seed-sync`
- Catch-all sync: `aitk sync .`
- Governance rule refresh only: `aitk gov sync .`
- Layer a new rule on top, for example `260-shadcn` after adopting shadcn: `aitk gov install react --add 260-shadcn .`

## Related

- [agents](agents.md): CLI flags, exit codes, and JSON output shapes
- [AI workflow](ai-workflow.md): feature-development loop inside a toolkit-managed project
- [tooling](tooling.md), [governance](governance.md), [claude](claude.md), [indexes](indexes.md), [snippets](snippets.md), [standards](standards.md): per-domain mechanics
- [sandbox](sandbox.md): scenario catalog for verifying domain flows
