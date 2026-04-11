---
description: Splits a mixed-commit branch into focused branches off main using cherry-pick. Use when a branch has unrelated commits, or when asked to "split this branch" or separate concerns into reviewable PRs.
---

# Git split

Before proposing a split, read from the project root in parallel (skip if not present):

- `standards/branch.md`: format, types, length limit, and constraints
- `standards/pr.md`: PR title format, body sections, and content rules

## Context

Run these commands in parallel:

// turbo

1. Run `git status --porcelain 2>/dev/null || echo "NO_STATUS"`
   // turbo
2. Run `git branch --show-current 2>/dev/null || echo "NO_BRANCH"`
   // turbo
3. Run `git log main..HEAD --oneline --no-decorate --stat 2>/dev/null || echo "NO_COMMITS"`

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
- Identify the primary concern of the current branch. Rename the current branch to reflect that concern. Secondary concerns are extracted as new focused branches via cherry-pick.
- If no single concern dominates, split all commits into new focused branches and add `git branch -d <current>` to delete the original.
- Classify groups as independent or stacked before generating commands.
- Independent groups: each group's commits apply to `main` without the others. Base every branch on `main`.
- Stacked groups: groups are ordered and each depends on the commits before it. Base each branch on the previous group's branch. Cherry-pick only that group's commits onto it. The base branch already carries all prior commits.

## Response format

### Preview

**Current branch:** <branch_name>
**Total commits ahead of main:** <count>
**Mode:** Independent | Stacked

| Group            | Branch                        | Base           | Commits | Count |
| ---------------- | ----------------------------- | -------------- | ------- | ----- |
| Primary (rename) | <current_branch> → <new_name> | main           | <shas>  | <n>   |
| <concern>        | <type>/<description>          | main           | <shas>  | <n>   |
| <concern>        | <type>/<description>          | <prior-branch> | <shas>  | <n>   |

**All <total> commits accounted for.**

After outputting the preview, execute the final commands immediately. Claude Code's tool permission dialog is the confirmation gate. Do not wait for user input.

### Final commands

For independent mode, base every branch on `main`:

```bash
# Rename current branch to reflect primary concern
git branch -m <current_branch> <new_name>

# Create, cherry-pick, push, and open PR for each secondary branch
mkdir -p .claude/.tmp
git checkout main && git checkout -b <branch> && git cherry-pick <sha> <sha> \
  && git push -u origin <branch> \
  && (cat <<'BODY' > .claude/.tmp/pr-body-<branch>.md
<body following pr.md template>
BODY
) && gh pr create --title "<title>" --body-file .claude/.tmp/pr-body-<branch>.md \
  && rm .claude/.tmp/pr-body-<branch>.md

# Return to primary branch
git checkout <new_name>
```

For stacked mode, base each branch on the previous and cherry-pick only that group's commits:

```bash
# Rename current branch to reflect primary concern
git branch -m <current_branch> <new_name>

mkdir -p .claude/.tmp

# Group 1: based on main
git checkout main && git checkout -b <branch-1> && git cherry-pick <g1-sha> <g1-sha> \
  && git push -u origin <branch-1> \
  && (cat <<'BODY' > .claude/.tmp/pr-body-<branch-1>.md
<body following pr.md template>
BODY
) && gh pr create --title "<title>" --body-file .claude/.tmp/pr-body-<branch-1>.md \
  && rm .claude/.tmp/pr-body-<branch-1>.md

# Group 2: based on <branch-1>, this group's commits only
git checkout -b <branch-2> && git cherry-pick <g2-sha> <g2-sha> \
  && git push -u origin <branch-2> \
  && (cat <<'BODY' > .claude/.tmp/pr-body-<branch-2>.md
<body following pr.md template>
BODY
) && gh pr create --title "<title>" --body-file .claude/.tmp/pr-body-<branch-2>.md \
  && rm .claude/.tmp/pr-body-<branch-2>.md

# Return to primary branch
git checkout <new_name>
```

## After execution

Respond with exactly one line:

`✅ Renamed: <old> → <new> | PRs: <url1>, <url2>`
