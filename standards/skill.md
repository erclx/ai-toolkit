# Claude skill reference

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
- Keep `SKILL.md` under 5,000 words — move detailed docs to `references/`
- Link to `references/` files explicitly so Claude knows to load them
- Use progressive disclosure: `SKILL.md` for core instructions, `references/` for detail, `scripts/` for deterministic operations
- Headers: sentence case for all levels (H1, H2, H3)

## Scripts

- Use `scripts/` for operations that must be deterministic or repetitive
- Claude executes scripts and receives stdout — scripts are not loaded into context
- Use XML tags in script output for reliable parsing: `<SECTION>content</SECTION>`
- Use `#!/usr/bin/env bash` shebang
- Always include `2>/dev/null || echo "FALLBACK"` guards on git and shell commands

## Invocation

- Skills auto-trigger when Claude matches the request against the description
- Invoke manually with `/skill-name` or `/<plugin>:skill-name` for plugin skills
- Plugin skills are namespaced: `plugin-name:skill-name`
- Priority order when names conflict: enterprise > personal > project > plugin

## Examples

### Correct

```markdown
---
name: code-review
description: Reviews code for bugs, clarity, and standards compliance. Use when asking to review code, check a PR, or asking "does this look right".
---

# Code review

Before reviewing, read:

- \`standards/code.md\`: coding standards and conventions

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
