---
name: claude-pr-review
description: Reviews an open pull request from an independent session and posts findings as a review comment on the PR. Posts a first pass against the whole change and every later pass against only the commits added since, under `## Review` while a critical or should-fix is open and `## Review closed` once nothing blocks the merge. Reads project docs and the roadmap for cross-feature context a self-review lacks. Use when asked to "review the PR", "review this feature's PR", "post a PR review", "re-review the PR", "close out the review", "confirm the findings are fixed", or acting as the orchestrator reviewing a worker's PR. Do NOT use to review local uncommitted changes. That is `claude-review`.
---

# Claude PR review

This is the orchestrator's independent review, distinct from `claude-review`.
`claude-review` reviews local changes for the session that wrote them and writes
to disk. This one reviews an open PR the session did not write and posts the
findings to the PR, so the vantage is independent and the output is durable.

It posts at least twice over a pull request's life. A first pass opens the
review against the whole change, and every later pass reads only the commits
added since. The heading reports state rather than pass number: a pass carrying
a critical or a should-fix takes `## Review`, and `## Review closed` covers
every other pass, so the most recent comment's heading reports whether anything
blocks the merge. Every pass is this skill, and which one it is gets detected
from the thread rather than named by the caller.

## Guards

- If no open PR resolves for the target branch via `gh pr view`, stop: `❌ No open PR to review. Open one first, or use /claude-review for local changes.`
- Review and post. Do not merge. Merging is the human's gate.

## Step 1: resolve the PR and read context

Resolve the PR: `gh pr view --json number,headRefName,headRefOid,title` for the current branch, or use a PR number the user names. The first seven characters of `headRefOid` are `<short-sha>`, which names the body file in Step 4.

Read these in parallel from the project root, skipping any that do not exist:

- `CLAUDE.md`: project type, conventions, and commands
- `.claude/REQUIREMENTS.md`: feature scope and non-goals
- `.claude/ARCHITECTURE.md`: technical design decisions
- `.claude/ROADMAP.md`: where this feature sits and what depends on it
- `.claude/plans/feature-<slug>.md` for the branch, when present: the intent the PR should satisfy

Coding standards from `.claude/rules/` are auto-loaded by Claude Code.

## Step 2: scope the read

Find the commit the last pass covered:

```bash
gh pr view <number> --json reviews --jq '[.reviews[] | select(.body // "" | split("\n")[0] | rtrimstr("\r") | . == "## Review" or . == "## Review closed")] | last | .commit.oid'
```

Match the first line for equality against the two headings this skill posts. A prefix test also matches `## Review response` and any heading merely starting with those words, which would scope the pass to whatever commit that comment carried. The `\r` trim covers a body composed in the GitHub web editor, which stores CRLF.

An empty result is a first pass. Read the whole change:

```bash
gh pr diff <number>
```

```bash
gh pr diff <number> --name-only
```

A commit is a later pass. Fetch the pull request head so both commits are local:

```bash
git fetch -q origin pull/<number>/head
```

A failed fetch stops the skill: `❌ Could not fetch the PR head. Retry once the remote is reachable.` Do not fall through to the full pass. A fetch failure and a rebase both leave the prior commit unreachable, and the fallback below states a rebase as fact on the pull request, so conflating the two publishes a claim the skill never checked.

Then test that the prior commit still reaches the head:

```bash
git merge-base --is-ancestor <prior-oid> <headRefOid>
```

On exit zero, review `<prior-oid>..<headRefOid>` and nothing else. `git diff` and `git log --oneline` over that range are the whole read, because the first pass already covered everything behind it. A non-zero exit means the branch was rebased or force-pushed, so the delta is undefined rather than empty. Fall back to the full pass above and say so in the body.

Read each changed file in scope. Skip deleted files. Run reads in parallel.

## Step 3: review

Review the diff and files for the same axes as `claude-review` (bugs, edge cases, error handling, logic flaws, security, rule violations), then add the three lenses a self-review structurally cannot apply:

- Integration: does this fit the roadmap sequence, the shared wiring seam, and any sibling PR in flight?
- Contract: does a contract downstream features depend on land correctly, and should the plan itself be questioned?
- Consumers: when the change touches a resource with more than one consumer, enumerate them and check the rule against each. A rule written for the consumer the change targets can be wrong for a sibling that writes.

Apply the high-signal filter: flag only what will cause incorrect behavior, break a documented rule, or mislead a downstream feature. If uncertain, do not flag.

A later pass applies the same axes to the delta, and adds one check the first pass cannot make: did each prior finding land, and did the fix regress anything it touched. Findings of its own are normal findings, stated at the same severity and counted the same way. That count is what Step 4 reads to pick the heading, so a pass raising a critical or a should-fix of its own is not a close-out.

A prior finding can also be settled by argument rather than by a fix. A reply naming the plan question that already declined it, or a constraint this session could not see, withdraws the finding or moves its grade. State that outcome in the body under the finding it changes, naming the fact that produced it, whether the argument arrived on the thread or through the channel that carried the dispatch. Dropping the finding from this body instead leaves a reader unable to tell a withdrawal from an oversight, and the reasoning goes with the session that heard it. A withdrawal removes the finding from the count, so a pass that withdrew every critical and should-fix is a close-out. Write the withdrawal and its cause into that body rather than taking the short close-out line Step 4 supplies, which reports prior findings addressed and would credit a fix nobody made.

Use severity: `critical` (blocks merge), `should-fix` (fix before merge), `minor` (visibility only).

## Step 4: post to the PR

Write the comment to `.claude/.tmp/pr-review/body-<number>-<short-sha>.md`. The PR number stops two sessions reviewing different pull requests from overwriting each other between the write and the post. The head commit stops a second pass overwriting the first one's body, and leaves the folder a record of which commit each review covered.

Derive both segments from Step 1. Never pick a suffix by hand, and never reuse a name the folder already holds.

When `<prior-oid>` from Step 2 equals `headRefOid`, the head repeats and the folder already holds `body-<number>-<short-sha>.md`. Add a third segment taking the id of the `## Review response` comment this pass answers, giving `body-<number>-<short-sha>-r<comment-id>.md`. That satisfies both prohibitions above rather than carving an exception into either.

```bash
gh pr view <number> --json reviews,comments --jq '([.reviews[] | select(.body // "" | split("\n")[0] | rtrimstr("\r") | . == "## Review" or . == "## Review closed")] | last | .submittedAt) as $prior | [.comments[] | select(.body // "" | split("\n")[0] | rtrimstr("\r") | . == "## Review response") | select(.createdAt > $prior)] | last | .url // empty | split("-") | last'
```

Scope the responses to those newer than the prior pass, never to every response the thread carries. A pass answering the newest response and a pass answering an older one derive the same third segment, so an unscoped read hands a re-run after a close-out the name its own prior pass already wrote. That is the collision this case exists to prevent, reached without a rebase or an error.

Read the number off `.url`. The `id` field carries a GraphQL node id, which the thread never displays. Keep the `// empty` guard, since `split` aborts jq on the null an empty selection returns, and an aborted command reaches the session as an error rather than as the empty result the stop below reads.

An empty result means no response arrived since the prior pass, so this pass would restate a body the folder already holds. Stop: `❌ No response since the prior pass on <short-sha>. Nothing new to review.`

The response is also the whole read on a repeated head. Step 2 resolves an empty range, because a commit is its own ancestor and `<prior-oid>..<headRefOid>` spans nothing, so the delta cannot answer whether a prior finding landed. Read that comment for what the worker changed or accepted, and treat an accepted finding as closed rather than restating it.

The comment is a rendered-for-human GitHub surface, so follow `.claude/standards/prose.md` for voice, or `${CLAUDE_SKILL_DIR}/../../standards/prose.md` when the project does not have it: cut editorializing, and keep every sentence load-bearing. Match this shape on a first pass:

```markdown
## Review

X critical, Y should-fix, Z minor. Reviewed against project docs and roadmap.

**`path/to/file.ext`**

- **should-fix**: what breaks and the fix, in two or three sentences.
- **minor**: finding.

**What is right**

- bounded confirmation.

🤖 Reviewed by Claude Code
```

A later pass carrying findings keeps that shape and changes only the summary line:

```markdown
## Review

Re-reviewed `<short-sha>`, N commits since the prior pass. X critical, Y should-fix, Z minor.

**`path/to/file.ext`**

- **should-fix**: what breaks and the fix, in two or three sentences.

🤖 Reviewed by Claude Code
```

The heading reports whether anything blocks the merge and the summary line reports which pass this is. Post under `## Review` whenever the pass carries a critical or a should-fix, whether it is the first pass or the fourth. Post `## Review closed` on every other pass, a pass carrying only minors included, and list those minors under it as follow-ups. One severity threshold then governs the heading and the dispatch alike, since the routing that sends a worker to act fires on the same two grades. A pull request thread then reads as `## Review`, the worker's answer under `## Review response` from `claude-address-review`, another `## Review` while a critical or should-fix is still open, and `## Review closed` when neither is.

The cost is that a clean thread no longer reads off the heading alone, since a close-out may carry minors. Take the merge decision from the heading and the counts from the summary line under it, which is where they already sit.

A minor under a close-out is deferred rather than dropped, so it needs a surface that survives the merge. Write it into the `## Findings` section of the task the branch closes, which is where the queue-refill sweep already routes a finding that changes another task, and name that destination in the bullet. A minor left on the thread alone is lost the moment the pull request merges.

Read the state off the most recent review comment rather than off the presence of a closed one. A close-out does not close the pull request, so a commit pushed after it gets its own pass, and that pass reopens the review under `## Review` when it raises a critical or a should-fix.

Both of this skill's headings anchor as a section distinct from human threads. Do not invent one beyond those two and the `## Review response` a sibling owns, and do not append the PR number, which GitHub already renders above the comment.

Name the scope in every summary line after the first pass, since a reader cannot otherwise tell a narrow read from a full one. When the fallback in Step 2 fired, replace the commit count with `Re-reviewed the full change, the prior pass's commit is no longer on the branch`.

Budget the body. State each finding as the failure and the fix in two or three sentences, not a paragraph of reasoning.

Omit files with no findings. Do not lecture on process. The integration, contract, and consumer lenses stay, but as findings, not asides.

The `What is right` section is optional, capped at three bullets, and included only when it changes the merge decision. Drop it otherwise and let the summary line carry the approval.

Close the body with `🤖 Reviewed by Claude Code` on its own line so the review reads as an independent machine pass, not a human sign-off.

Before posting, run the scan in `.claude/standards/publish.md` against the body, or `${CLAUDE_SKILL_DIR}/../../standards/publish.md` when the project does not have it. The hook skips `.claude/.tmp/`, so this scan is the only gate on the published comment. A finding phrased against an internal phase label is what the label half of the scan catches here.

```bash
gh pr review <number> --comment --body-file .claude/.tmp/pr-review/body-<number>-<short-sha>.md
```

A pass carrying nothing at all takes `## Review closed` and a short body, with the footer line included either way. On a first pass, post `✅ No blocking findings. Reviewed against project docs and roadmap.` On a later pass, post `✅ Prior findings addressed. Re-reviewed <short-sha>, N commits since the prior pass.`

A pass carrying only minors takes the same heading and the full shape rather than either short line, since the minors have to be readable and neither line reports them. Keep whichever scope sentence the pass owes on the summary line:

```markdown
## Review closed

0 critical, 0 should-fix, Z minor. Nothing blocks the merge. Reviewed against project docs and roadmap.

**`path/to/file.ext`**

- **minor**: finding, and the task whose findings now carry it.

🤖 Reviewed by Claude Code
```

A pass that closed by withdrawing a finding rather than by reading its fix takes neither ✅ line, per the withdrawal rule in Step 3. Both claim a fix landed, and the second names it, so posting either over a withdrawal credits work nobody did on the one comment a reader treats as the verdict. Write the withdrawal and the fact that settled it in place of the canned line, keeping the heading and the footer.

Post a close-out even when there is nothing to report. A review left with no closing comment reads as one nobody answered.

## Step 5: output

```plaintext
X critical, Y should-fix, Z minor. Posted to PR #<number>.
```

Report the merge decision as a plain recommendation in chat (merge, or address findings first). Do not merge.
