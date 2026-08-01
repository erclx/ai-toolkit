---
name: create-rule
description: Scaffolds a project-specific governance rule into `.claude/rules/<subdir>/<n>-<slug>.md` with correct frontmatter and a non-colliding number. Use when asked to "add a rule", "create a governance rule", "write a project rule", or when a project needs a coding rule the toolkit does not ship. Do NOT use to edit toolkit source rules under `governance/rules/`.
---

# Create rule

Author a project-local governance rule. The rule lives in the target project, not the toolkit, so it is never overwritten by `aitk gov sync` (sync skips rules with no toolkit source match).

## Guards

- If no `.claude/` directory exists, stop: `❌ No .claude/ directory found. Run aitk init first.`
- If the request names no behavior to enforce, stop: `❌ Describe what the rule should enforce and which files it applies to.`

## Step 1: gather intent

Resolve both from the request, and ask only for what is missing. Attach a proposed default derived from the request.

- What the rule enforces: one topic, phrased as a standard (`<topic> conventions`).
- Scope: a path glob relative to the project root (`<dir>/**/*.<ext>`) for a path-scoped rule, or always-on when the rule states a global principle with no file scope.

## Step 2: resolve band and subdir

Pick the band from the topic. Each band owns a number range and a subdir under `.claude/rules/`:

- `core/` 000-099: global persona, testing, error handling, planning. Always-on, no `paths:`.
- `lang/` 100-199: one programming language.
- `framework/` 200-299: one framework.
- `lib/` 300-399: one library or tool.
- `ui/` 400-499: UI copy, accessibility, forms.
- `claude/` 500-599: `.claude/` authoring surfaces.

## Step 3: pick a free number

Pick the lowest unused number in the band that collides with neither the project nor the toolkit catalog:

- Scan the target's `.claude/rules/<subdir>/` for used prefixes.
- Run `aitk gov list --json 2>/dev/null` and read the shipped rule numbers in the same range, so a later `aitk gov install` cannot double-book the number.
- If `aitk` is not on PATH, scan the target only and warn that a future toolkit install could collide.

## Step 4: write the rule

Read `.claude/standards/rule.md` for frontmatter, body shape, and voice before writing the body, or `${CLAUDE_SKILL_DIR}/../../standards/rule.md` when the project does not have it. Do not work the shape from memory.

Write `.claude/rules/<subdir>/<n>-<slug>.md` where `<slug>` is a 1-to-3-word kebab topic. Preview the resolved path, band, number, and frontmatter, then write immediately. The tool permission dialog is the confirmation gate.

Frontmatter carries the Claude shape. Path-scoped rules emit one `paths:` entry per glob. Always-on rules omit `paths:` entirely.

```markdown
---
description: <one line, what the rule enforces and where>
paths:
  - '<glob>'
---

# <Topic> standards

## <Group>

- <imperative rule>
- <imperative rule>
```

Title casing is sentence case, with proper nouns keeping their own casing (`# TypeScript standards`). `.claude/standards/rule.md` owns the rest of the body shape.

## After writing

Emit the full path on its own line: `.claude/rules/<subdir>/<n>-<slug>.md`. Remind the user that Claude Code loads path-scoped rules when it reads a matching file, and always-on rules every session.
