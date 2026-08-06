---
title: Records
description: Validating the gitignored session records under .claude/, the per-kind checks, the refusal reasons, backing the folders to a private remote, and why the root defaults to the main worktree
---

# Records

## Validate

`aitk records validate <kind>` reports where a session record and the standard governing it disagree. The four kinds are `plans`, `groundwork`, `intake`, and `memory`, each a gitignored folder under `.claude/`.

```bash
aitk records validate plans
aitk records validate memory
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
| `plans`      | A filename that is not `feature-<slug>.md`, a missing `# Feature:` heading, a missing required section, a files-to-touch entry naming no file or saying nothing about one, and a question carrying no suggestion or no answer slot    |
| `groundwork` | A track with no `README.md` or no `01-current-state.md`, a file missing `title` or `description`, a `README.md` with no `date` as `YYYY-MM-DD`, an unnumbered file, and a track holding a decision without its handoff or the reverse |
| `intake`     | A dump with no `00-overview.md`, the same frontmatter and numbering checks, an item missing any of `Problem`, `Fix`, `Worth it`, or `You`, and an item carrying `Open` with no `Suggested`                                            |
| `memory`     | A filename whose prefix names none of the four types, an entry missing `title`, `description`, or `category`, a `category` disagreeing with that prefix, a title repeating the filename, and a rule-bearing body missing a part       |

The half-closed track is the groundwork check a reader cannot run by eye. A folder holding `06` without `07` reads as closed to anyone scanning filenames while the file a returning session actually opens is absent.

The item check skips `00-overview.md` and `99-next-session.md`, since neither holds items and running it over the handoff would report every heading it carries. The memory walk skips `index.md` for the same reason, since the catalog is generated from its siblings rather than authored as an entry.

A memory `category` is compared against the sentence-case form of the filename prefix rather than checked field by field, so one finding covers a prefix outside the four types, a field disagreeing with the prefix, and a casing drift that would open a second group in the catalog. The body check runs on `feedback` and `project` entries alone, because a `user` or `reference` entry is a single sentence by design and has no rule to apply.

A plan section opens as a bold label or as an H2 and the check counts both, naming the standard's spelling when it reports one missing. The corpus splits roughly four to one between the two forms, so failing the variant would report nearly every plan on a rule that costs a reader nothing.

A section runs to the next marker-shaped line whatever it names, so a plan carrying a label of its own closes the section above it rather than collecting into it. Fenced blocks are dropped before any of this, since a plan showing the shape it writes puts real-looking bullets and headings inside a fence.

### Exit codes and refusals

Exit codes: `0` every check passed, `1` refused, `2` at least one record carries a finding. A `reason` field carries which gate fired: `no-folder` when the kind's directory does not exist, and `unknown-kind` when the argument names no published kind.

The folders are shared scratch at the main worktree root, so `--root` defaults to the first entry of `git worktree list` rather than the working directory. A linked worktree validates the same records every other session reads.

Skills branch on the findings rather than on the exit code:

```bash
aitk records validate plans --json | jq -r '.findings[] | "\(.kind): \(.subject)"'
```

For the shapes each check enforces, see `.claude/standards/plan.md`, `.claude/standards/groundwork.md`, `.claude/standards/intake.md`, and `.claude/standards/memory.md`.

## Push and pull

`aitk records push` commits the backed record folders to a private remote and pushes them. `aitk records pull` fetches the other direction and writes them back. Both take `--json` and `--root` the way `validate` does, and both exit `0` on agreement and `1` on a refusal.

```bash
aitk records push
aitk records push --json
aitk records pull
```

The backed folders are `groundwork`, `intake`, `memory`, `plans`, `plans-archive`, `review`, `task-archive`, and `tasks`, all under `.claude/`. They are the gitignored Claude group minus `.claude/.tmp`, which is deletable without loss, and `.claude/worktrees/`, whose contents belong to the project repository already. The list is a constant rather than configuration, matching the four folder names `validate` hardcodes.

Records are gitignored by design, so the history lives in a second git directory at `.claude/.records.git` with `.claude/` as its work tree. Every path stays where it is, which is what a separate checkout could not do. The verbs stage the eight folders by explicit pathspec with `--force`, so nothing outside them can enter the index however the ignore rules read, and the project working tree and its index are never touched.

### Setup

A person creates the records repository once per machine, and the verbs refuse with the commands when it is absent:

```bash
git --git-dir=.claude/.records.git init
git --git-dir=.claude/.records.git remote add origin <private-repo-url>
printf '.claude/.records.git/\n' >> .gitignore
```

The ignore line is part of the setup rather than part of the installed gitignore group, because the person running these commands is the one who creates the directory. Every path that group ships is written by a toolkit command without anyone asking, and this one is not, so a project that never sets up records would carry a rule for a directory it will never hold. Leaving it out and adding it here puts the rule where whoever creates the directory reads it.

Point it at a private repository, and at one that is not a remote of the project. Records carry the memory pen, the review reports, and the groundwork trails, so a public project publishes all of it to anyone who fetches all refs. `push` compares the configured origin against every remote of the project and refuses on a match. A read of that list which fails refuses as well, since an empty list clears the comparison for every origin and a gate that passes on its own failure is no gate.

### Refusals

| Reason              | What fired                                                                           |
| ------------------- | ------------------------------------------------------------------------------------ |
| `no-repository`     | No `.claude/.records.git`, answered with the two setup commands                      |
| `no-remote`         | The records history has no `origin`                                                  |
| `remote-unreadable` | The project's own remotes could not be read, so the shared-origin gate could not run |
| `remote-shared`     | The records origin is also a remote of the project                                   |
| `no-remote-records` | `pull` found no branch on the records origin                                         |
| `local-changes`     | `pull` found records on disk that the history does not carry                         |
| `local-ahead`       | `pull` found local commits that never reached the origin                             |
| `git-failed`        | A git call failed, with its stderr in the message                                    |

The two `pull` refusals exist because the directions are not symmetric. A push only adds, while a pull onto a machine holding work that never left it would discard that work. Resolve either by running `push` first, or by moving the local folders aside. A machine holding none of the eight has nothing to lose, so a restore onto a fresh checkout runs straight through.

### When it runs

`.husky/post-merge` runs `push` after the task-archive loop, on every merge rather than only on one that archived a task. A review report and a memory entry both land on runs that close nothing. The call sits inside an `if` and last in the file, so an unreachable remote neither aborts the hook nor delays the archiving above it, and a checkout that never ran the setup reports nothing. Anything the hook misses is covered by running the verb by hand.
