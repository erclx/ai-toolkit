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
- **Tooling stack:** pick the closest tooling stack from `aitk tooling list --json` (e.g. `vite-react`, `astro`). Distinct from the governance stack. Fall back to `base` if no framework match.
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
- **Stack:** picked governance stack + resolved rule count
- **Tooling stack:** picked tooling stack
- **Extras:** each `--add` rule with a one-line reason
- **Snippets:** resolved category
- **Optional:** each `--with` entry with a one-line reason
- **Skip:** any `--skip` entries with reason
- **Target:** resolved target path
- **Commands:** the full chain that will run

## Execute

Run the chain in order. Each step's permission dialog is the confirmation gate. Run from the target project's current directory.

Step 1: `aitk init` installs base tooling, claude seeds, governance, GOV.md, snippets, and wiki.

```bash
AITK_NON_INTERACTIVE=1 aitk init \
  --stack <stack> \
  --add <rules> \
  --snippets <category> \
  --with <domains> \
  <target>
```

Omit any flag whose resolved value is empty.

Step 2: `aitk tooling sync <tooling-stack>` installs stack deps, scripts, gitignore entries, seeds, golden configs, and drops the reference doc. The extends chain is walked, so syncing `vite-react` also pulls `web` and `base` configs. Skip if the tooling stack is `base` (already synced by `aitk init`).

```bash
AITK_NON_INTERACTIVE=1 aitk tooling sync <tooling-stack> <target>
```

Step 3: post-sync fixups. Golden configs arrive from sync, so no config generation is required. But a few items may need a one-time touch:

- **ESLint version pin.** If `bun create vite` installed `eslint@^10` and the manifest pins `eslint@^9`, sync does not override a present dep. Run `bun add -d eslint@^9` if `bun run lint:fix` fails with `Class extends value undefined`.
- **File naming.** `bun create vite`'s `App.tsx` violates the `KEBAB_CASE` rule. Rename to `app.tsx` and update the import in `main.tsx`.
- **Docs.** Open `<target>/tooling/<tooling-stack>.md` and `<target>/tooling/web.md` for any stack-specific follow-ups (Chrome extension overrides, setup script details).

Do not generate ESLint, Vitest, or Playwright configs. They ship as golden files. Generating from prose duplicates what sync already installed.

Step 4: invoke `verify-scaffold`. Runs the `package.json` scripts and reports pass/fail.

## Report

After the chain, report:

- Domains installed with a check per domain
- Tooling stack synced (or skipped). Name the layers pulled via the extends chain.
- Any post-sync fixups applied (ESLint pin, filename renames)
- `verify-scaffold` outcome
- Any domains or scripts that failed
- Any detection gaps surfaced during resolve
