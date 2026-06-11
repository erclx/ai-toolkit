---
name: operator
description: Front door to the toolkit in a target project. Orients on the toolkit's own docs and live `aitk` catalogs, then runs or routes any toolkit operation from a plain-language intent. Use when you want one entry point instead of picking a specific setup or sync skill, or when asked to "use the toolkit", "what can the toolkit do", "sync my standards", "install rules", or "help me set up this project". User-invoked only. Defers first-time scaffold to setup-init and seed drift to claude-seed-sync.
disable-model-invocation: true
---

# Toolkit operator

Front door to the toolkit. Orient first, then run the simplest operation that satisfies the intent or hand off to the owning skill. Never bypass `aitk` to edit managed files by hand.

## Orient

Run these from the target project root, in parallel, before acting:

- `aitk docs list`: the index of toolkit reference docs
- `aitk docs agents`: the CLI command catalog and invocation contract
- `aitk docs target-projects`: the scaffold, add-a-domain, and sync lifecycle

Load a domain doc with `aitk docs <topic>` only when the intent touches that domain. Read the live catalog for any domain you act on with `aitk <domain> list --json`. Never hardcode stack, rule, snippet, or standards names.

## Route

Map the stated intent to one lifecycle phase, then act:

- First-time scaffold of a fresh project: hand off to `setup-init`
- Governance rules for the project stack: hand off to `setup-gov`
- Bootstrap the `index.md` system: hand off to `setup-indexes`
- Seed or standards drift in `CLAUDE.md` or `.claude/` preambles: hand off to `claude-seed-sync`
- Install one snippet, standard, or rule: run the domain `install` command
- Sync one domain or every installed domain: run `aitk <domain> sync` or `aitk sync`
- Browse what is available: run `aitk <domain> list`

## Execute

For operations this skill runs directly:

- Read the catalog first with `aitk <domain> list --json`, then match against project context
- Run the CLI with `AITK_NON_INTERACTIVE=1` so it skips prompts. The tool permission dialog is the confirmation gate.
- Report the command run and what changed. Emit the full relative path for any file written.

## Boundaries

- Run `aitk`. Never reimplement its install or sync logic, and never edit managed files like rules, configs, or seeds by hand.
- Hand off the deep flows. Do not duplicate `setup-init` detection or `claude-seed-sync` part-diffing inline.
- Resolve names from catalogs at runtime. A hardcoded name is a bug.
