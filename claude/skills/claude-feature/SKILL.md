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
- `.claude/DESIGN.md`: tokens, typography, spacing, and component rules
- `.claude/TASKS.md`: current scope and status
- `.claude/WIREFRAMES.md`: intended UI layout and behavior
- `.claude/GOV.md`: coding standards

## Step 2: scan relevant source files

Based on the feature description, identify and read source files that are directly relevant. Do not read entire directories speculatively.

## Step 3: build the plan

Construct the plan with three sections:

- **Files to touch:** each file with a one-line reason
- **Risks:** conflicts, coupling, or tricky spots. If none, use `None identified.`
- **Questions:** numbered list of things to resolve before starting. If none, use `None identified.`

## Step 4: persist

Derive a 2-to-4-word kebab-case slug from the feature description. Write the full plan directly to `.claude/plans/feature-<slug>.md` from the project root. Create the directory if it does not exist.

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

The `.claude/plans/` directory is gitignored. Do not stage or commit the file.

## Step 5: chat output

Output only the file path and the Questions section (so the user can resolve them inline before approving). Do not repeat Files to touch or Risks in chat. They live in the file.

```
📝 Wrote .claude/plans/feature-<slug>.md

**Questions:**

1. <question>
2. <question>
```

If there are no questions, output only the path line and stop.

Do not proceed to implementation until the user explicitly says to continue.
