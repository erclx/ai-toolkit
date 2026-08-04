---
title: Records
description: Validating the gitignored session records under .claude/, the per-kind checks, the refusal reasons, and why the root defaults to the main worktree
---

# Records

## Validate

`aitk records validate <kind>` reports where a session record and the standard governing it disagree. The three kinds are `plans`, `groundwork`, and `intake`, each a gitignored folder under `.claude/`.

```bash
aitk records validate plans
aitk records validate intake --json
```

| Option          | Behavior                                      |
| --------------- | --------------------------------------------- |
| `--json`        | Add a machine-readable record on stdout       |
| `--root <path>` | Project root, defaulting to the main worktree |

It reads and never writes. Each folder is per-machine scratch with no history behind it, so a repair that guessed wrong could not be undone, and the report names the record for a session to fix.

Nothing fires it automatically. The folders are gitignored, so the standards-audit hook exits early on them and any check reading changed files from git never lists one. The verb runs at the moment a session claims the record is finished, which is the same placement `aitk tasks validate` takes over the board.

### What each kind checks

| Kind         | What it reports                                                                                                                                                                                                                       |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plans`      | A filename that is not `feature-<slug>.md`, a missing `# Feature:` heading, a missing required section, a files-to-touch entry with no backticked path and reason, and a question carrying no suggestion or no answer slot            |
| `groundwork` | A track with no `README.md` or no `01-current-state.md`, a file missing `title` or `description`, a `README.md` with no `date` as `YYYY-MM-DD`, an unnumbered file, and a track holding a decision without its handoff or the reverse |
| `intake`     | A dump with no `00-overview.md`, the same frontmatter and numbering checks, an item missing any of `Problem`, `Fix`, `Worth it`, or `You`, and an item carrying `Open` with no `Suggested`                                            |

The half-closed track is the groundwork check a reader cannot run by eye. A folder holding `06` without `07` reads as closed to anyone scanning filenames while the file a returning session actually opens is absent.

The item check skips `00-overview.md` and `99-next-session.md`, since neither holds items and running it over the handoff would report every heading it carries.

### Exit codes and refusals

Exit codes: `0` every check passed, `1` refused, `2` at least one record carries a finding. A `reason` field carries which gate fired: `no-folder` when the kind's directory does not exist, and `unknown-kind` when the argument names no published kind.

The folders are shared scratch at the main worktree root, so `--root` defaults to the first entry of `git worktree list` rather than the working directory. A linked worktree validates the same records every other session reads.

Skills branch on the findings rather than on the exit code:

```bash
aitk records validate plans --json | jq -r '.findings[] | "\(.kind): \(.subject)"'
```

For the shapes each check enforces, see `.claude/standards/plan.md`, `.claude/standards/groundwork.md`, and `.claude/standards/intake.md`.
