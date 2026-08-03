---
title: Target projects
description: Scaffold, add domains later, and sync upstream drift in a toolkit-managed project
category: Agent surface
---

# Target projects

How a project outside this repo consumes the toolkit across its lifecycle. Three phases: scaffold once, add a domain later when a new need appears, and sync when the upstream toolkit moves.

This doc stays at the narrative layer. For command flags and JSON shapes, see [agents](agents/index.md). For per-domain mechanics, see each `.claude/context/<domain>.md`.

## Getting the skills

The skills reach a session through a marketplace install, once per machine. Every session on that machine carries them afterward, and updates arrive on release, so an upstream push does not reach an installed copy.

```bash
claude plugin marketplace add https://github.com/erclx/aitk
claude plugin install aitk@aitk
```

The URL form clones over HTTPS. The `erclx/aitk` shorthand resolves to SSH and fails on a machine with no key configured.

The `aitk` CLI is separate. Twenty skills invoke it in a command position, and a marketplace install does not put it on `PATH`, so it installs from the registry as its own step.

```bash
bun install --global @erclx/aitk
```

The package ships the catalogs the CLI reads, not only `src/`, so `aitk init` resolves standards, snippets, governance, tooling, and the seeds from wherever the package landed.

Pointing Claude Code at a checkout stays the development path, where a local skill edit overrides the installed copy for that session.

```bash
claude --plugin-dir <toolkit>/claude
```

## Scaffold

Two steps, in order:

1. Run the framework's own scaffold if the project needs one, such as `bun init`, `npm create vite`, or `npm create astro`. The toolkit does not wrap framework scaffolding.
2. Invoke `aitk:setup-init` in Claude Code. The skill detects the stack, resolves flags, previews the full chain, and runs it end-to-end.

The chain is:

- `aitk init` installs base tooling, Claude seeds, and governance rules into `.claude/rules/` in the same pass
- `aitk tooling sync <stack>` adds stack-specific deps, scripts, gitignore entries, and drops `.claude/tooling/<stack>.md` (plus parents) as the agent's audit context
- The agent follows the reference to generate eslint, vitest, playwright configs and the stack's setup script, and extends `.claude/context/ci.md` and `.claude/context/development.md` per the reference's extend sections
- `setup-verify` runs the installed `package.json` scripts (lint, typecheck, check, test, build) and reports pass or fail

Keep the `## Scripts` table in `.claude/context/development.md` current as scripts are added. Base tooling seeds that entry with the commands it installs, and each stack reference extends the table. `project-commands` reads it to start the app or run a check on request, so a command missing from the table cannot be run that way.

### From scaffold to first feature

Scaffold installs tooling and seeds. It does not fill the planning docs or the design system. Complete those before the first feature session:

1. Fill `.claude/REQUIREMENTS.md` and `.claude/ARCHITECTURE.md`. The seed provides the files, the scope and decisions are yours to write.
2. For a UI project, invoke `aitk:claude-design-extract` to draft `.claude/DESIGN.md`. With no UI code yet it takes the greenfield path and proposes tokens from the requirements and a `## Personality` section. Skip for non-UI projects.
3. Optionally invoke `aitk:claude-diagram` to draft entries under `.claude/diagrams/` from the architecture and the requirements. One file per diagram kind, so a later refresh of one kind leaves the others untouched. It renders each diagram it writes to verify the layout, which downloads the Mermaid CLI on first use and takes about 15 seconds. A machine without a renderer still gets the diagrams and is told which check was skipped. Each entry records the commit and date it was last verified against, and `aitk:claude-docs` maintains that record on every ship: it annotates an entry whose cited code path left the tree and stubs a kind whose source signal arrived uncovered. The sweep writes frontmatter only, so a diagram's picture and prose change when you redraw them and at no other time.
4. Start the feature loop. See [AI workflow](ai-workflow.md) for the per-feature sequence.

### Stack decision

The default path is `base`. `aitk init` on `base` installs base tooling configs, Claude seeds, governance core rules, and snippets, and scaffolds an empty `.claude/wiki/`. Most projects need nothing more.

Escalate only for real web apps. The `setup-init` skill reads `package.json` and root configs, then picks the matching tooling stack (`vite-react` today) and the matching governance stack (`react`, `astro`, `node`).

Markdown-heavy projects, CLI tools, docs sites, research notebooks, and scripting repos stay on `base`. Escalation is a ceiling move, not a default.

Run `aitk tooling list --json` and `aitk gov list --json` to see the current catalogs. Never hardcode stack names.

### Core domains and skips

`aitk init` installs base tooling, Claude workflow, governance, standards, and snippets, and scaffolds `.claude/wiki/`. Governance defaults to the `base` stack, so a bare init carries the rules that route to the standards it installs alongside them. Pass `--stack <name>` to install a framework stack instead.

`governance`, `standards`, and `wiki` are skippable:

- `--skip governance`: leave `.claude/rules/` empty. Standards still install, so `.claude/standards/prose.md` lands with nothing pointing at it and no coding standard loads on a file match. The preview names any `--add` rules the skip drops, and the run prints the `aitk gov install <stack> <path>` command to add rules afterward, carrying those extras so one paste restores what the skip declined.
- `--skip standards`: leave standards out. The governance rules still reference `.claude/standards/`, so their authority lines resolve to nothing. Toolkit skills are unaffected, since each falls back to the copy in its own plugin root. That fallback now carries runtime behavior rather than reference prose alone, because the pre-publish scan and the branch-slug transform each have a standard of their own, `publish.md` and `slug.md`, cited by the skills that run them.
- `--skip wiki`: skip the `.claude/wiki/` scaffold. A target that already carries a root `wiki/` keeps it, since the verb reports that folder rather than migrating it.

## Add a domain later

When a new need appears after scaffold, install the one domain without re-running `aitk init`.

- Governance rule for a newly adopted library: invoke `aitk:setup-gov`, or run `aitk gov install <stack> --add <rule> <path>`
- Project-specific rule the toolkit does not ship: invoke `aitk:create-rule`. It scaffolds a rule into `.claude/rules/` with a non-colliding number, and `aitk gov sync` leaves it untouched.
- Index.md system for a markdown-heavy folder that emerged: invoke `aitk:setup-indexes`
- A snippet preset or category: `aitk snippets install <preset|category|all> <path>`. The argument is required, since the picker refuses headlessly rather than choosing for the caller
- A single standard: `aitk standards install --only <names> <path>`. The selection expands to the standards it depends on, and stops at a `Does not govern:` handoff, which it reports instead. Omitting the flag installs all of them

Per-domain mechanics live in the corresponding `docs/<domain>.md`. The skill body in `claude/skills/<skill>/SKILL.md` covers detection and preview.

## Sync upstream drift

When the toolkit updates, target projects pull changes per domain. There is one catch-all and several targeted entry points.

### Check first

`aitk sync --check <path>` reports what has drifted without writing anything. It splits each difference by cause, which is the question that decides what to do next. A `stale` file still matches what the toolkit installed, so the update is mechanical. A `customized` file carries local edits, so taking the upstream version is a decision and `aitk:claude-seed-sync` is the tool for it. A `stranded` file sits where an older toolkit installed it and the toolkit has since moved, which is what `aitk:migration-standards` handles.

That attribution comes from `.claude/aitk.json`, a stamp every install and sync writes recording a hash per installed file. Each domain holds its own toolkit commit, so syncing governance today does not move the revision standards measures against, and each domain reports the upstream commits touching its own source path. Running any sync stamps that domain, and the report names the ones still unstamped.

A project that has never synced under a toolkit new enough to write a stamp falls back to the toolkit's own git history. Installed content matching any version that history published proves the file untouched, so it reports `stale` naming the commit it came from, and content matching no published version stays `drifted`. That fallback needs the toolkit as a git checkout. Installed from the registry it ships source without history, and the report says attribution was unavailable rather than reading every file as a local edit.

Three further causes sit outside the per-domain scan, each naming something that walk cannot see. A seed the project edited is reported under `seeds` and reconciled with `aitk:claude-seed-sync`, since no sync command touches a seed. A file a newer seed folder replaced is reported under `superseded`, such as `.claude/TASKS.md` against the `.claude/tasks/` that now ships, and nothing moves it because the content is the project's own. A domain sitting at the root layout with nothing under `.claude/` is reported under `unmigrated` and handed to `aitk:migration-standards`.

That last one matters most on an older project. Before it existed, a target holding `standards/` at its root reported zero entries for that domain, so a project that had never migrated was indistinguishable from one that was fully current.

Add `--json` for the machine-readable report, and `--exit-code` to fail a CI job when a target falls behind. Files the project authored itself never count toward that exit code, and neither do superseded artifacts or seed drift, since both need the user to move content only they can place. An unmigrated domain does count, because running the relocation closes it.

Tooling is not covered by the stamp. Reconcile those configs with `aitk tooling <stack> <path>`.

### Catch-all

`aitk sync <path>` runs every installed domain's sync in sequence. Safe to run on a cadence. It never touches user-owned seed files. Governance rules in `.claude/rules/`, tooling configs, and reference docs refresh in place. Stale `.claude/GOV.md` from earlier installs is removed.

Standards are the exception inside that run, and the stamp narrows it. A standard the project customized is reported and left alone rather than overwritten. A standard still matching what was installed carries no local edits to lose, so a headless run updates it. An unstamped project reaches the same split through the history fallback, so a headless run updates every standard it can prove untouched and refuses while any file resists attribution. To take the upstream version of a customized file, run `aitk standards sync <path>` interactively, or use `aitk:claude-seed-sync` below to merge section by section.

### Targeted

- Claude seed docs such as `CLAUDE.md` and `.claude/REQUIREMENTS.md`, plus installed standards under `.claude/standards/`: invoke `aitk:claude-seed-sync`. The skill splits each file into a preamble (between the H1 and the first H2) plus one part per `##` section, then diffs part by part across both surfaces and proposes per-part edits. User customizations are preserved.
- Governance rules already installed: `aitk gov sync <path>` diffs and applies, and never adds new rules
- Standards already installed: `aitk standards sync <path>` diffs and applies whole files, and refuses to apply without a prompt
- Tooling configs and seeds: `aitk tooling <stack> <path>` overwrites golden configs and merges seeds
- Reference docs for a stack: `aitk tooling ref <stack> <path>`
- Index regeneration after markdown edits: `aitk indexes regen`

Use a targeted entry point when only one surface moved upstream. Use the catch-all when the toolkit lands a bundled release.

## Verify a sync

Before running a sync against a real project, run the relevant sandbox scenario. The sandbox provisions a representative project state and routes `SANDBOX_SCENARIO=sync` through the domain flow. See [sandbox](../.claude/context/sandbox/index.md) for the scenario catalog and routing patterns.

## Scenarios

### Markdown-heavy project

```bash
cd <your-project>
claude
```

In the session, invoke `aitk:setup-init`. The skill detects no framework, resolves tooling to `base`, governance to `base`, snippets to `all`, and auto-enables `standards` if `docs/` exists. It previews the chain, then runs `aitk init`.

Ongoing: run `aitk sync --check .` to see what has drifted, then invoke `aitk:claude-seed-sync` for seed drift or `aitk sync .` for a catch-all refresh.

### Web application

```bash
bun create vite my-app && cd my-app
claude
```

Invoke `aitk:setup-init`. The skill reads `package.json` and the Vite config, resolves tooling to `vite-react` and governance to `react`, and runs `aitk init` with the resolved flags.

Ongoing maintenance:

- What has drifted: `aitk sync --check .`
- Seed drift: invoke `aitk:claude-seed-sync`
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

Sync also refuses a target whose working tree is dirty, so commit or stash before running it. `aitk sync --check .` has neither restriction, since it writes nothing.

## Related

- [agents](agents/index.md): CLI flags, exit codes, and JSON output shapes
- [AI workflow](ai-workflow.md): feature-development loop inside a toolkit-managed project
- [tooling](../.claude/context/tooling.md), [governance](../.claude/context/governance.md), [claude plugin](../.claude/context/claude-plugin/index.md), [indexes](../.claude/context/indexes.md), [snippets](../.claude/context/snippets.md), [standards](../.claude/context/standards.md): per-domain mechanics
- [sandbox](../.claude/context/sandbox/index.md): scenario catalog for verifying domain flows
