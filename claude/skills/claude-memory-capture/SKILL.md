---
name: claude-memory-capture
description: Extracts durable patterns from the current session and writes them to `.claude/memory/` as feedback, project, user, or reference memory files. Use when asked to "capture memory", "capture lessons", "wrap up the session", "end of session memory", or as the final step in autoship. Do NOT use to curate existing memory. Use `claude-memory-review` for that.
---

# Claude memory capture

Scan the current session for patterns worth persisting, write them as memory files, and update the index. Pair with `claude-memory-review` for later curation.

## Guards

- If `.claude/memory/` does not exist, create it.
- If the session produced no user corrections, confirmations, or context disclosures worth persisting, stop: `✅ Nothing worth capturing.`

## Step 1: read context

Read in parallel from the project root, skipping any that do not exist:

- `CLAUDE.md`: Memory section rules, including save thresholds and file format overrides
- `.claude/memory/MEMORY.md`: existing index, to avoid duplicates
- `standards/prose.md`: prose conventions applied to memory file bodies

## Step 2: classify candidates

Scan the session and group candidate patterns into four types:

- **feedback**: explicit user corrections, stated preferences, or non-obvious confirmations
- **project**: decisions, initiatives, deadlines, or motivations not derivable from git or code
- **user**: role, expertise, responsibilities, or working preferences
- **reference**: pointers to external systems (dashboards, trackers, channels)

Apply the save threshold: a feedback memory only fires on explicit user correction, or on a pattern that repeated twice in the session. First-occurrence slips are noise. Project, user, and reference memories fire on first disclosure.

## Step 3: dedupe

For each candidate, grep `.claude/memory/` for an existing file on the same topic. If one exists, update it in place rather than create a new file.

## Step 4: write

For each new memory, write to `.claude/memory/<type>-<slug>.md` with this frontmatter:

```markdown
---
name: <memory name>
description: <one-line description, under 100 chars, no trailing period>
type: <feedback|project|user|reference>
---

<memory body>
```

Feedback and project bodies must be three lines: the rule or fact on one line, a `**Why:**` line naming the session signal, and a `**How to apply:**` line for when the rule fires next. Keep each line tight. No narrative.

User and reference bodies are a single sentence each.

Then append a row to the matching table in `.claude/memory/MEMORY.md`:

```markdown
| <name> | <file> | <description> |
```

## Output

Respond with one line per memory written or updated:

- `✅ Wrote: .claude/memory/<file> (<type>)`
- `✏️ Updated: .claude/memory/<file> (<type>)`

If nothing was captured, output:

`✅ Nothing worth capturing.`
