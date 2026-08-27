---
title: Command catalog
description: Every project-level command and every domain subcommand, plus the shape each domain exposes
---

# Command catalog

Full help: `aitk <command> --help`. Behavior notes for the install and sync verbs live in `install-and-sync.md`.

## Project-level

| Command                    | Purpose                                                                                                                                                              |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `aitk init [path]`         | Bootstrap a project with selected toolkit domains                                                                                                                    |
| `aitk sync [path]`         | Sync all installed domains in a target project                                                                                                                       |
| `aitk sync --check`        | Report toolkit drift and the installed version against the newest published (`--json`, `--exit-code`)                                                                |
| `aitk sandbox [cat:cmd]`   | Run sandbox scenarios (interactive or routed), toolkit-only like the tree it reads                                                                                   |
| `aitk sandbox reset`       | Reset sandbox to baseline                                                                                                                                            |
| `aitk sandbox clean`       | Wipe the sandbox                                                                                                                                                     |
| `aitk sandbox check`       | Score a provisioned sandbox against a scenario expectation (`--json` for the verdict)                                                                                |
| `aitk sandbox coverage`    | Report which scenarios declare expectations (`--json`, `--strict`, `--skills`)                                                                                       |
| `aitk indexes regen`       | Regenerate `index.md` files from sibling frontmatter                                                                                                                 |
| `aitk docs [topic]`        | Emit toolkit reference docs (`list`, or a topic by name)                                                                                                             |
| `aitk design render`       | Render `.claude/DESIGN.md` tokens to HTML and CSS                                                                                                                    |
| `aitk slides render`       | Render a `.claude/SLIDES.md` source into a PowerPoint deck                                                                                                           |
| `aitk slides list`         | List the available slide layouts (`--json` for the catalog)                                                                                                          |
| `aitk feedback`            | Write toolkit feedback from stdin to `.claude/review/feedback/`, or open a GitHub issue with `--github`                                                              |
| `aitk transcripts <url>`   | Fetch a YouTube transcript with metadata frontmatter (needs `yt-dlp`)                                                                                                |
| `aitk tasks archive`       | Move a shipped task off the board, clear its ordering row, and regenerate the index                                                                                  |
| `aitk tasks pull-request`  | Record a pull request number on the task a branch closes, by stem or `--plan` (`--json`)                                                                             |
| `aitk tasks outcome`       | Mark outcomes `[x]` on a task by position, repeating `--close` (`--json`)                                                                                            |
| `aitk tasks validate`      | Report board rows whose plan, task file, group, file set, or blocker does not hold (`--json`)                                                                        |
| `aitk intake list`         | Report intake folder counts, or one folder's items, keeping what is unread with `--unread` (`--json`)                                                                |
| `aitk intake answer`       | Write selections into one cluster's answer slots, repeating `--set <item>=<answer>` (`--json`)                                                                       |
| `aitk teach list`          | Report learning workspaces and the ordinal a new one takes, or what one workspace holds (`--json`)                                                                   |
| `aitk teach open`          | Open a workspace at the next ordinal with its mission, resources, and glossary files (`--json`)                                                                      |
| `aitk teach resource`      | Record sources and leads in a workspace, repeating `--read` or `--lead` as `<title>=<url>` (`--json`)                                                                |
| `aitk teach glossary`      | Add terms to a workspace glossary alphabetically, repeating `--term <term>=<definition>` (`--json`)                                                                  |
| `aitk records validate`    | Report a session record or a standard against the standard governing it, per kind (`--json`)                                                                         |
| `aitk records migrate`     | Rewrite the records a validate finding names a recoverable transform for (`--write`, `--json`)                                                                       |
| `aitk records size`        | Report what each record folder holds and how much of it is recent, heaviest first (`--json`)                                                                         |
| `aitk records push`        | Commit the nine backed record folders and push them to a private records remote (`--json`)                                                                           |
| `aitk records pull`        | Fetch the records remote and write it back, refusing rather than discarding unpushed records (`--json`)                                                              |
| `aitk sessions list`       | Resolve live sessions to the worktree and branch each holds, filtered by `--branch` (`--json`)                                                                       |
| `aitk comments scan`       | Measure comment density by language and comment kind, with a trend recomputed from git                                                                               |
| `aitk context audit`       | Report required sections, length, cited paths, reference form, catalog tables, provenance, superseded-decision narration, and index drift                            |
| `aitk markdown audit`      | Fail any markdown path on a banned character, word, or spelling, and report the structural checkpoints                                                               |
| `aitk claude skills audit` | Report both skill corpora against the mechanical rules in `standards/skill.md`                                                                                       |
| `aitk claude skills drift` | Name the shipped skill bodies rewritten between a given ref and `HEAD`, and the installed version against the newest published (`--json`)                            |
| `aitk claude skills reach` | Report the shipped bodies citing a toolkit path no target project receives, exiting 2 on an unqualified one                                                          |
| `aitk claude skills rank`  | Score the shipped catalog's descriptions against a hand-authored case corpus by TF-IDF cosine similarity, reporting rank-one and top-three                           |
| `aitk claude routing`      | Report per `CLAUDE.md` section how many bullets name a path and how many of those a path-scoped rule already covers (`--json`)                                       |
| `aitk gov test-order`      | Report where an implementation reached history ahead of the test covering it (`--json`)                                                                              |
| `aitk gov superseded`      | Report where the tree still asserts a value a changed convention no longer produces, keyed on the value (`--json`)                                                   |
| `aitk gov restated`        | Report every instruction the always-loaded file or a rule shares with the seed, a shipped skill body, or another rule, classed and with its anchors named (`--json`) |
| `aitk secrets scan`        | Report credential-shaped values in the tree the package ships, keyed on issued values rather than on words (`--json`)                                                |
| `aitk deps audit`          | Report published advisories against the resolved dependency set, refusing rather than reporting clean when the index is unreachable (`--json`)                       |
| `aitk labels audit`        | Report the labels a changed set earns from the pull request label map and the paths no row reaches (`--json`)                                                        |
| `aitk census [path]`       | Report tracked file count, a breakdown by extension, and a line total that skips whatever reads as binary (`--json`)                                                 |
| `aitk audits run`          | Run every audit as one set, report per check under one verdict, and compare each count to the recorded baseline (`--json`, `--record`)                               |
| `aitk audits list`         | List every audit the set runs, with the corpus each reads and whether it gates (`--json`)                                                                            |
| `aitk capture [source]`    | Render HTML capture sources to PNG, toolkit-only and absent from an installed package                                                                                |
| `aitk upgrade`             | Reinstall the CLI globally with the package manager the install path names (`--json`)                                                                                |

`aitk demo` is the second browser command and the one that ships, since its purpose is running in a target rather than regenerating what this repository commits. It needs a browser binary the package does not carry, installed once with `bunx playwright install chromium`.

## Domain commands

Each domain exposes a consistent shape where applicable: `list`, `install`, `sync`, `create`.

| Domain      | Subcommands                                                                                                                           |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `tooling`   | `list`, `sync`, `ref`, `create`, `verify`, `inject`, `prune-gitignore`                                                                |
| `snippets`  | `list`, `install`, `sync`, `create`                                                                                                   |
| `standards` | `list`, `<name>`                                                                                                                      |
| `gov`       | `list`, `install`, `sync`, `build`, `regen`, `test-order`, `superseded`                                                               |
| `claude`    | `init`, `sync`, `routing`, `seeds list`, `skills list`, `skills audit`, `skills drift`, `skills reach`, `skills rank`, `setup [dest]` |
| `demo`      | `compile`, `run`                                                                                                                      |
| `wiki`      | `init`                                                                                                                                |
| `design`    | `render`                                                                                                                              |
| `slides`    | `render`, `list`                                                                                                                      |
| `tasks`     | `archive`, `validate`                                                                                                                 |
| `intake`    | `list`, `answer`                                                                                                                      |
| `teach`     | `list`, `open`, `resource`, `glossary`                                                                                                |
| `comments`  | `scan`                                                                                                                                |
| `context`   | `audit`                                                                                                                               |
| `markdown`  | `audit`                                                                                                                               |
| `secrets`   | `scan`                                                                                                                                |
| `deps`      | `audit`                                                                                                                               |
| `labels`    | `audit`                                                                                                                               |
| `audits`    | `run`, `list`                                                                                                                         |

Common patterns:

- `list --json` → machine-readable catalog on stdout.
- `install <name> <path>` → install a specific entry into a target project.
- `sync <path>` → reapply all installed entries in a target project.
- `create [name]` → scaffold a new authoring entry in this repo.

## Version skew

`aitk sync --check` and `aitk claude skills drift` are the two moments a target
already stops to reconcile with the toolkit, so each reports the installed
version against the newest published one. No other command performs the lookup,
which keeps a registry round trip out of the catalog reads an agent runs in a
loop.

The report carries three states and never changes an exit code. `behind` names
`aitk upgrade` as the remedy, `current` says so, and `unknown` carries the
reason the registry could not be reached. Branch on the `skew.state` field in
the JSON record rather than on the exit, since an offline machine has to read as
unmeasured rather than as a failing check.
