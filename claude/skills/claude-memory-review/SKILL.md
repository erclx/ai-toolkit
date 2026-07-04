---
name: claude-memory-review
description: Reviews `.claude/memory/` and proposes per-entry actions (promote to `CLAUDE.md`, move into a skill body, hand off to governance, or delete as stale). Also runs the discuss, challenge, apply, and cleanup phases on an existing review file. Use when asked to "review memory", "discuss memory questions", "challenge the promotes", "apply memory decisions", "cleanup memory review", "promote memory", or "consolidate memories". Do NOT auto-apply. Output a grouped proposal and wait for block-by-block approval.
---

# Claude memory review

This skill drives the full memory review lifecycle in five phases. Pick the phase from what the user said and whether a review receipt already exists at `<main-root>/.claude/review/memory-review-*.md`.

| User intent                                    | Phase     | Mutates                      |
| ---------------------------------------------- | --------- | ---------------------------- |
| "review memory", "promote memory" (no receipt) | Propose   | review file only             |
| "challenge the promotes" (receipt exists)      | Challenge | review file only             |
| "discuss", "respond to questions"              | Discuss   | review file only             |
| "apply decisions", "commit", "ship the review" | Apply     | tracked files + memory files |
| "cleanup", "sweep stale", "delete the receipt" | Cleanup   | memory files + review file   |

If the user just re-pings the skill with no new phrase and a receipt exists, default to Discuss when any `Decision:` contains `?`, otherwise Apply.

## Guards

- All `.claude/memory/` reads, edits, and deletes resolve at the main worktree root, not the current worktree. See Worktrees in `CLAUDE.md`.
- If no `.claude/memory/` directory exists at the main worktree root, stop: `❌ No .claude/memory/ directory found.`
- If `.claude/memory/` contains no `*.md` entries other than `MEMORY.md`, stop: `✅ No memory entries to review.`
- Resolve the main root via `git worktree list --porcelain | grep -m 1 '^worktree ' | cut -d' ' -f2-`, falling back to `pwd`. All review and memory reads anchor here.

## Propose phase

Propose is the ship-time entry point. The ship skills run it right after capture, so the fix is written while session context is fresh.

### Scope

- **Ship-scoped:** when a ship caller (`git-ship`, `claude-autoship`) names the entries captured this session, classify only those entries. Read the full pen for merge and absorbed comparison, but do not propose actions on carried entries the captures do not touch. Each carried entry was already proposed on in its own ship cycle.
- **Full sweep:** when invoked standalone with no named set, classify every entry in the pen, including entries carried from earlier sessions, so cross-session duplicates merge into one rule.

### Step 1: read the memory folder

Read in parallel from the project root:

- `.claude/memory/MEMORY.md`: the index
- every other `*.md` file under `.claude/memory/`: individual entries with frontmatter (`name`, `description`, `type`)

### Step 2: read promotion targets

Read in parallel from the project root. Skip any file or folder that does not exist.

- `CLAUDE.md`: project behavior rules and Content ownership section
- every `SKILL.md` under `.claude/skills/`: domain-scoped internal skill bodies
- every `SKILL.md` under `claude/skills/`: plugin skill bodies
- every `*.md` under `.claude/standards/`: authoring references
- every `*.md` under `governance/rules/` in the toolkit repo, or `.claude/rules/` in a target project: coding-standards rules

### Step 3: classify each entry

`.claude/memory/` is a holding pen. Default every entry to promote or delete on review. Skip is the rare exception, reserved for active task overlap or user-type memories with no in-repo target.

For each in-scope entry (see Scope), pick one action:

- **Promote to `CLAUDE.md`**: the rule is cross-domain behavior or a design principle applied across the whole project.
- **Promote to a skill body**: the rule fires only when editing a specific path-scoped domain. Name the target skill.
- **Promote to a standards file**: the rule is an authoring reference that belongs in `.claude/standards/<domain>.md`.
- **Hand off to governance**: the rule is coding-standards class (typescript, testing, naming, error-handling, performance, logging, concurrency, planning). Do not author the rule file inline. In the toolkit repo, point the user at `aitk-governance` and `prompts/governance-rules.md`, which own the source-of-truth rules under `governance/rules/`. In a target project, point the user at the `create-rule` skill, which scaffolds a project-local rule under `.claude/rules/`. Never edit the synced `.claude/rules/` copies of toolkit rules, because `aitk gov sync` overwrites them. Stop at handoff.
- **Delete**: the rule is stale, already absorbed into a durable surface, too vague to phrase as a rule, or a one-time incident narrative.

When two or more memories collapse into one rule on the same target, propose them as a single merged edit under the matching promote category. The consolidate case is a variant of promote, not a separate action.

#### Absorbed-already check

Before proposing promote, grep the target surface for the rule's keywords. If the rule is already stated there, the action is **Delete**, not promote. Do not rely on memory-file claims that a rule is documented elsewhere. Verify.

The check covers implication, not only keyword match. If an adjacent bullet in the target section already implies the rule, merge into that bullet rather than append a second.

#### Crispness check

Rules that resist crisp one-line phrasing default to **Delete** over promote. Never promote a memory unchanged. Rewrite to match the destination surface's tone. Use terser phrasing for `CLAUDE.md` and imperative phrasing for skill bodies.

### Step 4: write the proposal to the review file

Derive a slug from the current git branch: run `git branch --show-current` and replace `/` with `-`. Fall back to `latest` on empty output.

Write the full proposal to `.claude/review/memory-review-<slug>.md` at the main worktree root. Do not print it inline.

Structure: a summary block at the top, a legend, then one H2 per numbered item. Number items across all actions so the user can reference them by number. Fuse the status, action, and target into each H2. Put the memory filename on its own line, a one-line Why, the rewritten rule inline in a fenced `diff` block prefixed with `+` so reviewers see the additions in green, and a `Decision:` slot for the user. Do not include a `Take:` slot in the template. Discuss inserts one directly under `Decision:` only when responding to a question item. Status starts as 📝 pending for every item at proposal time.

````plaintext
# Memory review: <slug>

**Pending:** <all numbers>

Legend: ✅ applied · ⏭ skipped · 🗑 deleted · 🤝 handed off · 📝 pending

How to respond: fill in `Decision:` per item (`apply`, `skip`, `defer`, or a question with `?`), then re-ping the skill. Say "discuss" for question rounds, "apply" to commit. Chat shortcut: `all`, `none`, or a list of numbers.

## 1. 📝 Promote → `<target>`

`<memory-file>`

Why: <one-line pulled from the memory's Why>

```diff
+ <rewritten rule text>
```

Decision:

## 2. 📝 Delete

`<memory-file>`

Reason: <one-line reason>

Decision:
````

For Hand off items, the body is a pointer to the governance target instead of a rewritten rule: `aitk-governance` and `prompts/governance-rules.md` in the toolkit repo, or the `create-rule` skill in a target project. For Delete items, skip the rewrite block. Every item gets a `Decision:` slot regardless of action. `Take:` is added only when a question response is needed.

Tell the user `✅ Wrote proposal to .claude/review/memory-review-<slug>.md`. Ask them to fill in `Decision:` per item, then re-ping with "discuss" for question rounds or "apply" to commit.

Rewrite the review file in place whenever the proposal changes mid-review. The file stays the source of truth for the current decisions.

## Challenge phase

Trigger: user says "challenge the promotes", "challenge before apply", or asks for a high-bar pass. Run before Apply. No mutations to memory files or promotion targets. Review file only.

1. Read the latest `.claude/review/memory-review-*.md` at the main root.
2. For each promote item, apply three tests:
   - **Absorbed**: grep the target surface for the rule's keywords. If already stated or implied, flip to delete.
   - **Delta**: if the rule is a nice-to-have next to existing bullets, flip to delete.
   - **Generality**: if the rule fires only on one literal trigger phrase, rewrite broader or flip to delete.
3. Rewrite the review file in place with the updated actions and a one-line reason under each flip.

## Discuss phase

Trigger: user says "discuss", "respond to questions", or any `Decision:` value contains `?` or an unrecognized verb. No mutations to memory files or targets. Review file only. Multi-round.

1. Read the latest `.claude/review/memory-review-*.md` at the main root.
2. For each item whose `Decision:` contains `?` or any unrecognized verb (anything other than `apply`, `skip`, `defer`):
   - Write a `Take:` line under `Decision:`, separated by exactly one blank line. If a `Take:` line already exists, overwrite it.
   - Format: pick + one-line reason. Max 2 sentences. Decision-help style. State the recommendation (`apply` / `skip` / `delete` / specific alternative) first, then the reason. Do not enumerate tradeoffs unless one changes the call.
   - Leave the H2 emoji as 📝 pending.
3. Skip items whose `Decision:` is `apply`, `skip`, `defer`, or empty.
4. End with: `💬 Discussed: <nums> | ⏩ Skipped (committed or empty): <nums>`. Remind the user to refine `Decision:` lines and re-ping with "discuss" for another round, or "apply" when ready to commit.

Do not act on any item. Do not delete memory files. Do not edit MEMORY.md. Do not edit promotion targets. Discuss only.

## Apply phase

Trigger: user says "apply", "commit", "ship the review", or re-pings with no question items remaining. Mutates tracked files (target surfaces, memory files, `MEMORY.md`).

Before applying any item, check the worktree state:

```bash
[ "$(git rev-parse --git-dir 2>/dev/null)" = "$(git rev-parse --git-common-dir 2>/dev/null)" ] && echo "MAIN" || echo "LINKED"
```

If the result is `MAIN`, stop and tell the user: `❌ Apply phase mutates tracked files. Run /claude-worktree first.` Discuss and Challenge phases only touch `.claude/review/` scratch and run from anywhere.

Before applying a promote to root `CLAUDE.md`, load `aitk-claude` so its seed-mirror rule fires on the edit.

Promotions are a separate concern from any feature in flight. Keep the promoted edits on their own commit. Do not fold a `CLAUDE.md` or skill-body change into a feature's commits, because a feature reviewer should not have to vet a change to how the agent operates.

For each item, parse the `Decision:` line:

- `apply` (or affirmative): run the proposed action, flip emoji to ✅.
- `skip`: leave the memory in place, flip emoji to ⏭.
- `defer` or empty: leave 📝 pending, take no action.
- Contains `?` or unrecognized verb: leave 📝 pending, take no action. Do not respond. Discussion is the Discuss phase's job.

Free-form text after the verb is a reason. Capture it in the receipt but do not let it change the action. When committing an item, strip any empty `Take:` line so the receipt stays clean. `Take:` lines with content stay as discussion history.

Action by action type:

- **Promote**: use `Edit` to insert the rewritten rule into the target surface. Then delete the memory file and remove its row from `.claude/memory/MEMORY.md`.
- **Hand off**: do not edit governance. Delete the memory file only if the user confirmed the handoff explicitly. Otherwise leave it in place.
- **Delete**: remove the memory file and its row from `.claude/memory/MEMORY.md`.

Apply edits one at a time via `Edit`. Claude Code's tool permission dialog is the confirmation gate per edit. Never rewrite a whole file.

As each item resolves, update its status in the review file: flip the H2 emoji from 📝 to ✅ for applied, ⏭ for skipped, 🗑 for deleted, or 🤝 for handed off. Refresh the summary block counts at the top. Do not delete the review file. It stays as a receipt until Cleanup runs or the next Propose pass overwrites it.

**Chat shortcut:** the user replies with `all`, `none`, or a comma-separated list of numbers. Apply only the numbered items.

End with: `✅ Applied: <nums> | ⏭ Skipped: <nums> | 📝 Pending: <nums>`. Omit empty buckets. If anything is pending, remind the user they can refine `Decision:` lines and re-ping, run "discuss" for question items, or commit a skip with `skip <nums>` in chat.

## Cleanup phase

Trigger: user says "cleanup", "sweep stale memories", or "delete the receipt" after Apply has run.

1. Read the latest `.claude/review/memory-review-*.md` to see which entries were skipped.
2. Treat a `Skip` decision as terminal. Do not delete a memory just because it would Skip again next review. Target only entries whose decision value is exhausted: already-applied promotions and stale receipts.
3. Delete the review file itself.
4. Leave applied promotions, governance handoffs, and user-type memories alone.

Do not promote or rewrite. Cleanup only.

## After completion

Output one line per action taken in the most recent phase:

- `✅ Promoted: .claude/memory/<memory-file> → <target>`
- `✅ Handed off: .claude/memory/<memory-file> → governance`
- `🗑  Deleted: .claude/memory/<memory-file>`

End Apply runs with a bucket summary: `✅ Applied: <nums> | ⏭ Skipped: <nums> | 📝 Pending: <nums>`. Omit empty buckets.

If the user accepted nothing, output: `✅ No changes applied.`
