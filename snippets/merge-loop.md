Identify the next step in the post-split merge loop. Run these in parallel and reason from the output:

1. `gh pr list --state open --json number,title,headRefName,baseRefName --limit 20`
2. `git branch --format '%(refname:short)'`
3. `git log origin/main..HEAD --oneline`

Output this shape, nothing else:

````markdown
**Open PRs**: <count>

| #     | Branch | Title   |
| ----- | ------ | ------- |
| <num> | <head> | <title> |

**Next**: <one sentence: which PR to merge next, or "All merged, no action">

**Run after merge**:

```bash
git checkout main && git pull
git branch -D <branch>
```

**Remaining**: <comma-separated branches still open, or "none">
````

Skip the `Run after merge` block when the next action is "All merged".
