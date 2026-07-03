---
name: setup-plugins
description: Installs curated community and official Claude Code plugins user-scoped on the current machine via the `claude plugin` CLI. Use when asked to "install plugins", "set up plugins", "install the frontend/design/security/debugging plugins", "provision plugins on this machine", or when setting up Claude Code on a new computer. Do NOT use to install toolkit workflow skills, which load live via `--plugin-dir`. Assumes the `claude` CLI is on PATH.
---

# Setup plugins

Automates plugin installs by reading the curated catalog, detecting what is already
installed, and shelling out to the `claude plugin` CLI with `--scope user` so the
plugins are available in every project on this machine.

Domain-knowledge plugins install once per machine. They are not copied into any
project. Toolkit workflow skills are a separate concern and load live through
`--plugin-dir`, so never install those here.

## Guards

- If the `claude` CLI is not on PATH, stop: `❌ claude CLI not found. Install Claude Code first.`

## Read the catalog

Read the curated list from the skill folder. Use `${CLAUDE_SKILL_DIR}`, which
expands to this skill's own directory, so the path resolves from any project. Never
invent plugin names or install strings that are not in it.

- `${CLAUDE_SKILL_DIR}/references/plugin-catalog.md`: verified plugins, marketplace sources, and the recommended default set

## Detect what is installed

Run this to skip plugins already present. Do not reinstall an installed plugin.

```bash
claude plugin list 2>/dev/null || echo "NONE"
```

## Select

When plugin names are passed as arguments, install exactly those and skip the prompt.

When invoked bare, present the catalog grouped by category with the recommended
default marked, then ask which to install. Accept a bulk answer:

- `recommended`: the default set from the catalog
- `all`: every catalog row not already installed
- a specific list of plugin names

## Preview

Before executing, output:

- **Installed:** plugins already present, skipped
- **To install:** each chosen plugin with its category and marketplace source
- **Scope:** `user` (every project on this machine)
- **Commands:** the exact shell commands to run

## Execute

For each chosen plugin, add its marketplace source if it is not already added, then
install the plugin user-scoped. Run each install independently so one failure does
not abort the batch.

```bash
claude plugin marketplace add <source> 2>/dev/null || true
claude plugin install <name> --scope user
```

For a catalog entry listed under "Installs outside the claude plugin CLI", skip the
marketplace step and run its installer command verbatim instead.

Claude Code's tool permission dialog is the confirmation gate. Do not pause for a
separate confirmation.

## Response

After execution, report:

- Plugins installed, each with its marketplace
- Plugins skipped as already installed
- Any install that failed, with the CLI error
- A reload note: installed plugins apply on the next session or after `/reload-plugins`
- A tuning note: if a plugin over-triggers, set `skillOverrides` in settings to `name-only`, `user-invocable-only`, or `off` rather than uninstalling
