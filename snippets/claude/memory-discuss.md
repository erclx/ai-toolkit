Respond to question items in the latest memory review. Discussion phase only — no mutations.

1. Resolve the main worktree root via `git worktree list --porcelain | awk '/^worktree /{print $2; exit}'` (fall back to `pwd`).
2. Read the latest `.claude/review/memory-review-*.md` at that root.
3. For each item whose `Decision:` line contains `?` or any unrecognized verb (anything other than `apply`, `skip`, `defer`):
   - Write a `Take:` line under the `Decision:` line, separated by exactly one blank line. If a `Take:` line already exists, overwrite it.
   - Format: pick + one-line reason. Max 2 sentences. Decision-help style. State the recommendation (`apply` / `skip` / `delete` / specific alternative) first, then the reason. Do not enumerate tradeoffs unless one changes the call.
   - Leave the H2 emoji as 📝 pending.
4. Skip items whose `Decision:` is `apply`, `skip`, `defer`, or empty.
5. End with: `💬 Discussed: <nums> | ⏩ Skipped (committed or empty): <nums>`. Remind the user to refine `Decision:` lines and re-ping `@snippets/claude/memory-discuss` for another round, or `@snippets/claude/memory-apply` when ready to commit.

Do not act on any item. Do not delete memory files. Do not edit MEMORY.md. Do not edit promotion targets. Discuss only.
