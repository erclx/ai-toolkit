---
title: Claude skill reference
description: Claude skill structure and authoring rules
---

# Claude skill reference

## Overview

Skills give Claude Code domain-specific constraints and rules inline, so it can act immediately without reading all docs. Each skill body contains actionable rules for its domain. Full reference docs are the fallback for edge cases and deeper context. Skills use progressive disclosure: Claude reads only frontmatter at session start (~100 tokens each), matches a query against descriptions, then loads the full skill body.

## Structure

- Skill is a folder named in kebab-case containing `SKILL.md` (required), `scripts/` (optional), `references/` (optional), `assets/` (optional)
- `SKILL.md` must start with YAML frontmatter between `---` delimiters
- No `README.md` inside the skill folder
- No spaces, capitals, or underscores in folder or skill name

## Frontmatter

- `name` (required): kebab-case, matches folder name, no spaces or capitals
- `description` (required): what it does + when to use it, under 1024 chars, no XML tags
- `disable-model-invocation: true`: user-invoked only, Claude will not auto-trigger
- `allowed-tools`: restrict tool access when the skill is active
- `metadata`: optional key-value pairs (`author`, `version`, `mcp-server`)

## Description

- Structure: `[What it does] + [When to use it] + [Key trigger phrases]`
- Include specific phrases users would say to trigger it
- Be specific, not vague. Claude routes based on this field alone.
- Add negative triggers if skill is over-triggering: `Do NOT use for X`

## Body

- Use imperative voice throughout
- Front-load critical instructions
- Keep `SKILL.md` under 5,000 words. Move detailed docs to `references/`.
- Link to `references/` files explicitly so Claude knows to load them
- Use progressive disclosure: `SKILL.md` for core instructions, `references/` for detail, `scripts/` for deterministic operations
- Use sentence case for all headings (H1, H2, H3)
- When executing multiple independent operations (file reads, shell commands), run them in parallel to reduce latency
- When referencing project files, include "from the project root" in the read instruction
- Contain only behavioral rules (what to do, what not to do) and pointers to reference docs. Narrative descriptions of what files are or how the system works belong in `docs/`, not in the skill body.
- State rules, not inventories. Reference docs for lists that change. Enumerating items in a skill body creates drift when items are added or removed.
- When a rule could enumerate allowed options, phrase it as a ban on the forbidden shape so the rule stays stable as categories are added.
- Cut any rule that resists crisp one-line phrasing. Vague guidance is worse than none.
- Avoid flags that dispatch between alternate flows. The model misreads them and runs the vanilla path. Dry-run-style toggles are fine. For alternate flows, prefer a separate skill or manual invocation of two skills in sequence.
- Before collapsing a manual multi-step flow into a skill, ask what the manual pauses do. Pauses that carry external timing, error-surfacing, or judgment weight are the feature. Prefer a snippet over a skill, or require explicit per-step confirmation.
- Skill success lines emit the full relative path from the project root (`<dir>/<file>`) for any file written, updated, or deleted. Bare filenames are not clickable in the terminal.

## Scripts

- Use `scripts/` for operations that must be deterministic or repetitive
- Claude executes scripts and receives stdout. Scripts are not loaded into context.
- Use XML tags in script output for reliable parsing: `<SECTION>content</SECTION>`
- Use `#!/usr/bin/env bash` shebang
- Always include `2>/dev/null || echo "FALLBACK"` guards on git and shell commands

## Invocation

- Skills auto-trigger when Claude matches the request against the description
- Invoke manually with `/skill-name` or `/<plugin>:skill-name` for plugin skills
- Plugin skills are namespaced: `plugin-name:skill-name`
- Priority order when names conflict: enterprise > personal > project > plugin

## Execution

- Task skills with preview+execute patterns must execute commands immediately after outputting the preview. Do not include "confirm before running" language or pause for user input.
- Claude Code's tool permission dialog is the confirmation gate. The user hits Enter to approve or Escape to interrupt and revise.

## Examples

### Correct

```markdown
---
name: code-review
description: Reviews code for bugs, clarity, and standards compliance. Use when asking to review code, check a PR, or asking "does this look right".
---

# Code review

Before reviewing, read from the project root:

- `standards/code.md`: coding standards and conventions

## Guards

- If no file or diff is provided, stop: `❌ No code to review. Provide a file or diff.`

## Response format

- **Issues found:** <count>
- **Summary:** <one line>

List each issue with file, line, and suggested fix.
```

### Incorrect

```markdown
---
name: code-review
description: Handles all code-related tasks in scripts/, src/, and lib/. Also activate when user mentions bugs, refactoring, testing, linting, formatting, or any file ending in .ts .js .py .sh. # path-focused + keyword-stuffed
---

# Code review

A good code review should check for bugs, performance issues, security vulnerabilities,
code style, naming conventions, test coverage, documentation, error handling,
edge cases, and adherence to SOLID principles... # dumps everything inline instead of referencing standards
```
