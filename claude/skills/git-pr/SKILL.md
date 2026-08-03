---
name: git-pr
description: Generates pull request titles and descriptions from git diffs. Use for any PR creation or update.
---

# Git PR

## Context

Read these files in parallel:

- `${CLAUDE_SKILL_DIR}/references/branch.md`: branch format, valid types, and constraints
- `${CLAUDE_SKILL_DIR}/references/pr.md`: structure, rules, and banned phrases
- `.claude/standards/prose.md` from the project root: prose conventions for all generated text
- `.claude/standards/versioning.md` from the project root: phase label vs semver discipline

Read a standard from `${CLAUDE_SKILL_DIR}/../../standards/` instead when the project does not have it.

Resolve the base ref first, because the log range and the diff below both consume it:

```bash
git merge-base HEAD origin/main 2>/dev/null || git merge-base HEAD main 2>/dev/null
```

Then run these commands in parallel to gather git context:

- `git remote get-url origin 2>/dev/null || echo "NO_REMOTE"`
- `git branch --show-current 2>/dev/null || echo "unknown"`
- `git log <base>..HEAD --oneline 2>/dev/null || echo "NO_COMMITS"`
- `git diff <base> HEAD -- . ':(exclude)*.lock' ':(exclude)*-lock.json' 2>/dev/null || echo "NO_DIFF"`

## Diff baseline

Prefer `origin/main` over local `main`. Both reads resolve against `<base>`, so the commits listed and the changes described come from one scope.

`git diff main..HEAD` is the form the diff replaces. A two-dot range compares tips and resolves no merge base, so once local `main` advances past the branch point it reports main's newer commits as reversed changes and the description describes work the branch never did. On `main` itself the local ref resolves to HEAD and every committed change drops out instead.

`git log main..HEAD` is the matching defect on the commit side. It excludes what local `main` reaches, so a local `main` trailing `origin/main` leaves commits in the range that are already on the remote and are not this branch's work. The diff resolved from `<base>` excludes those same commits, and the description then lists commits whose changes appear nowhere in it. Reading both against `<base>` is what keeps the two halves describing one branch.

The baseline is unusable in two cases:

- No merge base resolves against either ref.
- The base equals HEAD, whichever ref resolved it. Nothing is committed ahead of the base to compare against.

Either case leaves both reads empty, which the no-commits guard below catches. Stop there rather than composing a description from an empty diff.

## Guards

- If branch name does not match `<type>/<description>` format (valid types are defined in `${CLAUDE_SKILL_DIR}/references/branch.md`), stop and output:
  `❌ Branch name does not follow conventions. Run /git-branch to rename first.`
- If no commits ahead of main, stop and output:
  `❌ No commits ahead of main. Nothing to PR.`

## Response format

### Preview

- **Title:** <title>
- **Files changed:** <count>
- **Analysis:** <brief summary of impact>

After outputting the preview, execute the final command immediately. Claude Code's tool permission dialog is the confirmation gate. Do not wait for user input.

### Testing checkboxes

Follow Testing discipline in `${CLAUDE_SKILL_DIR}/references/pr.md`. Run each check before writing its line, then tick the box and state the result the run reported. Never pre-check based on intent or past sessions.

Leave a box unchecked only for the human-only cases the reference defines, and name which human and why on the same line. A request for the reviewer is not a test result, so it belongs under `## For the reviewer` rather than in the Testing list.

### Pre-publish scan

Before running the final command, run the scan in `.claude/standards/publish.md` against the PR title and body, or `${CLAUDE_SKILL_DIR}/../../standards/publish.md` when the project does not have it. The title and body go straight to the remote with nothing checking them on the way, so this scan is the only gate. It covers the phase-label check as well as the characters, since both go to a reader who has no task board. It applies on top of the banned phrases in `${CLAUDE_SKILL_DIR}/references/pr.md`.

### Resolving the pull request

The run resolves the pull request once, in the final command below, and every later step reads what that command printed. Nothing else looks the number up again.

`gh pr view` is the form this replaces. It resolves by head branch and ignores state, so a branch name reused after an earlier pull request merged returns the closed one. The detection then takes the edit path and rewrites a merged pull request's title and body, and the run reports that pull request's URL as the one it opened, so nothing surfaces the write landing on the wrong object. Scoping the lookup with `--state open` returns empty there and sends the run down the create path.

The lookup scopes to the base as well as the head. One head can carry open pull requests against two bases, and a lookup reading the first result would pick between them by list order. Resolving the base from the repository's default branch is what makes the detection and `gh pr create` agree on which pull request the run is about.

A detached HEAD gives `git branch --show-current` an empty result, which would read as no open pull request and create a second one. The branch-name guard above stops the run first, since an empty name does not match `<type>/<description>`.

### Final command

Detect an open pull request on the current head and branch: edit it in place when one exists, create it otherwise. This keeps the body in sync on a follow-up push instead of erroring on `gh pr create`.

```bash
mkdir -p .claude/.tmp/pr
cat <<'BODY' > .claude/.tmp/pr/body.md
<body content following pr.md template exactly>
BODY
git push -u origin HEAD || exit 1
base_branch=$(gh repo view --json defaultBranchRef --jq .defaultBranchRef.name) || exit 1
pr_number=$(gh pr list --head "$(git branch --show-current)" --base "$base_branch" --state open --json number --jq '.[0].number // empty')
if [ -n "$pr_number" ]; then
  pr_url=$(gh pr edit "$pr_number" --title "<title>" --body-file .claude/.tmp/pr/body.md) || exit 1
else
  pr_url=$(gh pr create --title "<title>" --body-file .claude/.tmp/pr/body.md) || exit 1
  pr_number=${pr_url##*/}
fi
rm -rf .claude/.tmp/pr
printf 'number=%s\nurl=%s\n' "$pr_number" "$pr_url"
```

### Record the number on the task

Write the `number` the final command printed onto the task the branch is closing. Do not resolve it again. A head branch that carried an earlier pull request now has two, and a second `gh pr view` would pick between them by a precedence rule nothing here states. Reading what created or edited the pull request needs no such rule.

Find the task by reading `.claude/tasks/` at the main worktree root, resolved with `git worktree list --porcelain | grep -m 1 '^worktree ' | cut -d' ' -f2-`. The board is shared scratch, so a linked worktree writing to its own `pwd` creates a second board nothing reads.

Confirm the match against the task's `Plan:` line, which names the plan this branch implemented. A branch name does not derive a plan slug and a plan slug does not derive a branch, so neither one alone identifies the task. Add `Pull request: #NNN` under the existing `Plan:`, `Groundwork:`, or `Issue:` lines when the task carries no such line, and correct the number in place when it does.

Skip this silently in three cases: no `.claude/tasks/` folder, no task whose `Plan:` line matches, or more than one match. One task, one pull request, so a second match is a misfile that a guessed write would compound. A wrong match archives the wrong task unattended once the branch merges.

The number is what lets the merge close the task. Every merge on `main` is a squash carrying it in the subject, so the number survives where a branch name does not, and `post-merge` reads it back to call `aitk tasks archive`. Writing it here rather than at worktree time is what makes it a pull request number rather than a branch the squash discards.

## After execution

Respond with exactly one line, using the `url` the final command printed:

`✅ PR: <url>`

Do not add any other text.
