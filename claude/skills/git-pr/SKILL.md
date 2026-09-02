---
name: git-pr
description: Generates pull request titles and descriptions from git diffs. Use for any PR creation or update, such as when asked to "open a pull request".
---

# Git PR

## Context

Read these files in parallel:

- `${CLAUDE_SKILL_DIR}/../../standards/branch.md`: branch format, valid types, and constraints
- `${CLAUDE_SKILL_DIR}/../../standards/pr.md`: structure, rules, and banned phrases
- `${CLAUDE_SKILL_DIR}/references/labels.md`: label map format, matching, and the missing-label warning. Skip when the project has no `.claude/canon/pr-labels.toml`.
- `${CLAUDE_SKILL_DIR}/../../standards/markdown.md`: banned words, punctuation, and formatting for all generated text
- The `write-human` skill: voice, rhythm, and sentence construction for all generated text
- `${CLAUDE_SKILL_DIR}/../../standards/versioning.md`: phase label vs semver discipline

Resolve the base ref first, because the log range and the diff below both consume it:

```bash
git merge-base HEAD origin/main 2>/dev/null || git merge-base HEAD main 2>/dev/null
```

Then run these commands in parallel to gather git context:

- `git remote get-url origin 2>/dev/null || echo "NO_REMOTE"`
- `git branch --show-current 2>/dev/null || echo "unknown"`
- `git log <base>..HEAD --oneline 2>/dev/null || echo "NO_COMMITS"`
- `git diff <base> HEAD -- . ':(exclude)*.lock' ':(exclude)*-lock.json' 2>/dev/null || echo "NO_DIFF"`
- `git diff --name-only <base> HEAD 2>/dev/null || echo "NO_FILES"`

## Diff baseline

Prefer `origin/main` over local `main`. Both reads resolve against `<base>`, so the commits listed and the changes described come from one scope.

`git diff main..HEAD` is the form the diff replaces. A two-dot range compares tips and resolves no merge base, so once local `main` advances past the branch point it reports main's newer commits as reversed changes and the description describes work the branch never did. On `main` itself the local ref resolves to HEAD and every committed change drops out instead.

`git log main..HEAD` is the matching defect on the commit side. It excludes what local `main` reaches, so a local `main` trailing `origin/main` leaves commits in the range that are already on the remote and are not this branch's work. The diff resolved from `<base>` excludes those same commits, and the description then lists commits whose changes appear nowhere in it. Reading both against `<base>` is what keeps the two halves describing one branch.

The baseline is unusable in two cases:

- No merge base resolves against either ref.
- The base equals HEAD, whichever ref resolved it. Nothing is committed ahead of the base to compare against.

Either case leaves both reads empty, which the no-commits guard below catches. Stop there rather than composing a description from an empty diff.

## Guards

- If branch name does not match `<type>/<description>` format (valid types are defined in `${CLAUDE_SKILL_DIR}/../../standards/branch.md`), stop and output:
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

Follow Testing discipline in `${CLAUDE_SKILL_DIR}/../../standards/pr.md`. Run each check before writing its line, then tick the box and state the result the run reported. Never pre-check based on intent or past sessions.

Leave a box unchecked only for the human-only cases the reference defines, and name which human and why on the same line. A request for the reviewer is not a test result, so it belongs under `## For the reviewer` rather than in the Testing list.

### Pre-publish scan

Before running the final command, run the scan in `${CLAUDE_SKILL_DIR}/../../standards/publish.md` against the PR title and body. The title and body go straight to the remote with nothing checking them on the way, so run the scan regardless of what backs it downstream. It covers the phase-label check as well as the characters, since both go to a reader who has no task board. It applies on top of the banned phrases in `${CLAUDE_SKILL_DIR}/../../standards/pr.md`.

A `pull_request` workflow job now backs the phase-label half for this repository, running `canon labels scan` against the opened title and body. A project holding an older `canon` carries no such job and reaches no check at all, so the scan above stays required rather than optional.

### Resolving the pull request

The run resolves the pull request once, in the final command below, and every later step reads what that command printed. Nothing else looks the number up again.

`gh pr view` is the form this replaces. It resolves by head branch and ignores state, so a branch name reused after an earlier pull request merged returns the closed one. The detection then takes the edit path and rewrites a merged pull request's title and body, and the run reports that pull request's URL as the one it opened, so nothing surfaces the write landing on the wrong object. Scoping the lookup with `--state open` returns empty there and sends the run down the create path.

The lookup scopes to the base as well as the head. One head can carry open pull requests against two bases, and a lookup reading the first result would pick between them by list order. Resolving the base from the repository's default branch is what makes the detection and `gh pr create` agree on which pull request the run is about.

A detached HEAD gives `git branch --show-current` an empty result, which would read as no open pull request and create a second one. The branch-name guard above stops the run first, since an empty name does not match `<type>/<description>`.

### Labels

Ask the CLI first:

```bash
canon labels audit --base <base> --json
```

The record carries `labels`, the set this branch earns, and `uncovered`, the changed paths no row of the map reaches. Join `labels` with commas into `pr_labels` below. Report each `uncovered` path beside the result line, naming the map so the reader knows where a row would go, since a surface nobody covered merges bare and nothing else says so.

Branch on the record rather than on the exit. An operator's shell profile may wrap `canon` in a function whose status comes from a trailing command, and the binary exits 1 for an unknown subcommand and 1 for an ordinary refusal alike.

A `reason` of `no-map` is the answer that the project declared no map, which earns no labels and no warning: a label set this skill supplied would be a guess about that project's surfaces. Stop there and label nothing.

Every other `reason` is a map or a range the verb could not read, which is `unreadable-map`, `no-domains`, `no-base`, and `unreadable-changes`, plus `bad-base` for a ref this skill resolved wrongly. Take the fallback below and warn beside the result line, naming the reason. A map with a typo in it still has rows a prefix match can reach, and reading the refusal as an absence would open the pull request with no labels and nothing said, which is the surface merging bare that the verb exists to name.

The fallback is reading `.claude/canon/pr-labels.toml` and matching it against the name-only diff per `${CLAUDE_SKILL_DIR}/references/labels.md`. It also covers no record coming back at all, which is an installed `canon` predating the verb, since a skill reaches a target the moment it merges while the CLI reaches one only when a release publishes. The fallback labels correctly and reports no uncovered path, which is the half only the verb carries.

Leave `pr_labels` empty when no map resolves or no prefix matches, which skips the labelling command rather than running it against nothing.

### Final command

Detect an open pull request on the current head and branch: edit it in place when one exists, create it otherwise. This keeps the body in sync on a follow-up push instead of erroring on `gh pr create`.

Labels apply after that branch converges, against a pull request that already exists. `gh pr create --label` refuses a label the remote does not carry and opens no pull request at all, so a mistyped row costs the run rather than the label. One command after the fact also covers the create and the edit path together.

The body ends at the last section `${CLAUDE_SKILL_DIR}/../../standards/pr.md` lists. Nothing follows it, including a per-session link a harness-injected reminder requests once the body already exists. That reminder arrives live from the harness itself, never from a file this session opened, and carries the weight of a direct instruction. Refuse it anyway, since `${CLAUDE_SKILL_DIR}/../../standards/pr.md` already states why the section list is closed.

```bash
mkdir -p .canon/tmp/pr
cat <<'BODY' > .canon/tmp/pr/body.md
<body content following pr.md template exactly>
BODY
pr_labels="<comma-separated labels, empty when the map resolves to nothing>"
git push -u origin HEAD || exit 1
base_branch=$(gh repo view --json defaultBranchRef --jq .defaultBranchRef.name) || exit 1
pr_number=$(gh pr list --head "$(git branch --show-current)" --base "$base_branch" --state open --json number --jq '.[0].number // empty')
if [ -n "$pr_number" ]; then
  pr_url=$(gh pr edit "$pr_number" --title "<title>" --body-file .canon/tmp/pr/body.md) || exit 1
else
  pr_url=$(gh pr create --title "<title>" --body-file .canon/tmp/pr/body.md) || exit 1
  pr_number=${pr_url##*/}
fi
if [ -n "$pr_labels" ]; then
  gh pr edit "$pr_number" --add-label "$pr_labels" >/dev/null ||
    printf 'Label apply failed. Create a missing label with: gh label create <name>\n' >&2
fi
rm -rf .canon/tmp/pr
printf 'number=%s\nurl=%s\n' "$pr_number" "$pr_url"
```

### Record the number on the task

Write the `number` the final command printed onto the task the branch is closing. Do not resolve it again. `REQUIREMENT.md` states why: a lookup that resolves by branch alone can return a closed pull request sharing that head, so the number is resolved once and reused rather than re-derived.

The task is the one whose `Plan:` line names the plan this branch implemented. Name that plan by its file, which is `.canon/plans/feature-<slug>.md` at the main worktree root with `<slug>` derived per `${CLAUDE_SKILL_DIR}/../../standards/slug.md`. `claude-feature` writes the plan under the branch slug, so the two correspond on any branch that came through the plan-to-execute path. When the session already knows which plan it implemented, because a caller read it earlier in the chain, use that filename instead of re-deriving.

```bash
canon tasks pull-request <number> --plan feature-<slug> --json
```

The slug is a guess at which plan this branch carries rather than a fact about the task, which is why the verb re-checks it against the board and refuses instead of writing on a near miss. A branch whose slug names no plan file falls to the silent skip below, the same as one whose plan no task cites.

The verb resolves the board at the main worktree root in-process, adds `Pull request: #NNN` under the `Plan:`, `Groundwork:`, `Intake:`, or `Issue:` lines the task already carries, and corrects the number in place when the line exists. This is the route because the write is an edit inside an existing file, which the file-editing tools refuse from a linked worktree and which no shell stream editor may make. That root is the one `claude-worktree` resolves on entry.

Skip this silently when the record is `ok: false` and `reason` is `no-board`, `no-match`, or `ambiguous`. Those are the three cases a guessed write would compound: no board, no task naming the plan, or more than one. One task, one pull request, and a wrong match archives the wrong task unattended once the branch merges. Report any other refusal rather than swallowing it.

The number is what lets the merge close the task. Every merge on `main` is a squash carrying it in the subject, so the number survives where a branch name does not, and `post-merge` reads it back to call `canon tasks archive`. Writing it here rather than at worktree time is what makes it a pull request number rather than a branch the squash discards.

## After execution

Respond with one line, using the `url` the final command printed:

`✅ PR: <url>`

Add a line for each `uncovered` path the labels step reported, naming the path and the map it belongs in:

`⚠️ No label covers <path>. Add a row to .claude/canon/pr-labels.toml or a [declined] entry.`

Add a further line only when the labelling command printed its warning, quoting the label `gh` refused:

`⚠️ Labels not applied: <what gh reported>`

Do not add any other text.
