---
description: Plans a feature by reading the project's Claude setup and scanning relevant source files. Outputs which files to touch, risks, and ambiguities, then stops. Use before implementing anything.
---

# Claude feature

## Guards

- If no feature description is provided, stop: `❌ No feature description. Describe what you want to add.`
- Do not implement anything. Output the plan and stop.

## Step 1: read the project setup

Read these in parallel from the project root, skipping any that do not exist:

- `CLAUDE.md`: behavior rules, conventions, commands
- `GEMINI.md`: behavior rules, conventions, commands
- `.claude/REQUIREMENTS.md`: feature scope and non-goals
- `.claude/ARCHITECTURE.md`: decisions already made
- `.claude/DESIGN.md`: tokens, typography, spacing, and component rules
- `.claude/TASKS.md`: current scope and status
- `.claude/WIREFRAMES.md`: intended UI layout and behavior

## Step 2: scan relevant source files

Based on the feature description, identify and read source files that are directly relevant. Do not read entire directories speculatively.

## Step 3: output the plan

**Summary:** three to five one-line bullets covering the goal, main deliverables, and key trade-off or decision. Skip for small plans that fit in a few lines total.

**Files to touch:** list each file with a one-line reason

**Risks:** list conflicts, coupling, or tricky spots. If none, write `None identified.`

**Questions:** numbered list of things to resolve before starting. If none, write `None identified.`

Stop here. Do not proceed to implementation until the user explicitly says to continue.
