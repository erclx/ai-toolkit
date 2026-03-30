# Antigravity workflow reference

## Overview

Antigravity workflows are markdown files that give the AI agent domain-specific instructions for a project. They live in `.agent/workflows/` at the project root and are invoked by slash command or matched automatically when Antigravity recognizes the intent.

## Structure

- One `.md` file per workflow, named in kebab-case
- File path: `.agent/workflows/<name>.md`
- Must start with YAML frontmatter between `---` delimiters
- No subfolders inside `workflows/`

## Frontmatter

```yaml
---
description: <what it does + when to invoke it>
---
```

`description` (required): one sentence. What it does and when to use it. Include key trigger phrases. Antigravity matches the user's request against this field. Keep under 200 chars.

## Body

- Use imperative voice throughout
- Front-load critical instructions and guards
- Use sentence case for all headers (H1, H2, H3)
- When executing multiple independent shell commands, run them in parallel
- Reference project files with "from the project root" in read instructions
- Do not hardcode file paths. Use discovery patterns where possible.

## Guards

Always define guards as the first executable step. Guards prevent the workflow from running in an invalid state:

```markdown
## Guards

- If <condition>, stop: `❌ <reason>`
```

## Turbo annotations

Use `// turbo` above a step to allow Antigravity to auto-run that `run_command` without asking:

```markdown
// turbo

1. Run `git status --short`
```

Use `// turbo-all` anywhere in the file to auto-run every command in the workflow.

Only annotate safe, read-only commands (e.g. `git status`, `git diff`). Never annotate destructive commands (`git push`, `git commit`, file writes).

## Preview before execute

For any workflow that writes files, commits, or pushes, show a preview first:

```markdown
Show PREVIEW first, then propose FINAL COMMAND block. Do not run until user confirms.
```

## After execution

End every workflow with a single-line confirmation:

```markdown
## After execution

Output exactly one line:

`✅ <past-tense summary>`
```

## Invocation

- Slash command: `/workflow-name` → Antigravity reads `.agent/workflows/workflow-name.md`
- Auto-trigger: Antigravity matches the user's request against `description` and loads the workflow automatically
- Chain workflows by referencing other slash commands inline: `Run the /git-branch workflow`
