---
name: claude-roadmap
description: Drafts or updates `.claude/ROADMAP.md` by sequencing the MVP scope from `.claude/REQUIREMENTS.md` into ordered versions, each a usable increment. Use when asked to "draft a roadmap", "build the roadmap", "sequence the versions", "plan the roadmap", or "update the roadmap". Do NOT break versions into task-level steps. That is `claude-feature` and `.claude/TASKS.md`.
---

# Claude roadmap

## Guards

- If `.claude/REQUIREMENTS.md` is absent or has no MVP features, stop: `❌ No requirements to sequence. Draft .claude/REQUIREMENTS.md first.`
- Sequence versions and their outcomes only. Do not produce file lists or task steps.

## Step 1: read context

Read these in parallel from the project root, skipping any that do not exist:

- `.claude/REQUIREMENTS.md`: the MVP feature scope to sequence
- `.claude/ROADMAP.md`: the existing roadmap, when updating rather than drafting
- `.claude/TASKS.md`: what is in flight, to mark the active version
- `.claude/ARCHITECTURE.md`: technical dependencies that constrain ordering

Follow `${CLAUDE_SKILL_DIR}/references/roadmap.md` for the doc shape, sections, and version format.

## Step 2: sequence

Group the MVP features into versions, each a usable increment that stands on its own. Order the versions by two forces:

- Dependency: a version that produces data or a contract another version consumes comes first.
- De-risking: a version that de-risks an unproven subsystem comes early, inside the version that first needs it.

For each version, state the observable outcome as what the user can then do, list the features it groups by name, and note what it depends on and why.

When updating an existing roadmap, preserve rows that still hold. Resequence, add, or split only where scope shifted. Do not rewrite rows that did not change.

## Step 3: write

Write the roadmap to `.claude/ROADMAP.md` at the project root, following `${CLAUDE_SKILL_DIR}/references/roadmap.md`. Create the file when absent.

Unlike `.claude/plans/` and `.claude/TASKS.md`, `.claude/ROADMAP.md` is committed. Do not stage or commit it here. Leave staging to the git skills.

## Step 4: output

```markdown
📝 Wrote .claude/ROADMAP.md

<N> versions sequenced. Active: vX.Y.

Next: /claude-feature for the first version's opening feature.
```

When updating, replace the first line with `📝 Updated .claude/ROADMAP.md` and name which versions changed.
