---
name: claude-autoship
description: Chains implement → verify → review → ship after a feature plan is approved. Reads the plan the caller names, or the plan for the current branch when none is named, runs the full pipeline in one session, and stops on any failure or non-minor review finding. Use when asked to "autoship", "ship this feature end to end", or "run the chain". Do NOT auto-trigger. Requires an approved plan file.
disable-model-invocation: true
---

# Claude autoship

Chain the post-plan pipeline in a single run. Every step has a stop condition. State is always recoverable on stop: code lives on the branch, review output on disk, plan still linked.

## Guards

- All `.claude/plans/` and `.claude/review/` reads resolve at the main worktree root, not the current worktree. See Worktrees in `CLAUDE.md`.
- Derive `<slug>` per `${CLAUDE_SKILL_DIR}/../../standards/slug.md`. This skill takes the stop rather than the `latest` fallback, since it commits and opens a pull request. If empty, stop: `❌ Detached HEAD. Checkout the feature branch first.` Every later step keys its output on this slug, being the worktree, the review receipt, the branch, and the memory proposal, regardless of which plan Step 1 reads.
- Resolve `<plan>` in Step 1, ahead of any other read.
- If the working tree has uncommitted changes unrelated to the plan, stop: `❌ Uncommitted changes outside the plan. Commit or stash before autoshipping.`

## Diff baseline

Step 5 classifies the changed-file list to decide whether review runs. Resolve the base ref once:

```bash
git merge-base HEAD origin/main 2>/dev/null || git merge-base HEAD main 2>/dev/null
```

Prefer `origin/main` over local `main`. A local `main` trailing the remote pulls other people's merged commits into the list, so the classifier decides against files this branch never touched.

The baseline is unusable when no merge base resolves against either ref. Stop: `❌ No diff baseline against main. Fetch origin, then re-run autoship.`

The base equalling HEAD stays usable here, unlike in the four read-only siblings carrying this section. Step 5 runs before anything is committed, since `git-stage` commits at Step 7, so the base equals HEAD on every ordinary run. The classifier diffs the base against the working tree rather than against HEAD, which keeps the uncommitted work in the set at correct scope. Do not port the sibling `base == HEAD` stop into this skill.

## Step 0: enter a worktree

If `git rev-parse --git-dir` equals `git rev-parse --git-common-dir`, the session is in the main worktree. Invoke `aitk:claude-worktree` before continuing. The wrapper handles name derivation and branch alignment. Do not call `EnterWorktree` directly.

If neither command resolves, stop: `❌ Not a git repository. Autoship needs git or a WorktreeCreate hook.`

If the two commands differ, the session is already in a linked worktree. Continue.

## Step 1: read the plan

Resolve `<plan>` in this order, stopping at the first match:

1. **Caller-supplied.** The invocation carried an argument. Accept it as a plan path or a bare slug, in the same position `claude-worktree` tier 0 accepts its name. A bare slug resolves to `.claude/plans/feature-<slug>.md`, and a path is taken as given, relative to the main worktree root. If it does not resolve to a file, stop: `❌ No plan at <path>. Path was supplied, not derived, so check it and re-run.`
2. **Derived.** `.claude/plans/feature-<slug>.md`, from the `<slug>` the Guards derived. If it does not exist, stop: `❌ No approved plan at .claude/plans/feature-<slug>.md. Run /claude-feature first.`

Read `<plan>` at the main worktree root. This file is the scope for this run.

Its sections and its answer contract are fixed by `${CLAUDE_SKILL_DIR}/../../standards/plan.md`. A blank `- Answer:` accepts the `- Suggested:` line above it, so an unanswered question is a decision this run executes rather than a reason to stop.

## Step 2: implement

Implement only what the plan describes. Do not expand scope. Do not refactor neighbors. Do not touch files outside the plan's "Files to touch" list without reason.

## Step 3: verify

Run the verify commands defined in `CLAUDE.md` (lint, typecheck, tests). On failure:

- Make **one** fix attempt targeting the reported errors
- Re-run only the failing command
- If it still fails, stop: `❌ Verify failed after one fix attempt. Review logs and retry manually.`

Do not loop. Do not bypass hooks.

## Step 4: UI test (conditional)

If the diff touches UI files (JSX, TSX, Vue, Svelte, HTML, or CSS under `src/`), invoke `aitk:claude-ui-test`.

If `claude-ui-test` produces a manual checklist, stop: `❌ UI requires visual verification. Checklist at .claude/review/ui-checklist-<slug>.md. Verify manually, then run /git-ship.`

If all UI changes are covered by e2e tests, continue.

## Step 5: review

Classify the diff first. Take the union of `git diff --name-only <base>` and `git ls-files --others --exclude-standard`, resolving `<base>` per Diff baseline. The classifier reads names only.

An empty list stops the chain: `❌ No changed files to classify. Re-run when the plan has yet to produce its output. When the output is gitignored by design, autoship cannot ship it, so take the work out of the chain.` An empty list satisfies the prose-only test vacuously, so reading it as prose-only routes the branch past review instead of through it.

The two causes want different responses. A plan that has yet to produce its output is a re-run once it has. A plan whose output is gitignored by design, such as a read pass writing to `.claude/.tmp/`, is work the chain cannot carry at all, since `git-stage` finds nothing to commit six steps later. Never advise removing the output from `.gitignore`, which trades a stopped run for scratch committed into the repository.

The skip needs both tests to pass: every changed file matches `*.md` or `*.txt`, and no changed file sits under a behavior path. On a pass, skip review entirely and continue to Step 7. Otherwise invoke `aitk:claude-review`.

Behavior paths carry two spellings, the one a surface authors at and the one it reaches a session at, so the rule reads the same in a toolkit and in a project that consumed one:

- `claude/skills/` and `.claude/skills/`
- `governance/rules/` and `.claude/rules/`
- `standards/` and `.claude/standards/`, which is the authoring root and this repository's generated mirror rather than an install destination, since the corpus installs into no project
- `snippets/` and `.claude/snippets/`
- `internal/` and `tooling/`, which hold the stack references and the seed documents a target is handed
- `CLAUDE.md` at the repository root, named as a file because a path prefix reaches nothing that sits in no folder

Markdown under one of them states what an agent does, so a change there is a behavior change wearing a prose extension. Everything outside them is informational, which keeps `docs/`, `README.md`, and `CHANGELOG.md` skipping without naming them. One behavior file sends the whole branch to review, since documentation shipped beside a behavior change does not cancel it.

Informational prose is already gated by `docs-sync`, `claude-standards-audit`, and pre-push hooks. Running a code-style review on it burns tokens with no signal.

The list covers this toolkit's authoring layout and the layout it installs, which is not every layout. A project keeping executable prose where neither spelling reaches adds the path, and until it does every branch touching it skips review silently.

## Step 6: evaluate findings

Skip this step when Step 5 skipped review. Otherwise read `.claude/review/branch/review-<slug>.md` at the main worktree root. Split every finding by origin before parsing the summary line (`X critical, Y should-fix, Z minor`), since the stop exists for a defect the branch inherited rather than for one this run introduced.

- **This run caused it, at any severity.** Fix it, re-run the Step 3 verify commands, re-read the fixed file against what the finding claimed, and continue. Do not report it as a stop and do not offer the fix as a choice, which is the same stop wearing a proposal.
- **It predates this run, critical or should-fix.** Stop: `❌ Review found non-minor issues that predate this run. See .claude/review/branch/review-<slug>.md. Fix and run /git-ship.`
- **It predates this run, minor only.** Continue. The minor findings stay in the on-disk review receipt. Fold any a reviewer needs into the PR's `## Technical Context`. Do not add a separate review-notes section to the PR body.

Read origin as causation rather than authorship. Staleness this run induced in a file it never opened is a finding it caused, and the plan's "Files to touch" list scopes what the run builds rather than what it may repair.

Bound the repair at one pass, the way Step 3 bounds verify. When that re-read shows the finding still standing, stop: `❌ A self-introduced finding survived one fix pass. See .claude/review/branch/review-<slug>.md. Fix and run /git-ship.`

## Step 7: ship

Invoke each sub-skill in order via the Skill tool. After each returns, invoke the next immediately. Do not output text between steps.

1. `aitk:claude-memory-capture`: route what this session learned to the context entries that own it, and write the residue to `.claude/memory/`
2. `aitk:claude-docs`: sync `.claude/` planning docs against session decisions, folding in the routed facts
3. `aitk:docs-sync`: sync public docs against changes since main
4. Run `git add -A` to stage files the sync skills wrote
5. `aitk:git-stage`: group staged changes and commit by concern
6. `aitk:git-branch`: rename the branch to conventional format
7. `aitk:git-pr`: push and open the pull request

Capture runs first because a routed fact lands in a context entry, which is a tracked file. Running it after `git-pr`, where it used to sit, leaves that edit outside the branch and outside the pull request, so the fact reaches nothing. Memory files stay gitignored either way, which is why the old order was invisible.

After the PR is created, mark it as draft:

```bash
gh pr ready --undo
```

After marking draft, watch CI. Poll `gh pr checks <number>` until no check is pending, then read the final status.

On all-pass, continue. On any failure, stop and report the failing check with its URL. Do not auto-fix.

8. `aitk:claude-memory-review`: if step 1's capture wrote or updated at least one memory file, propose fixes scoped to those entries, writing the decision-ready receipt while session context is fresh. Skip when capture wrote nothing to the folder, which is the ordinary outcome once routing has taken the domain facts.

Review stays last because its receipt is gitignored and needs nothing from the commit, and because a proposal is worth more once CI has said whether the branch stands.

Stop at the Propose phase. Do not run Apply. Promoting an entry to `CLAUDE.md` or a skill body mutates how the agent operates and ships as its own change, separate from this feature.

## Output

Respond with up to five lines:

```plaintext
✅ Autoshipped (draft): <PR url>
<N minor findings kept in .claude/review/branch/review-<slug>.md>
<N facts routed to context entries>
<N memories captured in .claude/memory/>
<Memory proposal at .claude/review/memory/memory-review-<slug>.md>
```

Omit the second line if there were no minor findings, and the third if nothing routed. Omit the fourth and fifth if `claude-memory-capture` wrote no memory file this session, since an empty pen means no scoped review and no proposal. A run that routes every fact and writes none is the shape to expect, and it reports three lines.

## Failure recovery

Every stop point leaves recoverable state. The user resumes manually from the appropriate step.

| Stop point                         | Recovery                                                                                                                                       |
| ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| No plan (derived)                  | Run `/claude-feature` to create one                                                                                                            |
| No plan (caller-supplied)          | Check the path or slug passed to autoship, then re-run                                                                                         |
| No diff baseline                   | Fetch origin so a merge base resolves against `main`, then re-run autoship                                                                     |
| Empty changed-file list            | Re-run once the plan produces tracked output. Ship gitignored output outside the chain, never by tracking it.                                  |
| Branch collision on worktree entry | `claude-worktree` Step 5 found `<slug>` already as a local branch. Resolve manually (rename or delete the stale branch), then re-run autoship. |
| Verify fails                       | Read logs, fix manually, run `/git-ship`                                                                                                       |
| UI checklist                       | Verify visually, run `/git-ship`                                                                                                               |
| Inherited review findings          | Fix findings, run `/git-ship`                                                                                                                  |
| Self-introduced finding survived   | Read the receipt for what the one repair pass left open, fix it, run `/git-ship`                                                               |
| git-ship fails                     | Inspect hook or remote error, run again                                                                                                        |
