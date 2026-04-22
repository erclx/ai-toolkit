Ship a small self-review edit on the current PR branch. Stage, commit, and push in one pass.

1. Confirm with `git status` that the current branch is the PR branch, not `main`, and that the changes are intentional.
2. Stage every change with `git add -A`.
3. Invoke `/toolkit:git-commit` to generate one conventional commit from the staged diff.
4. Push to the tracking branch with `git push`.

Stop if there are no changes, the branch is `main`, or the branch has no upstream.
