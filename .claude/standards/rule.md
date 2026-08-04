---
title: Governance rule reference
description: Rule frontmatter, body shape, and voice for .claude/rules files
---

# Governance rule reference

## Overview

Rules give Claude Code coding constraints scoped to file paths. Claude Code discovers `.claude/rules/**/*.md` at session start. A rule with no `paths:` field always applies, at the same priority as `CLAUDE.md`. A rule with `paths:` applies when Claude reads a file matching the glob. Author one rule per topic so the scope stays precise.

## Scope

Governs governance rules under `.claude/rules/`: their location, numbering, frontmatter, and body shape.

Does not govern:

- Authoring conventions for a document type, which are standards rather than rules. A rule points at the standard that owns one and never restates it.
- Skill folders and skill frontmatter: `skill.md`
- Cross-domain behavior rules, which live in `CLAUDE.md` at the project root

## Whether a skill belongs behind the rule

A rule fires on a path match with no decision from the session, which is what makes it a floor. Every bullet is one directive and nothing else, so an invariant needing procedure, worked cases, or a branch on project state has no room in the body.

Run the two-part test in reverse before calling the rule finished. The rule already holds what fires on a path edit and ships silently when violated. Ask what a session still needs past the directive, and give that to a skill the rule points at, because a rule that grows a procedure has become a skill body wearing rule frontmatter.

Write both when both apply. A rule stating the directive and a skill stating how to carry it out are one invariant at two depths rather than two copies of it, and `skill.md` carries the same checkpoint for a session arriving from the other side. Nothing checks either one.

## Location

- Rules live at `.claude/rules/<subdirectory>/<n>-<slug>.md`
- Subdirectories group by domain: `core/`, `lang/`, `framework/`, `lib/`, `ui/`, `claude/`
- `<n>` is a number in the subdirectory's band and `<slug>` is a one-to-three-word kebab topic
- Scaffold a rule with a number that collides with neither the project's rules nor any installed shared rule set
- Give every rule a numeric prefix. A bare-word filename reads as a folder name where a stack names its rules, so a rule without one is unreachable from a stack entry.

## Two sources numbering into one folder

A shared rule set and a project's own rules land in the same installed folder and draw from the same band, so the two need a division or they collide. Divide the band by source rather than by topic: one source takes the top of each band and the other takes the gaps between the tens. A rule set that ships to targets should take the tens, since it is the source a project cannot renumber.

The collision this prevents is silent. Two rules that resolve to the same `<n>-<slug>` path leave one file in the installed folder, and neither the install nor the session that reads it reports which source lost. Nothing checks the division, so it holds only while both sources follow it.

State the division where the rule sources are described, not in the rules themselves. A rule states its own topic, and a numbering convention spanning two sources belongs to whatever documents the pair.

## Frontmatter

- `description` (required): one line naming what the rule enforces and where
- `paths` (optional): one glob per entry, for a rule scoped to a file set
- Omit `paths` for an always-on rule that states a global principle with no file scope
- Do not emit the legacy Cursor keys `globs`, `alwaysApply`, or `priority`. They are not read.

```yaml
---
description: Enforce strict Python type hints, casing, and import patterns
paths:
  - '**/*.py'
---
```

## Body

- Open with an H1 `# <Topic> standards` in sentence case, then group rules under H2 sections. Proper nouns keep their casing (`# TypeScript standards`, `# Next.js standards`).
- Use imperative voice for every rule (`Prefix booleans with is`, not `Booleans should be prefixed`)
- State one rule per bullet as a single directive line
- State what to do and what not to do. Do not explain the reasoning behind a rule.
- Phrase a rule as a ban on the forbidden shape when it could otherwise enumerate allowed options, so it stays stable as categories grow
- Cut any rule that resists crisp one-line phrasing. Vague guidance is worse than none.
- Keep the file to one topic. A second topic is a second rule file.
- Do not restate a rule that a sibling rule or `CLAUDE.md` already owns. Point once, never duplicate.

## Examples

### Correct

```markdown
---
description: Enforce naming conventions for functions, booleans, and collections
paths:
  - '**/*.ts'
---

# Naming standards

## Semantics

- Prefix booleans with `is`, `has`, `should`, or `can`
- Name functions as actions describing what they do
- Name collections as plurals and items as singulars
```

### Incorrect

```markdown
---
description: Naming
globs: '**/*.ts'
alwaysApply: false
---

# Naming

Good naming matters because it makes code easier to read and maintain, so you
should always pick descriptive names. Booleans are usually prefixed with is or
has, and it can also be a good idea to think about collections too.
```
