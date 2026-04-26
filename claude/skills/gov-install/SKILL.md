---
name: gov-install
description: Detects a project's stack from its files and installs matching toolkit governance rules into `.claude/rules/`. Use after scaffolding a new project, when asked to "install gov rules", "install governance", "set up governance", or when a target project has no `.claude/rules/` yet. Assumes the `aitk` CLI is on PATH.
---

# Gov install

Automates `aitk gov install` by inferring the stack and extras from the current project, then shelling out to the CLI with the resolved arguments.

## Read the catalog

Run this first to load the current stacks and rules. Never hardcode names. The catalog is the source of truth.

```bash
aitk gov list --json 2>/dev/null
```

## Detect the stack

Read these from the project root in parallel:

- `package.json`: dependencies and devDependencies
- Root config files: `astro.config.*`, `next.config.*`, `vite.config.*`, `tailwind.config.*`, `tsconfig.json`, `pyproject.toml`, `go.mod`, `Cargo.toml`
- `.claude/REQUIREMENTS.md` and `.claude/ARCHITECTURE.md` if present
- Directory structure via `ls -1` of the project root and `src/` if present

## Match

Match the detected evidence to the catalog:

- Pick the closest stack. Match detected runtime or framework against stack names in the catalog.
- Identify additional technologies not already covered by the picked stack. For each, find a rule whose `description` or `paths` points at that technology, then add it via `--add`.
- Dedupe extras against stack rules. Do not add a rule the stack already pulls in.

## Gap handling

If a detected technology has no matching rule, stop and surface the gap. Do not guess.

Present three options:

1. Author a new rule in the toolkit at `governance/rules/<domain>/<num>-<name>.mdc` following `prompts/governance-rules.md`, commit, then re-run install.
2. Install the matching non-<tech> rules and skip the tech-specific layer.
3. Abort.

Rules are authored in the toolkit repository, never in the target project on the fly.

## Preview

Before executing, output:

- **Detected:** each technology with the file that evidenced it
- **Stack:** picked stack name and total resolved rule count
- **Extras:** each `--add` rule with a one-line reason
- **Target:** resolved target path
- **Command:** the exact shell command to run

## Execute

Run with `AITK_NON_INTERACTIVE=1` so no CLI picker prompts appear. Claude Code's tool permission dialog is the confirmation gate.

```bash
AITK_NON_INTERACTIVE=1 aitk gov install <stack> --add <extras> <target>
```

## Response

After execution, report:

- Rule count installed
- Target path
- Any rules that failed to resolve (the CLI warns on missing rule files)
