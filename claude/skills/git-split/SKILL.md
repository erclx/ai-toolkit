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
- Identify the primary concern of the current branch. Rename the current branch to reflect that concern using `git branch -m`. Secondary concerns are extracted as new focused branches off main via cherry-pick.
- If no single concern dominates (dumping-ground branch with no clear primary), split all commits into new focused branches and add `git branch -d <current>` to delete the original.
- Propose one new branch per secondary concern following branch.md format.
- Do not include push commands — that is the developer's decision.

## Response format

### Preview

**Current branch:** <branch_name>
**Total commits ahead of main:** <count>

| Group            | Branch                        | Commits | Count |
| ---------------- | ----------------------------- | ------- | ----- |
| Primary (rename) | <current_branch> → <new_name> | <shas>  | <n>   |
| <concern>        | <type>/<description>          | <shas>  | <n>   |

**All <total> commits accounted for.**

### Final commands

```bash
# Rename current branch to reflect primary concern
git branch -m <current_branch> <new_name>

# Create and cherry-pick each secondary branch
git checkout main && git checkout -b <branch> && git cherry-pick <sha> <sha>
git checkout main && git checkout -b <branch> && git cherry-pick <sha>

# Return to primary branch
git checkout <new_name>

# After sibling PRs are merged to main, rebase:
# git rebase main
```

## After execution

Respond with exactly one line:

`✅ Renamed: <old> → <new> | Created: <branch1>, <branch2>`

Do not add any other text.
