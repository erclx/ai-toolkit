---
name: claude-memory-review
description: Reviews `.claude/memory/` and proposes per-entry actions (promote to `CLAUDE.md`, move into a skill body, hand off to governance, or delete as stale). Use when asked to "review memory", "clean up memory", "promote memory", "consolidate memories", or "check `.claude/memory/` for drift". Do NOT auto-apply. Output a grouped proposal and wait for block-by-block approval.
---

# Claude memory review

## Guards

- All `.claude/memory/` reads, edits, and deletes resolve at the main worktree root, not the current worktree. See Worktrees in `CLAUDE.md`.
- If no `.claude/memory/` directory exists at the main worktree root, stop: `❌ No .claude/memory/ directory found.`
- If `.claude/memory/` contains no `*.md` entries other than `MEMORY.md`, stop: `✅ No memory entries to review.`

## Step 1: read the memory folder

Read in parallel from the project root:

- `.claude/memory/MEMORY.md`: the index
- every other `*.md` file under `.claude/memory/`: individual entries with frontmatter (`name`, `description`, `type`)

## Step 2: read promotion targets

Read in parallel from the project root. Skip any file or folder that does not exist.

- `CLAUDE.md`: project behavior rules and Content ownership section
- every `SKILL.md` under `.claude/skills/`: domain-scoped internal skill bodies
- every `SKILL.md` under `claude/skills/`: plugin skill bodies
- every `*.md` under `standards/`: authoring references
- every `*.mdc` under `governance/rules/`: coding-standards rules

## Step 3: classify each entry

For each memory entry, pick one action:

- **Promote to `CLAUDE.md`**: the rule is cross-domain behavior or a design principle applied across the whole project.
- **Promote to a skill body**: the rule fires only when editing a specific path-scoped domain. Name the target skill.
- **Promote to a standards file**: the rule is an authoring reference that belongs in `standards/<domain>.md`.
- **Hand off to governance**: the rule is coding-standards class (typescript, testing, naming, error-handling, performance, logging, concurrency, planning). Do not author the `.mdc` file inline. Point the user at `aitk-governance` and `prompts/cursor-rules.md` and stop at handoff.
- **Delete**: the rule is stale, already absorbed into a durable surface, too vague to phrase as a rule, or a one-time incident narrative.

When two or more memories collapse into one rule on the same target, propose them as a single merged edit under the matching promote category. The consolidate case is a variant of promote, not a separate action.

### Absorbed-already check

Before proposing promote, grep the target surface for the rule's keywords. If the rule is already stated there, the action is **Delete**, not promote. Do not rely on memory-file claims that a rule is documented elsewhere. Verify.

### Crispness check

Rules that resist crisp one-line phrasing default to **Delete** over promote. Never promote a memory unchanged. Rewrite to match the destination surface's tone. Use terser phrasing for `CLAUDE.md` and imperative phrasing for skill bodies.

## Step 4: output the proposal

Group by action. Number every item across groups so the user can approve by number.

```plaintext
Promote to CLAUDE.md
  1. <memory-file>     → <target section>    : <one-line reason>

Promote to skill body
  2. <memory-file>     → <skill>/SKILL.md    : <one-line reason>

Promote to standards
  3. <memory-file>     → standards/<file>.md : <one-line reason>

Hand off to governance
  4. <memory-file>     → author .mdc rule    : <one-line reason>

Delete
  5. <memory-file>                           : <one-line reason>
```

After the groups, show each proposed edit's rewritten text inline so the user can judge tone before approving. For deletes, show only the reason. For governance handoffs, show only the pointer. Do not draft the rule.

## Step 5: apply approved items

Wait for the user to reply with `all`, `none`, or a comma-separated list of numbers. Apply only what they picked.

For each approved item:

- **Promote**: use `Edit` to insert the rewritten rule into the target surface. Then delete the memory file and remove its row from `.claude/memory/MEMORY.md`.
- **Hand off**: do not edit governance. Delete the memory file only if the user confirmed the handoff explicitly. Otherwise leave it in place.
- **Delete**: remove the memory file and its row from `.claude/memory/MEMORY.md`.

Apply edits one at a time via `Edit`. Claude Code's tool permission dialog is the confirmation gate per edit. Never rewrite a whole file.

## After completion

Output one line per action taken:

- `✅ Promoted: .claude/memory/<memory-file> → <target>`
- `✅ Handed off: .claude/memory/<memory-file> → governance`
- `🗑  Deleted: .claude/memory/<memory-file>`

If the user accepted nothing, output:

`✅ No changes applied.`
