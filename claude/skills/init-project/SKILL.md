---
name: init-project
description: Detects a new project's type and runs `aitk init` with resolved stack, snippets, and optional domains in one shot. Use when bootstrapping a new project with the toolkit, or when asked to "init this project", "bootstrap the toolkit", "set up toolkit", or "one-shot install". Assumes the `aitk` CLI is on PATH. Do NOT use when only installing governance rules. Use `gov-install` instead.
---

# Init project

Orchestrates the onboarding chain. Detects project type, resolves per-domain arguments, previews the chain, then runs `aitk init` with flags. The CLI holds the install logic. This skill only resolves and previews.

## Read catalogs

Run in parallel. Never hardcode stack, rule, snippet, or standards names. Run from the target project's current directory. Do not cd into the toolkit source tree. The `aitk` CLI is global.

```bash
aitk gov list --json 2>/dev/null
aitk snippets list --json 2>/dev/null
aitk standards list --json 2>/dev/null
aitk tooling list --json 2>/dev/null
```

## Detect

Read these from the project root in parallel, skipping any that do not exist:

- `package.json`: `dependencies` and `devDependencies`
- Root configs: `astro.config.*`, `next.config.*`, `vite.config.*`, `tailwind.config.*`, `tsconfig.json`, `pyproject.toml`, `go.mod`, `Cargo.toml`
- `.claude/REQUIREMENTS.md` and `.claude/ARCHITECTURE.md` if present
- Directory structure via `ls -1` of the project root and `src/` if present

## Resolve arguments

- **Stack:** pick the closest governance stack by matching detected runtime or framework against stack names in the catalog. If nothing matches, fall back to `base`.
- **Extras:** identify technologies not already covered by the picked stack. For each, find a rule whose `description` or `globs` points at that technology and pass it via `--add`. Do not add a rule the stack already pulls in.
- **Snippets:** default to `all`. Narrow only if the user asked for a specific category.
- **Optional domains (`--with`):**
  - `standards`: include if `docs/`, `standards/`, or `.claude/` already exists in the project
  - `prompts`: never auto-enable. Add only if the user asked for it.
  - `antigravity`: never auto-enable. Add only if the user asked for it.
- **Skip (`--skip`):** only `wiki` is supported. Default is keep wiki on.

## Gap handling

If a detected technology has no matching rule or stack, do not guess. Surface the gap and either:

1. Defer to `gov-install`. Author a rule in the toolkit, then re-run this skill.
2. Proceed with the matched layer, listing the gap in the final report.

Rules, snippets, and stacks are authored in the toolkit repo, never in the target project on the fly.

## Preview

Before executing, output:

- **Detected:** each technology with its evidence file
- **Stack:** picked stack + resolved rule count
- **Extras:** each `--add` rule with a one-line reason
- **Snippets:** resolved category
- **Optional:** each `--with` entry with a one-line reason
- **Skip:** any `--skip` entries with reason
- **Target:** resolved target path
- **Command:** the exact shell command to run

## Execute

Run immediately after the preview. Claude Code's tool permission dialog is the confirmation gate. Run from the target project's current directory. The `<target>` argument is explicit, so no cd is needed.

```bash
AITK_NON_INTERACTIVE=1 aitk init \
  --stack <stack> \
  --add <rules> \
  --snippets <category> \
  --with <domains> \
  <target>
```

Omit any flag whose resolved value is empty.

## Report

After execution, report:

- Domains installed with a check per domain
- Target path
- Any domains that failed (the CLI warns and continues to the next)
- Any detection gaps surfaced during resolve
