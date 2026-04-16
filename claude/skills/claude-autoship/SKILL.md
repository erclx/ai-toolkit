---
name: claude-autoship
description: Chains implement → verify → cold review → ship after a feature plan is approved. Reads the plan for the current branch, runs the full pipeline in one session, and stops on any failure or non-minor review finding. Use when asked to "autoship", "ship this feature end to end", or "run the chain". Do NOT auto-trigger. Requires an approved plan file.
disable-model-invocation: true
---

# Claude autoship

Chain the post-plan pipeline in a single run. Every step has a stop condition. State is always recoverable on stop: code lives on the branch, review output on disk, plan still linked.

## Guards

- Run `git branch --show-current` and replace `/` with `-` to derive `<slug>`. If empty, stop: `❌ Detached HEAD. Checkout the feature branch first.`
- If `.claude/plans/feature-<slug>.md` does not exist, stop: `❌ No approved plan at .claude/plans/feature-<slug>.md. Run /claude-feature first.`
- If the working tree has uncommitted changes unrelated to the plan, stop: `❌ Uncommitted changes outside the plan. Commit or stash before autoshipping.`

## Step 1: read the plan

Read `.claude/plans/feature-<slug>.md` from the project root. This file is the scope for this run.

## Step 2: implement

Implement only what the plan describes. Do not expand scope. Do not refactor neighbors. Do not touch files outside the plan's "Files to touch" list without reason.

## Step 3: verify

Run the verify commands defined in `CLAUDE.md` (lint, typecheck, tests). On failure:

- Make **one** fix attempt targeting the reported errors
- Re-run only the failing command
- If it still fails, stop: `❌ Verify failed after one fix attempt. Review logs and retry manually.`

Do not loop. Do not bypass hooks.

## Step 4: UI test (conditional)

If the diff touches UI files (JSX, TSX, Vue, Svelte, HTML, or CSS under `src/`), invoke `toolkit:claude-ui-test`.

If `claude-ui-test` produces a manual checklist, stop: `❌ UI requires visual verification. Checklist at .claude/review/ui-checklist-<slug>.md. Verify manually, then run /git-ship.`

If all UI changes are covered by e2e tests, continue.

## Step 5: cold review

Spawn a subagent using the Agent tool. The subagent must not inherit implementation context from this session. Prompt it to invoke `toolkit:claude-review` and return when `claude-review` has written `.claude/review/review-<slug>.md`.

The subagent provides reviewer independence that a same-session invocation cannot.

## Step 6: evaluate findings

Read `.claude/review/review-<slug>.md` from the project root. Parse the summary line (`X critical, Y should-fix, Z minor`):

- Any critical or should-fix count greater than zero, stop: `❌ Review found non-minor issues. See .claude/review/review-<slug>.md. Fix and run /git-ship.`
- Zero critical and zero should-fix, continue. Keep the minor findings to attach to the PR body.

Do not auto-fix findings. The stop here is deliberate.

## Step 7: ship

Invoke `toolkit:git-ship` to run the ship sequence (docs sync, commit by concern, branch rename, PR open).

After `git-ship` completes, mark the PR as draft:

```bash
gh pr ready --undo
```

## Output

Respond with exactly two lines:

```
✅ Autoshipped (draft): <PR url>
<N minor findings attached to PR body>
```

Omit the second line if there were no minor findings.

## Failure recovery

Every stop point leaves recoverable state. The user resumes manually from the appropriate step.

| Stop point      | Recovery                                 |
| --------------- | ---------------------------------------- |
| No plan         | Run `/claude-feature` to create one      |
| Verify fails    | Read logs, fix manually, run `/git-ship` |
| UI checklist    | Verify visually, run `/git-ship`         |
| Review findings | Fix findings, run `/git-ship`            |
| git-ship fails  | Inspect hook or remote error, run again  |
