Sweep `.claude/memory/` for entries that will not be actionable next review, then remove the review receipt.

1. Read the latest `.claude/review/memory-review-*.md` to see which entries were skipped.
2. For each skipped entry, ask whether the same memory will earn a different call next time. If not, delete the file and remove its row from `.claude/memory/MEMORY.md`.
3. Delete the review file itself.
4. Leave applied promotions, governance handoffs, and user-type memories alone.

Do not promote or rewrite. Cleanup only.
