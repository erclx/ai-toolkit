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

Review the diff and files for the same axes as `claude-review` (bugs, edge cases, error handling, logic flaws, security, rule violations), then add the two lenses a self-review structurally cannot apply:

- Integration: does this fit the roadmap sequence, the shared wiring seam, and any sibling PR in flight?
- Contract: does a contract downstream features depend on land correctly, and should the plan itself be questioned?

Apply the high-signal filter: flag only what will cause incorrect behavior, break a documented rule, or mislead a downstream feature. If uncertain, do not flag.

Use severity: `critical` (blocks merge), `should-fix` (fix before merge), `minor` (visibility only).

## Step 4: post to the PR

Write the findings to `.claude/.tmp/pr-review/body.md`, grouped by file, sorted by severity within each file, with a summary line at the top. Then post:

```bash
gh pr review <number> --comment --body-file .claude/.tmp/pr-review/body.md
```

If there are no findings, post an approving comment body instead: `✅ No blocking findings. Reviewed against project docs and roadmap.`

## Step 5: output

```plaintext
X critical, Y should-fix, Z minor. Posted to PR #<number>.
```

Report the merge decision as a plain recommendation in chat (merge, or address findings first). Do not merge.
