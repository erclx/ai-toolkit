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
- If `gh pr view --json state -q '.state' 2>/dev/null` is not `OPEN`, stop: `❌ No open PR for this branch. Use git-ship to open one.`

A missing tracking ref is no longer a guard. An open pull request proves the branch reached the remote, and a branch created by worktree entry has been measured carrying an open pull request with no tracking ref, where the old guard reported that the branch still needed pushing. That message describes a state the branch is not in, so the run stopped on a diagnosis nobody could act on. Step 4 sets the ref instead.

## Sequence

1. Run `git status` to confirm the changes are intentional
2. Run `git add -A` to stage every change
3. Invoke `aitk:git-commit` to generate one conventional commit from the staged diff
4. Push, in one of two cases.
   - When `git rev-parse --abbrev-ref --symbolic-full-name @{u} 2>/dev/null` is empty, the branch has an open pull request and no tracking ref, so run `git push -u origin HEAD` to send the commit and set the ref in one step.
   - Otherwise push to the tracking branch with `git push`, and when `git merge-base --is-ancestor @{u} HEAD` exits non-zero, a caller rewrote the branch and a plain push is rejected, so push with `--force-with-lease` instead.

   The lease is what stops the force from overwriting a commit this session never read. Run the ancestry test only where an upstream resolves, since it reads `@{u}`.

5. Check for existing review comments: `gh api 'repos/{owner}/{repo}/pulls/<number>/comments' --jq 'length'`, resolving `<number>` from `gh pr view --json number`.
6. Route on the invocation and the comment count.
   - When invoked with `reply-owned`, skip this step's comment: the caller posts the reply.
   - Otherwise, if the count is above zero, the followup addresses review feedback: post a one-line summary of the fix with `gh pr comment --body`, first running the scan in `.claude/standards/publish.md` against it, or `${CLAUDE_SKILL_DIR}/../../standards/publish.md` when the project does not have it, since the hook does not see an inline comment body.
   - If it is zero, run `gh pr view --json url,title,body` and update the body with `gh pr edit --body` when the new commit changes scope, and the title with `gh pr edit --title` when the scope shifted enough to make it inaccurate.

## After completion

Output one line:

```plaintext
✅ Followup shipped: <pr-url>
```
