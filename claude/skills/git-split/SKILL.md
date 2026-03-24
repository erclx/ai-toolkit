---
name: git-split
description: Splits a mixed-commit branch into focused branches off main using cherry-pick. Use when a branch has unrelated commits, asking "split this branch", or needing to separate concerns into reviewable PRs.
---

# Git split

Before proposing a split, read:

- `standards/branch.md`: format, types, length limit, and constraints

Follow it exactly.

## Context

Run these commands in parallel to gather git context:

- `git status --porcelain 2>/dev/null || echo "NO_STATUS"`
- `git branch --show-current 2>/dev/null || echo "NO_BRANCH"`
- `git log main..HEAD --oneline 2>/dev/null || echo "NO_COMMITS"`
- `git log main..HEAD --oneline --no-decorate --stat 2>/dev/null || echo "NO_COMMITS"`

## Guards

- If working tree is dirty (non-empty `git status --porcelain`), stop:
  `❌ Working tree is dirty. Commit or stash changes before splitting.`
- If current branch is `main` or `master`, stop:
  `❌ Already on main. Nothing to split.`
- If no commits ahead of main, stop:
  `❌ No commits ahead of main. Nothing to split.`

## Grouping rules

- Group commits by concern using both commit messages and file paths.
- Prefer fewer branches: combine related commits into one branch.
- Only split into separate branches when concerns are clearly independent.
- The current feature branch stays as-is and is not listed as a new branch.
- Propose one new branch per independent concern following branch.md format.
- Do not include push commands — that is the developer's decision.

## Response format

### Preview

**Current branch:** <branch_name>
**Total commits ahead of main:** <count>

| Group           | Branch               | Commits | Count |
| --------------- | -------------------- | ------- | ----- |
| Feature (stays) | <current_branch>     | <shas>  | <n>   |
| <concern>       | <type>/<description> | <shas>  | <n>   |

**All <total> commits accounted for.**

### Final commands

```bash
# Create and cherry-pick each branch
git checkout main && git checkout -b <branch> && git cherry-pick <sha> <sha>
git checkout main && git checkout -b <branch> && git cherry-pick <sha>

# Return to your feature branch
git checkout <current_branch>

# After sibling PRs are merged to main, rebase:
# git rebase main
```
