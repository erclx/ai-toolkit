---
name: claude-memory-capture
description: Extracts durable patterns from the current session, routes a domain fact to the context entry that owns it, and writes the residue to `.claude/memory/` as feedback, project, user, or reference files. Use when asked to "capture memory", "capture lessons", "wrap up the session", "end of session memory", or as a step in autoship. Do NOT use to curate existing memory. Use `claude-memory-review` for that.
---

# Claude memory capture

Scan the current session for patterns worth persisting, send each to the surface that owns it, and leave in `.claude/memory/` only what no surface owns. Pair with `claude-memory-review` for later curation.

A fact about a domain belongs in that domain's context entry, which the three-tier model already loads on demand. Writing it to memory instead puts it in a folder nothing opens. Routing is therefore the point of this skill and the memory file is the fallback.

## Guards

- All `.claude/memory/` reads and writes resolve at the main worktree root, not the current worktree. See Worktrees in `CLAUDE.md`.
- If `.claude/memory/` does not exist at the main worktree root, create it, along with an `index.md` carrying `title` and `subtitle` frontmatter. `aitk claude init` seeds both, and a project predating that seed has neither. Regeneration errors without the index, so the first write into a bare folder would report a frontmatter failure against a file that is fine.
- If the session produced no user corrections, confirmations, or context disclosures worth persisting, stop: `✅ Nothing worth capturing.`
- Routing edits a tracked file, so it runs only where the caller commits. When the session is in the main worktree, or the caller states it does not commit, skip Step 3 and write every candidate as a memory file. `claude-orchestrate` is the caller this covers.

## Step 1: read context

Read in parallel from the project root, skipping any that do not exist:

- `CLAUDE.md`: Memory section rules, including save thresholds and file format overrides
- `.claude/memory/index.md`: existing index, to avoid duplicates
- `.claude/context/index.md`: the domain catalog Step 3 routes against
- `.claude/standards/prose.md`: prose conventions applied to memory file bodies

Read a standard from `${CLAUDE_SKILL_DIR}/../../standards/` instead when the project does not have it.

## Step 2: classify candidates

Scan the session and group candidate patterns into four types:

- **feedback**: explicit user corrections, stated preferences, or non-obvious confirmations
- **project**: decisions, initiatives, deadlines, or motivations not derivable from git or code
- **user**: role, expertise, responsibilities, or working preferences
- **reference**: pointers to external systems (dashboards, trackers, channels)

Apply the save threshold: a feedback memory only fires on explicit user correction, or on a pattern that repeated twice in the session. First-occurrence slips are noise. Project, user, and reference memories fire on first disclosure.

## Step 3: route what a context entry owns

Only a **project** candidate is routable. Feedback, user, and reference describe how to work or who to ask rather than how a domain behaves, and no context entry owns them.

For each project candidate, match its subject against `.claude/context/index.md`. The test is a named entry, not a judgment about fit: the fact names a surface that already has an entry in the catalog. Route it to that entry.

Fail closed. A project candidate matching no entry stays a memory file, and so does one matching two entries where neither is clearly the owner. The residue is what the folder is for, and a fact filed under the wrong entry is worse than one in memory because a context entry is a surface sessions trust.

Do not edit a context entry here. `claude-docs` owns those edits and folds the routed facts in on its own pass, or two skills write one file at the same step. Write each routed fact to `.claude/.tmp/memory-routing/<slug>.md` at the main worktree root instead, appending when the file exists:

```markdown
## .claude/context/<domain>.md

<the fact in one or two sentences, stated as a fact about the domain rather than as a session narrative>
```

Derive `<slug>` per `.claude/standards/slug.md`, or `${CLAUDE_SKILL_DIR}/../../standards/slug.md` when the project does not have it. Fall back to `latest` on an empty result.

The handoff is a file rather than a spoken result so the routed fact survives a compaction between this step and the `claude-docs` pass, and so the standalone caller leaves something behind for a later `/claude-docs` to consume.

## Step 4: dedupe

For each remaining candidate, grep `.claude/memory/` for an existing file on the same topic. If one exists, update it in place rather than create a new file.

## Step 5: write the residue

For each new memory, write to `.claude/memory/<type>-<slug>.md` with this frontmatter:

```markdown
---
title: <one-line human title, as it should read in the index>
description: <one-line description per .claude/standards/prose.md § Frontmatter descriptions>
category: <Feedback|Project|User|Reference>
---

<memory body>
```

`category` is the type in sentence case, which is what the index renderer groups on, while the filename keeps the lowercase `<type>-` prefix. A description opening with a backtick or a colon needs single quotes, or the frontmatter fails to parse and the index goes stale.

Feedback and project bodies must be three lines: the rule or fact on one line, a `**Why:**` line naming the session signal, and a `**How to apply:**` line for when the rule fires next. Keep each line tight. No narrative.

User and reference bodies are a single sentence each.

Do not edit the index. `.claude/memory/index.md` is generated from sibling frontmatter by a `PostToolUse` hook, the same way the task board's index is, so a hand-appended row is drift the next regeneration discards.

## Output

Respond with one line per fact routed, written, or updated:

- `➡️ Routed: <fact subject> → .claude/context/<domain>.md`
- `✅ Wrote: .claude/memory/<file> (<type>)`
- `✏️ Updated: .claude/memory/<file> (<type>)`

When anything routed, add a line naming the handoff so the caller knows a `claude-docs` pass is owed:

`→ Routed facts wait at .claude/.tmp/memory-routing/<slug>.md. Run /claude-docs to fold them in.`

Omit that line when the caller runs `claude-docs` itself later in its own chain.

When at least one memory file was written or updated, add a closing line so the standalone caller proposes fixes while context is fresh:

`→ Run /claude-memory-review to propose fixes for the pen before the session ends.`

The ship skills run review Propose themselves, so this line is for the standalone `/claude-memory-capture` path.

If nothing was captured, output:

`✅ Nothing worth capturing.`
