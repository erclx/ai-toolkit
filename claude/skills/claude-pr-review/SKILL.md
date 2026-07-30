---
name: claude-pr-review
description: Reviews an open pull request from an independent session and posts findings as a review comment on the PR. Reads project docs and the roadmap for cross-feature context a self-review lacks. Use when asked to "review the PR", "review this feature's PR", "post a PR review", or acting as the orchestrator reviewing a worker's PR. Do NOT use to review local uncommitted changes. That is `claude-review`.
---

# Claude PR review

This is the orchestrator's independent review, distinct from `claude-review`.
`claude-review` reviews local changes for the session that wrote them and writes
to disk. This one reviews an open PR the session did not write and posts the
findings to the PR, so the vantage is independent and the output is durable.

## Guards

- If no open PR resolves for the target branch via `gh pr view`, stop: `❌ No open PR to review. Open one first, or use /claude-review for local changes.`
- Review and post. Do not merge. Merging is the human's gate.

## Step 1: resolve the PR and read context

Resolve the PR number: `gh pr view --json number,headRefName,title` for the current branch, or use a PR number the user names.

Read these in parallel from the project root, skipping any that do not exist:

- `CLAUDE.md`: project type, conventions, and commands
- `.claude/REQUIREMENTS.md`: feature scope and non-goals
- `.claude/ARCHITECTURE.md`: technical design decisions
- `.claude/ROADMAP.md`: where this feature sits and what depends on it
- `.claude/plans/feature-<slug>.md` for the branch, when present: the intent the PR should satisfy

Coding standards from `.claude/rules/` are auto-loaded by Claude Code.

## Step 2: get the PR diff and changed files

```bash
gh pr diff <number>
```

```bash
gh pr diff <number> --name-only
```

Read each changed file. Skip deleted files. Run reads in parallel.

## Step 3: review

Review the diff and files for the same axes as `claude-review` (bugs, edge cases, error handling, logic flaws, security, rule violations), then add the three lenses a self-review structurally cannot apply:

- Integration: does this fit the roadmap sequence, the shared wiring seam, and any sibling PR in flight?
- Contract: does a contract downstream features depend on land correctly, and should the plan itself be questioned?
- Consumers: when the change touches a resource several steps consume, enumerate every consumer and check the rule against each. A rule written for the consumer the change targets can be wrong for a sibling that writes.

Apply the high-signal filter: flag only what will cause incorrect behavior, break a documented rule, or mislead a downstream feature. If uncertain, do not flag.

Use severity: `critical` (blocks merge), `should-fix` (fix before merge), `minor` (visibility only).

## Step 4: post to the PR

Write the comment to `.claude/.tmp/pr-review/body-<number>.md`. Key the filename on the PR number so two sessions reviewing different pull requests never overwrite each other between the write and the post. The comment is a rendered-for-human GitHub surface, so follow `.claude/standards/prose.md` for voice: cut editorializing, and keep every sentence load-bearing. Match this shape:

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

Open every comment with the `## Review` heading so it anchors as a section distinct from human threads. Do not append the PR number, which GitHub already renders above the comment. Budget the body. State each finding as the failure and the fix in two or three sentences, not a paragraph of reasoning. Omit files with no findings. Do not lecture on process. The integration, contract, and consumer lenses stay, but as findings, not asides.

The `What is right` section is optional, capped at three bullets, and included only when it changes the merge decision. Drop it otherwise and let the summary line carry the approval.

Close the body with `🤖 Reviewed by Claude Code` on its own line so the review reads as an independent machine pass, not a human sign-off.

Before posting, scan the body for em dashes and semicolons and rewrite each, splitting into two sentences or using a comma. The standards-audit hook skips `.claude/.tmp/`, so this scan is the only gate on the published comment.

```bash
gh pr review <number> --comment --body-file .claude/.tmp/pr-review/body-<number>.md
```

If there are no findings, post this body instead, under the same `## Review` heading and with the footer included: `✅ No blocking findings. Reviewed against project docs and roadmap.` followed by the footer line.

## Step 5: output

```plaintext
X critical, Y should-fix, Z minor. Posted to PR #<number>.
```

Report the merge decision as a plain recommendation in chat (merge, or address findings first). Do not merge.
