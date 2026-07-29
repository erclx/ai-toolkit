---
title: Target projects
description: Scaffold, add domains later, and sync upstream drift in a toolkit-managed project
category: Agent surface
---

# Target projects

How a project outside this repo consumes the toolkit across its lifecycle. Three phases: scaffold once, add a domain later when a new need appears, and sync when the upstream toolkit moves.

This doc stays at the narrative layer. For command flags and JSON shapes, see [agents](agents.md). For per-domain mechanics, see each `.claude/context/<domain>.md`.

## Scaffold

Two steps, in order:

1. Run the framework's own scaffold if the project needs one, such as `bun init`, `npm create vite`, or `npm create astro`. The toolkit does not wrap framework scaffolding.
2. Invoke `toolkit:setup-init` in Claude Code. The skill detects the stack, resolves flags, previews the full chain, and runs it end-to-end.

The chain is:

- `aitk init` installs base tooling, Claude seeds, and governance rules into `.claude/rules/` in the same pass
- `aitk tooling sync <stack>` adds stack-specific deps, scripts, gitignore entries, and drops `.claude/tooling/<stack>.md` (plus parents) as the agent's audit context
- The agent follows the reference to generate eslint, vitest, playwright configs and the stack's setup script, and extends `.claude/context/ci.md` and `.claude/context/development.md` per the reference's extend sections
- `setup-verify` runs the installed `package.json` scripts (lint, typecheck, check, test, build) and reports pass or fail

### From scaffold to first feature

Scaffold installs tooling and seeds. It does not fill the planning docs or the design system. Complete those before the first feature session:

1. Fill `.claude/REQUIREMENTS.md` and `.claude/ARCHITECTURE.md`. The seed provides the files, the scope and decisions are yours to write.
2. For a UI project, invoke `toolkit:claude-design-propose` to draft `.claude/DESIGN.md` from the requirements and a `## Personality` section. Skip for non-UI projects.
3. Optionally invoke `toolkit:claude-diagram` to draft `.claude/DIAGRAMS.md` from the architecture.
4. Start the feature loop. See [AI workflow](ai-workflow.md) for the per-feature sequence.

### Stack decision

The default path is `base`. `aitk init` on `base` installs base tooling configs, Claude seeds, governance core rules, snippets, and wiki. Most projects need nothing more.

Escalate only for real web apps. The `setup-init` skill reads `package.json` and root configs, then picks the matching tooling stack (`vite-react` today) and the matching governance stack (`react`, `astro`, `node`).

Markdown-heavy projects, CLI tools, docs sites, research notebooks, and scripting repos stay on `base`. Escalation is a ceiling move, not a default.

Run `aitk tooling list --json` and `aitk gov list --json` to see the current catalogs. Never hardcode stack names.

### Core domains and skips

`aitk init` installs base tooling, Claude workflow, governance, standards, snippets, and wiki by default. `standards` and `wiki` are skippable:

- `--skip standards`: leave standards out. Rare, since the governance rules and toolkit skills reference `.claude/standards/`.
- `--skip wiki`: leave the wiki out.

## Add a domain later

When a new need appears after scaffold, install the one domain without re-running `aitk init`.

- Governance rule for a newly adopted library: invoke `toolkit:setup-gov`, or run `aitk gov install <stack> --add <rule> <path>`
- Project-specific rule the toolkit does not ship: invoke `toolkit:create-rule`. It scaffolds a rule into `.claude/rules/` with a non-colliding number, and `aitk gov sync` leaves it untouched.
- Index.md system for a markdown-heavy folder that emerged: invoke `toolkit:setup-indexes`
- A snippet preset or category: `aitk snippets install <preset|category|all> <path>`. The argument is required, since the picker refuses headlessly rather than choosing for the caller
- A single standard: `aitk standards install <name> <path>`

Per-domain mechanics live in the corresponding `docs/<domain>.md`. The skill body in `claude/skills/<skill>/SKILL.md` covers detection and preview.

## Sync upstream drift

When the toolkit updates, target projects pull changes per domain. There is one catch-all and several targeted entry points.

### Catch-all

`aitk sync <path>` runs every installed domain's sync in sequence. Safe to run on a cadence. It never touches user-owned seed files. Governance rules in `.claude/rules/`, tooling configs, and reference docs refresh in place. Stale `.claude/GOV.md` from earlier installs is removed.

Standards are the exception inside that run. A drifted standard is reported and left alone rather than overwritten, because standards are seeds a project edits. To take the upstream version, run `aitk standards sync <path>` interactively, or use `toolkit:claude-seed-sync` below to merge section by section.

### Targeted

- Claude seed docs such as `CLAUDE.md` and `.claude/REQUIREMENTS.md`, plus installed standards under `.claude/standards/`: invoke `toolkit:claude-seed-sync`. The skill splits each file into a preamble (between the H1 and the first H2) plus one part per `##` section, then diffs part by part across both surfaces and proposes per-part edits. User customizations are preserved.
- Governance rules already installed: `aitk gov sync <path>` diffs and applies, and never adds new rules
- Standards already installed: `aitk standards sync <path>` diffs and applies whole files, and refuses to apply without a prompt
- Tooling configs and seeds: `aitk tooling <stack> <path>` overwrites golden configs and merges seeds
- Reference docs for a stack: `aitk tooling ref <stack> <path>`
- Index regeneration after markdown edits: `aitk indexes regen`

Use a targeted entry point when only one surface moved upstream. Use the catch-all when the toolkit lands a bundled release.

## Verify a sync

Before running a sync against a real project, run the relevant sandbox scenario. The sandbox provisions a representative project state and routes `SANDBOX_SCENARIO=sync` through the domain flow. See [sandbox](../.claude/context/sandbox.md) for the scenario catalog and routing patterns.

## Scenarios

### Markdown-heavy project

Replace `<toolkit>` with the path where you cloned the toolkit.

```bash
cd <your-project>
claude --plugin-dir <toolkit>/claude
```

In the session, invoke `toolkit:setup-init`. The skill detects no framework, resolves tooling to `base`, governance to `base`, snippets to `all`, and auto-enables `standards` if `docs/` exists. It previews the chain, then runs `aitk init`.

Ongoing: invoke `toolkit:claude-seed-sync` for seed drift, or run `aitk sync .` for a catch-all refresh.

### Web application

```bash
bun create vite my-app && cd my-app
claude --plugin-dir <toolkit>/claude
```

Invoke `toolkit:setup-init`. The skill reads `package.json` and the Vite config, resolves tooling to `vite-react` and governance to `react`, and runs `aitk init` with the resolved flags.

Ongoing maintenance:

- Seed drift: invoke `toolkit:claude-seed-sync`
- Catch-all sync: `aitk sync .`
- Governance rule refresh only: `aitk gov sync .`
- Layer a new rule on top, for example `260-shadcn` after adopting shadcn: `aitk gov install react --add 260-shadcn .`

### Monorepo with multiple language roots

The repo root owns the shared `base` layer, and each language lives in its own subfolder.

```bash
aitk init --stack react .
aitk tooling sync vite-react ./frontend --skip base
aitk tooling sync python ./backend --skip base
```

`--skip base` drops the `base` layer from each subtree sync, so husky, prettier, cspell, commitlint, and CI stay single at the repo root. Without it, every subtree re-drops husky, and since git honors only one `core.hooksPath` the extra hook dirs silently break. Each subtree still gets its own framework configs (eslint, vitest, tsconfig, vite) and its own `.claude/tooling/<stack>.md` audit docs.

## Running sync from an agent session

`aitk sync .` applies every installed domain sync, then offers to commit the result and open a pull request. That last step needs a terminal. Under `AITK_NON_INTERACTIVE=1`, which is how an agent runs it, the domain syncs still apply and the git workflow is refused: the command reports the branch and commit it would have created, writes nothing to git, and exits 0. Review the working tree and commit it yourself, or rerun interactively to reach the commit and pull request options.

Sync also refuses a target whose working tree is dirty, so commit or stash before running it.

## Related

- [agents](agents.md): CLI flags, exit codes, and JSON output shapes
- [AI workflow](ai-workflow.md): feature-development loop inside a toolkit-managed project
- [tooling](../.claude/context/tooling.md), [governance](../.claude/context/governance.md), [claude plugin](../.claude/context/claude-plugin.md), [indexes](../.claude/context/indexes.md), [snippets](../.claude/context/snippets.md), [standards](../.claude/context/standards.md): per-domain mechanics
- [sandbox](../.claude/context/sandbox.md): scenario catalog for verifying domain flows
