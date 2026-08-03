---
name: claude-pr-review
description: Reviews an open pull request from an independent session and posts findings as a review comment on the PR. Posts a first pass against the whole change and every later pass against only the commits added since, under `## Review` while anything is open and `## Review closed` once nothing is. Reads project docs and the roadmap for cross-feature context a self-review lacks. Use when asked to "review the PR", "review this feature's PR", "post a PR review", "re-review the PR", "close out the review", "confirm the findings are fixed", or acting as the orchestrator reviewing a worker's PR. Do NOT use to review local uncommitted changes. That is `claude-review`.
---

# Claude PR review

This is the orchestrator's independent review, distinct from `claude-review`.
`claude-review` reviews local changes for the session that wrote them and writes
to disk. This one reviews an open PR the session did not write and posts the
findings to the PR, so the vantage is independent and the output is durable.

It posts at least twice over a pull request's life. A first pass opens the
review against the whole change, and every later pass reads only the commits
added since. The heading reports state rather than pass number: a pass carrying
findings takes `## Review`, and `## Review closed` is reserved for a pass
carrying none, so the most recent comment's heading reports where the review
stands. Every pass is this skill, and which one it is gets detected from the
thread rather than named by the caller.

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

A later pass applies the same axes to the delta, and adds one check the first pass cannot make: did each prior finding land, and did the fix regress anything it touched. Findings of its own are normal findings, stated at the same severity and counted the same way. That count is what Step 4 reads to pick the heading, so a pass raising one of its own is not a close-out.

Use severity: `critical` (blocks merge), `should-fix` (fix before merge), `minor` (visibility only).

## Step 4: post to the PR

Write the comment to `.claude/.tmp/pr-review/body-<number>-<short-sha>.md`. The PR number stops two sessions reviewing different pull requests from overwriting each other between the write and the post. The head commit stops a second pass overwriting the first one's body, and leaves the folder a record of which commit each review covered. Derive both segments from Step 1. Never pick a suffix by hand, and never reuse a name the folder already holds.

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

The heading reports whether anything is open and the summary line reports which pass this is. Post under `## Review` whenever the pass carries a finding at any severity, whether it is the first pass or the fourth. Reserve `## Review closed` for a pass carrying none, which makes it the marker worth scanning for rather than a label on a kind of pass. A pull request thread then reads as `## Review`, the worker's answer under `## Review response` from `claude-address-review`, another `## Review` while anything is still open, and `## Review closed` when nothing is.

Read the state off the most recent review comment rather than off the presence of a closed one. A close-out does not close the pull request, so a commit pushed after it gets its own pass, and that pass reopens the review under `## Review` when it raises anything.

Both of this skill's headings anchor as a section distinct from human threads. Do not invent one beyond those two and the `## Review response` a sibling owns, and do not append the PR number, which GitHub already renders above the comment.

Name the scope in every summary line after the first pass, since a reader cannot otherwise tell a narrow read from a full one. When the fallback in Step 2 fired, replace the commit count with `Re-reviewed the full change, the prior pass's commit is no longer on the branch`. Budget the body. State each finding as the failure and the fix in two or three sentences, not a paragraph of reasoning. Omit files with no findings. Do not lecture on process. The integration, contract, and consumer lenses stay, but as findings, not asides.

The `What is right` section is optional, capped at three bullets, and included only when it changes the merge decision. Drop it otherwise and let the summary line carry the approval.

Close the body with `🤖 Reviewed by Claude Code` on its own line so the review reads as an independent machine pass, not a human sign-off.

Before posting, run the scan in `.claude/standards/publish.md` against the body, or `${CLAUDE_SKILL_DIR}/../../standards/publish.md` when the project does not have it. The hook skips `.claude/.tmp/`, so this scan is the only gate on the published comment. A finding phrased against an internal phase label is what the label half of the scan catches here.

```bash
gh pr review <number> --comment --body-file .claude/.tmp/pr-review/body-<number>-<short-sha>.md
```

A pass with no findings takes `## Review closed` and a short body, with the footer line included either way. On a first pass, post `✅ No blocking findings. Reviewed against project docs and roadmap.` On a later pass, post `✅ Prior findings addressed. Re-reviewed <short-sha>, N commits since the prior pass.` Post that one even when there is nothing to report. A review left with no closing comment reads as one nobody answered.

## Step 5: output

```plaintext
X critical, Y should-fix, Z minor. Posted to PR #<number>.
```

Report the merge decision as a plain recommendation in chat (merge, or address findings first). Do not merge.
