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

## Step 5: reply and push

Write a summary reply to `.claude/.tmp/address-review/reply.md` mapping each
finding to what changed, or to a one-line reason when it is a conscious-accept
rather than a defect. Note any `.claude/` docs refreshed as a result of the
fixes. The reply is a rendered-for-human GitHub surface, so follow
`.claude/standards/prose.md` for voice and keep each mapping to a line or two.
Structure the body with no heading: open with a one-line summary sentence, then
one bullet per finding, each opening with the bolded finding identifier. Do not
add a section header such as `## Review response`.
Close the body with `🤖 Addressed by Claude Code` on its own line so the reply
reads as an independent machine pass, not a human sign-off. Post it to the PR:

```bash
gh pr comment <number> --body-file .claude/.tmp/address-review/reply.md
```

Then ship the fixes as a follow-up commit on the same branch with the
`git-followup` skill, which stages, commits, pushes, and refreshes the open PR
body when the follow-up changes scope. Do not reimplement that flow here. For
in-place fixes to files the PR body already covers, `git-followup` leaves the
body untouched and the reply comment carries the fix log.

## Step 6: output

```plaintext
Addressed <N> findings on PR #<number>. Follow-up pushed.
```

Name any finding left as a reply rather than a code change, with its one-line
reason. Do not merge. Hand back to the orchestrator for re-review.
