Sweep `.claude/memory/` for entries that will not be actionable next review, then remove the review receipt.

1. Read the latest `.claude/review/memory-review-*.md` to see which entries were skipped.
2. Treat a `Skip` decision as terminal. Do not delete a memory just because it would Skip again next review. Target only entries whose decision value is exhausted: already-applied promotions and stale receipts.
3. Delete the review file itself.
4. Leave applied promotions, governance handoffs, and user-type memories alone.

Do not promote or rewrite. Cleanup only.
