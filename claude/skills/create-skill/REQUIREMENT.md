---
name: create-skill
description: What skill creation is for, the gaps it closes, and why it confirms before writing
---

# Create skill requirement

## Gap

Without this skill, a new skill lands in the wrong shape and the wrong place. A session writes `SKILL.md` from its own idea of the format, writes malformed frontmatter that Claude Code routes on, and never opens the authoring standard that already answers every question it guessed at.

## Must

- Read the authoring standard and the prose standard before drafting, so the draft starts conformant rather than getting corrected into shape
- Confirm the name and the full body with the user before writing. The name is the routing key and a folder that disagrees with its frontmatter fails silently.
- Write to the conventional skills path, so discovery finds it without configuration

## Must not

- Auto-trigger. Creation is a deliberate act and a skill invented from an ambiguous request is worse than none.
- Write before the user has seen the body

## Guards

- The authoring standard is not installed: stop and name the command that installs it

## Out of scope

- Editing an existing skill, which the authoring standard and the skill's own requirement govern
- Judging whether the skill is warranted. A skill nobody needed is an audit finding, not a creation-time refusal.
