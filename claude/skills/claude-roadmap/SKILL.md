---
name: claude-roadmap
description: Drafts or updates `.claude/ROADMAP.md` by sequencing the MVP scope from `.claude/REQUIREMENTS.md` into ordered versions, each a usable increment. Use when asked to "draft a roadmap", "build the roadmap", "sequence the versions", "plan the roadmap", or "update the roadmap". Do NOT break versions into task-level steps. That is `claude-feature` and `.claude/tasks/`.
---

# Claude roadmap

## Guards

- If `.claude/REQUIREMENTS.md` is absent or has no MVP features, stop: `❌ No requirements to sequence. Draft .claude/REQUIREMENTS.md first.`
- If the requirements file carries a later scope section, stop per Lifecycle gate below
- Sequence versions and their outcomes only. Do not produce file lists or task steps.

## Lifecycle gate

A roadmap sequences the MVP list alone, so a later scope section means that list has shipped and a fresh requirements pass owns what follows. The rule is the Lifecycle section of `.claude/standards/requirements.md`, falling back to `${CLAUDE_SKILL_DIR}/../../standards/requirements.md` when the project has no copy.

- A later scope section is a `##` heading after `## MVP features` that `.claude/standards/requirements.md` names nowhere, neither among the six it fixes nor as the conditional `## Distribution`
- On finding one, stop: `❌ MVP scope already sequenced. ## <section> is later scope, which a fresh requirements pass sequences rather than this roadmap. Say to sequence it anyway to override.`
- Draft without the gate when neither copy of the standard resolves. Refusing on a rule that could not be read stops more than it protects.
- When the caller overrides, sequence the later scope section's entries as versions and proceed

## Step 1: read context

Read these in parallel from the project root, skipping any that do not exist:

- `.claude/REQUIREMENTS.md`: the MVP feature scope to sequence
- `.claude/ROADMAP.md`: the existing roadmap, when updating rather than drafting
- `.claude/tasks/index.md`: what is in flight, to mark the active version
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

Unlike `.claude/plans/` and `.claude/tasks/`, `.claude/ROADMAP.md` is committed. Do not stage or commit it here. Leave staging to the git skills.

## Step 4: output

```markdown
📝 Wrote .claude/ROADMAP.md

<N> versions sequenced. Active: vX.Y.

Next: /claude-feature for the first version's opening feature.
```

When updating, replace the first line with `📝 Updated .claude/ROADMAP.md` and name which versions changed.
