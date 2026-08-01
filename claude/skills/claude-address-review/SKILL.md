---
name: claude-address-review
description: Pulls review findings and CI status on the current branch's open PR, fixes each in the working tree, refreshes any stale `.claude/` docs, replies with a summary comment, and pushes a follow-up commit. The worker's return leg after `claude-pr-review`. Use when asked to "address the review", "fix the PR comments", "respond to review", or after an orchestrator posts findings. Do NOT use to write a review. That is `claude-pr-review`.
---

# Claude address review

The worker's half of the review channel. `claude-pr-review` posts findings to
the PR from an independent session. This skill consumes them: fix, reply, push.

## Guards

- If no open PR resolves for the current branch via `gh pr view`, stop: `❌ No open PR. Nothing to address.`
- If the PR has no review comments or threads, stop: `✅ No review findings to address.`
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

## Step 5: push, then reply

Push the fixes before posting the reply so the comment never runs ahead of the
code it describes. Ship the fixes as a follow-up commit on the same branch with
the `git-followup` skill, invoked with `reply-owned` so it stages, commits,
pushes, and refreshes the open PR body without posting its own comment. This
skill owns the reply. Do not reimplement that flow here. For in-place fixes to
files the PR body already covers, `git-followup` leaves the body untouched and
the reply comment carries the fix log.

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

Before posting, scan the reply for em dashes and semicolons and rewrite each,
splitting into two sentences or using a comma. The standards-audit hook skips
`.claude/.tmp/`, so this scan is the only gate on the published reply. Post it to
the PR:

```bash
gh pr comment <number> --body-file .claude/.tmp/address-review/reply-<number>.md
```

## Step 6: confirm resolution

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

## Step 7: output

```plaintext
Addressed <N> findings on PR #<number>. Follow-up pushed.
```

Name any finding left as a reply rather than a code change, with its one-line
reason. Do not merge. Hand back to the orchestrator for re-review.
