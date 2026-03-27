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

## Step 3: output the plan

**Files to touch:** list each file with a one-line reason

**Risks:** list conflicts, coupling, or tricky spots. If none, write `None identified.`

**Questions:** numbered list of things to resolve before starting. If none, write `None identified.`

Stop here. Do not proceed to implementation until the user explicitly says to continue.
