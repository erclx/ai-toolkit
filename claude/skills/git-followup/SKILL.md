---
name: git-followup
description: Ships a small self-review edit on the current PR branch by staging, committing, pushing, and syncing the open PR, replying on the PR when it carries review comments. Use when asked to "ship a followup", "push the PR fix", "followup", or "commit and push this small change". Do NOT use when there is no open PR for the branch (use git-ship instead).
---

# Git followup

Ship a small self-review edit on the current PR branch in one pass.

When invoked with `reply-owned`, a caller such as `claude-address-review` posts
its own reply, so skip the comment in step 6. The push and body sync still run.

## Guards

- If `git branch --show-current` returns `main`, stop: `❌ On main. Switch to a PR branch first.`
- If `git status --porcelain` is empty, stop: `❌ No changes to ship.`
- If `git rev-parse --abbrev-ref --symbolic-full-name @{u} 2>/dev/null` is empty, stop: `❌ No upstream. Push the branch first or use git-ship.`
- If `gh pr view --json state -q '.state' 2>/dev/null` is not `OPEN`, stop: `❌ No open PR for this branch. Use git-ship to open one.`

## Sequence

1. Run `git status` to confirm the changes are intentional
2. Run `git add -A` to stage every change
3. Invoke `aitk:git-commit` to generate one conventional commit from the staged diff
4. Run `git push` to the tracking branch
5. Check for existing review comments: `gh api 'repos/{owner}/{repo}/pulls/<number>/comments' --jq 'length'`, resolving `<number>` from `gh pr view --json number`.
6. When invoked with `reply-owned`, skip this step's comment: the caller posts the reply. Otherwise, if the count is above zero, the followup addresses review feedback: post a one-line summary of the fix with `gh pr comment --body`, first running the banned-character scan in `.claude/standards/prose.md` against it, or `${CLAUDE_SKILL_DIR}/../../standards/prose.md` when the project does not have it, since the hook does not see an inline comment body. If it is zero, run `gh pr view --json url,title,body` and update the body with `gh pr edit --body` when the new commit changes scope, and the title with `gh pr edit --title` when the scope shifted enough to make it inaccurate.

## After completion

Output one line:

```plaintext
✅ Followup shipped: <pr-url>
```
