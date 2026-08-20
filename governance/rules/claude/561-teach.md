---
description: Route .claude/teach/ edits to the teach standard for layout, ordinal naming, and the mission and record formats, in the projects that open a learning workspace
paths:
  - '.claude/teach/**'
---

# Teach standards

## What a workspace keeps

- Never renumber an existing folder, lesson, or record. A later reader cites it by the name it opened under.
- Write every success line as a task the learner can be asked to perform, never as something they will understand.
- Keep a reference page free of the learner. A page carrying second person or a quiz belongs under `lessons/`.
- Record the wrong answer a learner gave, never a count of what they missed.
- Date the workspace once, in the `MISSION.md` frontmatter. Never repeat the date in the body of any file.

## Authority

- Follow `.claude/standards/teach.md` for the folder layout, ordinal naming, frontmatter, and the mission and learning-record formats. It is the single source.
- Read `references/glossary.md` inside the `claude-teach` skill for the glossary every workspace carries at its root. It is the single source for the entry shape, the ordering, and which terms the file carries. Read it rather than invoking the skill, which resumes a workspace and runs lessons.
- Report it rather than proceeding silently when that file does not resolve. It ships with the plugin and this rule ships with the CLI, so a project that installed governance alone does not have it.
