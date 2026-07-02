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

- What the rule enforces: one topic, phrased as a standard (`SQLModel table and session conventions`).
- Scope: a path glob relative to the project root (`backend/**/*.py`) for a path-scoped rule, or always-on when the rule states a global principle with no file scope.

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

Write `.claude/rules/<subdir>/<n>-<slug>.md` where `<slug>` is a 1-to-3-word kebab topic. Preview the resolved path, band, number, and frontmatter, then write immediately. The tool permission dialog is the confirmation gate.

Frontmatter carries the Claude shape. Path-scoped rules emit one `paths:` entry per glob. Always-on rules omit `paths:` entirely.

```markdown
---
description: <one line, what the rule enforces and where>
paths:
  - '<glob>'
---

# <TOPIC> STANDARDS

## <Group>

- <imperative rule>
- <imperative rule>
```

Rule anatomy:

- Title is the topic in screaming case followed by `STANDARDS`.
- Group bullets under `## <Group>` headings by sub-topic.
- Each bullet is one imperative rule. State the rule, not the rationale.
- Point at a sibling rule by path when one governs a shared concern (`per .claude/rules/framework/220-fastapi.md`).
- Follow `.claude/standards/prose.md` for all prose.

## After writing

Emit the full path on its own line: `.claude/rules/<subdir>/<n>-<slug>.md`. Remind the user that Claude Code loads path-scoped rules when it reads a matching file, and always-on rules every session.
