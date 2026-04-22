Execute committed decisions from the latest memory review. Mutating phase.

1. Resolve the main worktree root via `git worktree list --porcelain | awk '/^worktree /{print $2; exit}'` (fall back to `pwd`).
2. Read the latest `.claude/review/memory-review-*.md` at that root.
3. For each item, parse the `Decision:` line:
   - `apply` (or affirmative): run the proposed action, flip emoji to ✅.
   - `skip`: leave the memory in place, flip emoji to ⏭.
   - `defer` or empty: leave 📝 pending, take no action.
   - Contains `?` or unrecognized verb: leave 📝 pending, take no action. Do not respond. Discussion is `@snippets/claude/memory-discuss`'s job.
4. Update statuses inline and refresh the summary block as items resolve. Free-form text after the verb is a reason. Capture it in the receipt but do not let it change the action. When committing an item, strip any empty `Take:` line so the receipt stays clean. `Take:` lines with content stay as discussion history.
5. End with: `✅ Applied: <nums> | ⏭ Skipped: <nums> | 📝 Pending: <nums>`. Omit empty buckets. If anything is pending, remind the user they can refine `Decision:` lines and re-ping, run `@snippets/claude/memory-discuss` for question items, or commit a skip with `skip <nums>` in chat.

Do not propose new actions. Do not rewrite the file. Do not respond to question items.
