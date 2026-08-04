---
name: claude-address-review
description: Pulls review findings and CI status on the current branch's open PR, fixes each in the working tree, refreshes any stale `.claude/` docs, replies with a summary comment, and pushes a follow-up commit. The worker's return leg after `claude-pr-review`. Use when asked to "address the review", "fix the PR comments", "respond to review", or after an orchestrator posts findings. Do NOT use to write a review. That is `claude-pr-review`.
---

# Claude address review

The worker's half of the review channel. `claude-pr-review` posts findings to
the PR from an independent session. This skill consumes them: fix, reply, push.

## Guards

- If no open PR resolves for the current branch via `gh pr view`, stop: `❌ No open PR. Nothing to address.`
- If the PR has no review comments or threads, run step 5's staleness test before deciding. A branch that still merges stops here: `✅ No review findings to address.` One that does not skips steps 1 through 4 and runs step 5 onward, since a branch goes stale from `main` moving and a closed review says nothing about whether it still merges.
- Fix findings. Do not merge.

## Step 1: pull the review findings and CI status

Read the review comments and threads on the PR:

```bash
gh pr view --json number,reviews,comments
```

For inline review comments, read them via `gh api` on the PR's review comments. Collect each finding with its file, location, and body.

Also read the CI check status so the fixes cover failing checks, not only review comments:

```bash
gh pr checks <number>
```

Treat a failing check as a finding to resolve alongside the review comments. When no checks are configured, `gh pr checks` reports none and the flow continues on the review findings alone.

## Step 2: address each finding

For each finding, implement the fix in the working tree. When a finding is a
question or a conscious-accept rather than a defect, note the reply text instead
of editing. Handle each finding independently. Do not let one unresolved finding
block the others.

## Step 3: verify

Run the project check (`bun run check` or the project's documented equivalent).
Do not push a red follow-up.

## Step 4: refresh stale docs

The fixes may have changed or added behavior that `.claude/` context entries, docs, or wireframes describe. Refresh them with the `claude-docs` skill, which maps the changed files to the entries that reference them and rewrites the stale sections. Do not reimplement that mapping here. When a fix adds a new capability with no existing entry, `claude-docs` flags it rather than creating one.

## Step 5: rebase a stale branch

A branch goes stale from `main` moving rather than from anything the branch did,
so the test runs on every invocation, including the one the second guard sends
straight here with no findings to fix. Fetch first. A stale local `origin/main`
reports no conflict on a branch that has one.

```bash
git fetch origin main
git merge-tree --write-tree origin/main HEAD
```

A zero exit means the branch still merges. Skip to step 6. A non-zero exit means
it does not. Stash the fixes first when `git status --porcelain` reports
anything, since a rebase refuses to run over a dirty tree, then rebase onto
`origin/main` and restore them:

```bash
git stash push -u
git rebase origin/main
git stash pop
```

Pop only when the stash ran. On a clean tree, which is what a run whose findings
were all conscious-accepts leaves behind, `git stash push` saves nothing and
exits zero, so the pop restores an unrelated entry from an earlier session.

Never merge `main` into the branch. The repository squash-merges, so a merge
commit here reads as noise on the pull request.

Resolve every conflict under these rules, which apply to a hunk from the rebase
and a hunk from the stash pop alike:

- Never take one side wholesale with `--ours` or `--theirs`. Both sides are valid content, so the drop is silent and passes every check.
- Never resolve a generated file by hand. A file the project check rebuilds, such as an `index.md` carrying no `auto: false`, takes either side to clear the conflict and gets its real content from the regen below.
- Where two branches wrote prose into one file, keep both sides and rewrite what the merge broke. A section that opens by counting what follows needs the count updated rather than the two versions concatenated.
- When a hunk needs a decision the tree does not carry, stop rather than guessing, and name where the branch was left. The two sources recover differently. A hunk raised by the rebase takes `git rebase --abort`, which restores the old base: `❌ Conflict needs a decision at <file>. Branch left on its old base.` A hunk raised by the stash pop arrives after the rebase already landed, so no abort applies and the conflict stays in the tree: `❌ Conflict needs a decision at <file>. Branch rebased, fixes left conflicted in the tree.` A guess that compiles is the failure this stage would otherwise introduce, and either case reaches the operator as an ordinary finding on the next review pass.

Both sides of every hunk sit in the conflict and `git log origin/main` names what
landed, so the tree carries the context. Do not wait on the orchestrator for it.

Re-run the project check after the rebase. It rebuilds the generated files and
covers what the replayed commits broke, and step 6 commits the result alongside
the fixes.

`git merge-tree` reads committed history, so this test says nothing about the
fixes still sitting in the working tree. A branch that merges clean as committed,
whose fixes touch lines `main` moved, passes here and reaches the remote
unmergeable. Step 6 re-runs the test once those fixes are commits.

## Step 6: push, then reply

Push the fixes before posting the reply so the comment never runs ahead of the
code it describes. Ship the fixes as a follow-up commit on the same branch with
the `git-followup` skill, invoked with `reply-owned` so it stages, commits,
pushes, and refreshes the open PR body without posting its own comment. This
skill owns the reply. Do not reimplement that flow here. For in-place fixes to
files the PR body already covers, `git-followup` leaves the body untouched and
the reply comment carries the fix log. A rebase in step 5 rewrote the branch, so
that push is a force-push and `git-followup` resolves it from the tracking
branch. Worker branches are single-owner here, which is what makes overwriting
the remote safe.

`git-followup` stops on an unchanged tree. A run that answered every finding as a
conscious-accept and whose rebase left the generated files alone has nothing for
it to commit, so the rebase would never reach the remote. Push that case directly
with `git push --force-with-lease`, then post the reply below.

Once the fixes are commits, re-run step 5's staleness test against the new head.
A conflict that appears only now is one the fixes introduced against lines `main`
moved, which the earlier test could not see. Rebase again under step 5's rules
and force-push, then continue. The second push costs one extra force-push in a
case that needs the fix and the sibling to touch the same lines.

Then write a summary reply to `.claude/.tmp/address-review/reply-<number>.md`
mapping each finding to what changed, or to a one-line reason when it is a
conscious-accept rather than a defect. Key the filename on the PR number so two
sessions addressing different pull requests never overwrite each other between
the write and the post. Note any `.claude/` docs refreshed as a result of the
fixes. The reply is a rendered-for-human GitHub surface, so follow
`.claude/standards/prose.md` for voice, or `${CLAUDE_SKILL_DIR}/../../standards/prose.md`
when the project does not have it, and keep each mapping to a line or two.
Open the body with the `## Review response` heading so it anchors as a section
distinct from human threads and stays subordinate to the `## Review` heading the
review itself carries. Follow it with a one-line summary sentence, then one
bullet per finding, each opening with the bolded finding identifier.
Close the body with `🤖 Addressed by Claude Code` on its own line so the reply
reads as an independent machine pass, not a human sign-off.
When step 5 rebased the branch, say so in the summary sentence and name which
files were resolved by hand and which the regen rebuilt. The next review is a
full pass rather than a delta, and the reader is owed the reason.

Before posting, run the scan in `.claude/standards/publish.md`
against the reply, or `${CLAUDE_SKILL_DIR}/../../standards/publish.md` when
the project does not have it. The hook skips `.claude/.tmp/`, so this scan is the
only gate on the published reply. Post it to the PR:

```bash
gh pr comment <number> --body-file .claude/.tmp/address-review/reply-<number>.md
```

## Step 7: confirm resolution

After the follow-up push, watch CI on the PR. Poll `gh pr checks <number>`
until no check is pending, then read the final status. When every finding is
addressed and all checks pass, post one closing comment so the thread has a
clear terminal state:

```bash
gh pr comment <number> --body "✅ All review findings addressed, CI green."
```

If any check fails, do not post the closing comment. Report the failing check
so it can be fixed first. This is a resolution signal, not a formal approval,
since the PR author cannot approve their own PR.

## Step 8: output

```plaintext
Addressed <N> findings on PR #<number>. Follow-up pushed.
<Rebased onto origin/main. <N> files resolved by hand, <N> rebuilt by the check.>
```

Omit the second line when the branch still merged. Name any finding left as a
reply rather than a code change, with its one-line reason. Do not merge. Hand
back to the orchestrator for re-review.
