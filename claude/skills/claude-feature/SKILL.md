---
name: claude-feature
description: Plans a feature by reading the project's Claude setup and scanning relevant source files. Outputs which files to touch, risks, and ambiguities, then stops. Use before implementing anything, or when asked to "implement X", "add X", "build X", or "I want to add X". Do NOT implement. Plan only.
---

# Claude feature

## Guards

- If no feature description is provided, stop: `❌ No feature description. Describe what you want to add.`
- Do not implement anything. Output the plan and stop.

## Step 1: read the Claude setup

Read these in parallel from the project root, skipping any that do not exist:

- `CLAUDE.md`: behavior rules, conventions, commands
- `.claude/REQUIREMENTS.md`: feature scope and non-goals
- `.claude/ARCHITECTURE.md`: decisions already made
- `.claude/TASKS.md`: current scope and status

Also read these when the feature touches code or UI. Skip them for prose, docs, catalog, or config-only changes:

- `.claude/DESIGN.md`: tokens, typography, spacing, and component rules
- `.claude/WIREFRAMES.md`: intended UI layout and behavior
- `.claude/GOV.md`: coding standards

## Step 2: scan relevant source files

Based on the feature description, identify and read source files that are directly relevant. Do not read entire directories speculatively.

## Step 3: build the plan

Construct the plan with three sections:

- **Files to touch:** each file with a one-line reason
- **Risks:** conflicts, coupling, or tricky spots. If none, use `None identified.`
- **Questions:** numbered list of things to resolve before starting. If none, use `None identified.`

Prefer `None identified.` over low-signal fillers. A small feature should produce a short plan, not a padded one.

## Step 4: output

Decide the mode based on what Step 3 produced:

- **Small** when the plan touches 2 files or fewer, has no architectural or cross-cutting choices, and both Risks and Questions come out `None identified.`
- **Full** otherwise

### Small mode

Output the plan to chat. Do not write a plan file.

```markdown
**Files to touch:**

- `path/to/file`: reason
```

If real questions exist, include a numbered `**Questions:**` section below. Omit empty sections. Do not print `None identified.` in chat.

### Full mode

Derive a 2-to-4-word kebab-case slug from the feature description. Write the full plan to `.claude/plans/feature-<slug>.md` from the project root. Create the directory if it does not exist.

File format:

```markdown
# Feature: <short title>

<feature description>

**Files to touch:**

- `path/to/file`: reason

**Risks:**

- <risk>

**Questions:**

1. <question>
```

Then output in chat:

```
📝 Wrote .claude/plans/feature-<slug>.md

**Questions:**

1. <question>
```

Show only the path line when there are no questions. The `.claude/plans/` directory is gitignored. Do not stage or commit the file.

Do not proceed to implementation until the user explicitly says to continue.
