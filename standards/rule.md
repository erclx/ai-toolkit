---
title: Governance rule reference
description: Rule frontmatter, body shape, and voice for .claude/rules files
---

# Governance rule reference

## Overview

Rules give Claude Code coding constraints scoped to file paths. Claude Code discovers `.claude/rules/**/*.md` at session start. A rule with no `paths:` field always applies, at the same priority as `CLAUDE.md`. A rule with `paths:` applies when Claude reads a file matching the glob. Author one rule per topic so the scope stays precise.

## Location

- Rules live at `.claude/rules/<subdirectory>/<n>-<slug>.md`
- Subdirectories group by domain: `core/`, `lang/`, `framework/`, `lib/`, `ui/`, `claude/`
- `<n>` is a number in the subdirectory's band and `<slug>` is a one-to-three-word kebab topic
- Use `create-rule` to scaffold a rule with a number that collides with neither the project nor the toolkit catalog

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

- Open with an H1 `# <TOPIC> STANDARDS` in caps, then group rules under H2 sections. Caps H1 is the rule-body convention and overrides the sentence-case heading rule for reference prose.
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

# NAMING STANDARDS

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
