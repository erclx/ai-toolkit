Ship a small self-review edit on the current PR branch. Stage, commit, push, and sync the open PR in one pass.

1. Confirm with `git status` that the current branch is the PR branch, not `main`, and that the changes are intentional.
2. Stage every change with `git add -A`.
3. Invoke `/toolkit:git-commit` to generate one conventional commit from the staged diff.
4. Push to the tracking branch with `git push`.
5. Run `gh pr view --json url,title,body` to check if a PR is open for this branch. If one exists, review whether the new commit changes the scope. If it does, update the PR body with `gh pr edit --body` to reflect the addition. Update the title if the scope shifted enough to make it inaccurate.

Stop if there are no changes, the branch is `main`, or the branch has no upstream.
