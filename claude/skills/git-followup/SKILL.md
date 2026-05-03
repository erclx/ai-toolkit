---
name: git-followup
description: Ships a small self-review edit on the current PR branch by staging, committing, pushing, and syncing the open PR. Use when asked to "ship a followup", "push the PR fix", "followup", or "commit and push this small change". Do NOT use when there is no open PR for the branch (use git-ship instead).
disable-model-invocation: true
---

# Git followup

Ship a small self-review edit on the current PR branch in one pass.

## Guards

- If `git branch --show-current` returns `main`, stop: `❌ On main. Switch to a PR branch first.`
- If `git status --porcelain` is empty, stop: `❌ No changes to ship.`
- If `git rev-parse --abbrev-ref --symbolic-full-name @{u} 2>/dev/null` is empty, stop: `❌ No upstream. Push the branch first or use git-ship.`
- If `gh pr view --json state -q '.state' 2>/dev/null` is not `OPEN`, stop: `❌ No open PR for this branch. Use git-ship to open one.`

## Sequence

1. Run `git status` to confirm the changes are intentional
2. Run `git add -A` to stage every change
3. Invoke `toolkit:git-commit` to generate one conventional commit from the staged diff
4. Run `git push` to the tracking branch
5. Run `gh pr view --json url,title,body` and review whether the new commit changes scope. If it does, update the PR body with `gh pr edit --body` and update the title with `gh pr edit --title` if the scope shifted enough to make it inaccurate.

## After completion

Output one line:

```plaintext
✅ Followup shipped: <pr-url>
```
