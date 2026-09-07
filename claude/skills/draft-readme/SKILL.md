---
name: draft-readme
description: Drafts a project's README.md against the readme standard, detecting project type and badge candidates, and confirming with the user before write. Use when asked to "write a README", "draft a README for this project", "add a README", or "create a README.md" where none exists yet or the existing one is unedited scaffold output. Do NOT use to rewrite or resync an existing authored README against a diff, which is `docs-sync`.
---

# Readme draft

Drafts a project's `README.md` end to end: read the standard, detect the project's shape, confirm the draft with the user, then write.

Read these files in parallel:

- `${CLAUDE_SKILL_DIR}/../../standards/readme.md`: voice, structure, required and optional sections, badge selection, and what to link out to rather than carry. Voice is claimed here for a repository-root README, and `write-human` yields it there while keeping rhythm, density, and the machine-tell catalog everywhere, root README included.
- `${CLAUDE_SKILL_DIR}/../../standards/markdown.md`: banned words, punctuation, and formatting for all generated text
- The `write-human` skill: rhythm, density, and sentence construction for all generated text

## Guards

- Default the target to `README.md` at the repository root when no path is given. A caller naming a path under a folder, a harness, or an internal tool is drafting a nested README instead, which keeps the reference voice per the standard's `## Voice` section rather than the root voice below.
- Read the target if it exists.
  - It carries an H1 naming the project: it is authored. Stop: `❌ <path> already exists and covers the project. Run canon:docs-sync instead.`
  - It carries no H1, or its only headings restate the tool that scaffolded it rather than the project: it is unedited generator output. Continue, drafting over it rather than syncing its sections.
  - It does not exist: continue.

## Detect

- Read the project's manifest (`package.json`, `pyproject.toml`, `Cargo.toml`, or equivalent) for a `bin` field or CLI entry point, an installable package name, and its declared dependencies.
- Check for a `claude/skills/` or `.claude/skills/` folder, a `plugin.json`, or a marketplace manifest, each naming an agent-facing or marketplace-distributed surface.
- A project is often several of these at once. Note every type that applies rather than stopping at the first match, since the Draft step covers each one the project actually is.

## Draft

- Draft the page against `${CLAUDE_SKILL_DIR}/../../standards/readme.md`: H1, a 2-3 sentence description in plain text, then the required sections, then whichever optional sections and per-type content the Detect step found.
- Cover every applicable project type from the standard's `## Content` list rather than picking the closest one.
- Candidate badges: check for a published package (a registry field in the manifest), a CI workflow, and a `LICENSE` file.
- State each candidate's rendered value in the preview rather than trusting a fetch's status code, since a badge service answers 200 for a query it cannot satisfy.
- Pin a status badge to the branch the standard names and confirm the workflow actually triggers on that branch before offering it. Zero badges is a correct answer when nothing passes the test.

## Confirm

- Show the resolved path, the detected project types, the badge candidates and what backs each one, and the full drafted content before writing.
- Confirm with the user. This skill waits for that answer rather than treating the tool permission dialog as the gate, since project-type detection and badge selection are judgment calls with no diff to preview them against.

## Write

- Write the file at the confirmed path, creating the folder when it is absent.
- Run `canon markdown audit <path>`.

## Response format

### Preview

**Target:** `<path>` (root | nested)
**Detected:** `<project types>`
**Badges:** `<candidates, or none>`

```markdown
<drafted H1 and body>
```

### After confirmation

```plaintext
✅ Drafted: <path>
```
