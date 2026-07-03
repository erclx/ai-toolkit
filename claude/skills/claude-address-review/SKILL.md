---
name: claude-address-review
description: Pulls review findings posted on the current branch's open PR, fixes each in the working tree, replies with a summary comment, and pushes a follow-up commit. The worker's return leg after `claude-pr-review`. Use when asked to "address the review", "fix the PR comments", "respond to review", or after an orchestrator posts findings. Do NOT use to write a review. That is `claude-pr-review`.
---

# Claude address review

The worker's half of the review channel. `claude-pr-review` posts findings to
the PR from an independent session. This skill consumes them: fix, reply, push.

## Guards

- If no open PR resolves for the current branch via `gh pr view`, stop: `❌ No open PR. Nothing to address.`
- If the PR has no review comments or threads, stop: `✅ No review findings to address.`
- Fix findings. Do not merge.

## Step 1: pull the review findings

Read the review comments and threads on the PR:

```bash
gh pr view --json number,reviews,comments
```

For inline review comments, read them via `gh api` on the PR's review comments. Collect each finding with its file, location, and body.

## Step 2: address each finding

For each finding, implement the fix in the working tree. When a finding is a
question or a conscious-accept rather than a defect, note the reply text instead
of editing. Handle each finding independently. Do not let one unresolved finding
block the others.

## Step 3: verify

Run the project check (`bun run check` or the project's documented equivalent).
Do not push a red follow-up.

## Step 4: reply and push

Write a summary reply to `.claude/.tmp/address-review/reply.md` mapping each
finding to what changed, or to a one-line reason when it is a conscious-accept
rather than a defect. The reply is a rendered-for-human GitHub surface, so follow
`.claude/standards/prose.md` for voice and keep each mapping to a line or two.
Close the body with `🤖 Addressed by Claude Code` on its own line so the reply
reads as an independent machine pass, not a human sign-off. Post it to the PR:

```bash
gh pr comment <number> --body-file .claude/.tmp/address-review/reply.md
```

Then push the fixes as a follow-up commit on the same branch, syncing the open
PR. The git follow-up flow handles the stage, commit, push, and sync. Do not
reimplement it here.

## Step 5: output

```plaintext
Addressed <N> findings on PR #<number>. Follow-up pushed.
```

Name any finding left as a reply rather than a code change, with its one-line
reason. Do not merge. Hand back to the orchestrator for re-review.
