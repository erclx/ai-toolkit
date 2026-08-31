---
title: Command catalog
description: Every project-level command and every domain subcommand, plus the shape each domain exposes
---

# Command catalog

Full help: `canon <command> --help`. Behavior notes for the install and sync verbs live in `install-and-sync.md`.

## Project-level

| Command                       | Purpose                                                                                                                                                               |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `canon init [path]`           | Bootstrap a project with selected toolkit domains                                                                                                                     |
| `canon sync [path]`           | Sync all installed domains in a target project                                                                                                                        |
| `canon sync --check`          | Report toolkit drift and the installed version against the newest published (`--json`, `--exit-code`)                                                                 |
| `canon sandbox [cat:cmd]`     | Run sandbox scenarios (interactive or routed), toolkit-only like the tree it reads                                                                                    |
| `canon sandbox reset`         | Reset sandbox to baseline                                                                                                                                             |
| `canon sandbox clean`         | Wipe the sandbox                                                                                                                                                      |
| `canon sandbox check`         | Score a provisioned sandbox against a scenario expectation (`--json` for the verdict)                                                                                 |
| `canon sandbox coverage`      | Report which scenarios declare expectations (`--json`, `--strict`, `--skills`)                                                                                        |
| `canon indexes regen`         | Regenerate `index.md` files from sibling frontmatter                                                                                                                  |
| `canon docs [topic]`          | Emit toolkit reference docs (`list`, or a topic by name)                                                                                                              |
| `canon design render`         | Render `.claude/DESIGN.md` tokens to HTML and CSS                                                                                                                     |
| `canon slides render`         | Render a `.claude/SLIDES.md` source into a PowerPoint deck, reporting any unrecognized layout name on stderr                                                          |
| `canon slides list`           | List the available slide layouts (`--json` for the catalog)                                                                                                           |
| `canon feedback`              | Write toolkit feedback from stdin to `.claude/review/feedback/`, or open a GitHub issue with `--github`                                                               |
| `canon transcripts <url>`     | Fetch a YouTube transcript with metadata frontmatter (needs `yt-dlp`)                                                                                                 |
| `canon tasks archive`         | Move a shipped task off the board, clear its ordering row, and regenerate the index                                                                                   |
| `canon tasks pull-request`    | Record a pull request number on the task a branch closes, by stem or `--plan` (`--json`)                                                                              |
| `canon tasks outcome`         | Mark outcomes `[x]` on a task by position, repeating `--close` (`--json`)                                                                                             |
| `canon tasks validate`        | Report board rows whose shape, order, plan, task file, group, file set, or blocker does not hold (`--json`)                                                           |
| `canon intake list`           | Report intake folder counts, or one folder's items, keeping what is unread with `--unread` (`--json`)                                                                 |
| `canon intake answer`         | Write selections into one cluster's answer slots, repeating `--set <item>=<answer>` (`--json`)                                                                        |
| `canon teach list`            | Report learning workspaces and the ordinal a new one takes, or what one workspace holds (`--json`)                                                                    |
| `canon teach open`            | Open a workspace at the next ordinal with its mission, resources, and glossary files (`--json`)                                                                       |
| `canon teach resource`        | Record sources and leads in a workspace, repeating `--read` or `--lead` as `<title>=<url>` (`--json`)                                                                 |
| `canon teach glossary`        | Add terms to a workspace glossary alphabetically, repeating `--term <term>=<definition>` (`--json`)                                                                   |
| `canon records validate`      | Report a session record or a standard against the standard governing it, per kind (`--json`)                                                                          |
| `canon records migrate`       | Rewrite the records a validate finding names a recoverable transform for (`--write`, `--json`)                                                                        |
| `canon records size`          | Report what each record folder holds and how much of it is recent, heaviest first (`--json`)                                                                          |
| `canon records push`          | Commit the nine backed record folders and push them to a private records remote (`--json`)                                                                            |
| `canon records pull`          | Fetch the records remote and write it back, refusing rather than discarding unpushed records (`--json`)                                                               |
| `canon migrate rename`        | Rewrite every unprotected `aitk` token to `canon` and move the paths that carry the name, reporting the plan without `--write` (`--scope`, `--json`)                  |
| `canon sessions list`         | Resolve live sessions to the worktree and branch each holds, filtered by `--branch` (`--json`)                                                                        |
| `canon worktrees list`        | Report which worktrees are reclaimable, keyed on the pull request having merged, with every refusal and the removal route named (`--json`)                            |
| `canon comments scan`         | Measure comment density by language and comment kind, with a trend recomputed from git                                                                                |
| `canon context audit`         | Report required sections, length, cited paths, reference form, catalog tables, provenance, superseded-decision narration, and index drift                             |
| `canon markdown audit`        | Fail any markdown path on a banned character, word, or spelling, and report the structural checkpoints                                                                |
| `canon claude skills audit`   | Report both skill corpora against the mechanical rules in `standards/skill.md`                                                                                        |
| `canon standards audit`       | Report the corpus against the `## Success criterion` gate, failing only on a standard new to the branch (`--json`, `--arrivals-only`)                                 |
| `canon claude skills drift`   | Name the shipped skill bodies rewritten between a given ref and `HEAD`, and the installed version against the newest published (`--json`)                             |
| `canon claude skills reach`   | Report the bodies in either skill corpus citing a toolkit path no target project receives, exiting 2 on an unqualified one                                            |
| `canon claude skills rank`    | Score either skill corpus's descriptions against a case corpus by TF-IDF cosine similarity, reporting rank-one and top-three (`--cases <path>`)                       |
| `canon claude routing`        | Report per `CLAUDE.md` section how many bullets name a path and how many of those a path-scoped rule already covers (`--json`)                                        |
| `canon gov test-order`        | Report where an implementation reached history ahead of the test covering it (`--json`)                                                                               |
| `canon gov superseded`        | Report where the tree still asserts a value a changed convention no longer produces, keyed on the value and on the family stem behind a templated citation (`--json`) |
| `canon gov restated`          | Report every instruction the always-loaded file or a rule shares with the seed, a shipped skill body, or another rule, classed and with its anchors named (`--json`)  |
| `canon gov citations`         | Resolve every path a rule cites and every internal frontmatter glob, failing on one reaching nothing (`--json`)                                                       |
| `canon secrets scan`          | Report credential-shaped values in the tree the package ships, keyed on issued values rather than on words (`--json`)                                                 |
| `canon deps audit`            | Report published advisories against the resolved dependency set, refusing rather than reporting clean when the index is unreachable (`--json`)                        |
| `canon labels audit`          | Report the labels a changed set earns from the pull request label map and the paths no row reaches (`--json`)                                                         |
| `canon labels scan`           | Fail a pull request whose title or body carries a phase label, sorting a release pull request's tokens as semver rather than as a leak (`--event`, `--json`)          |
| `canon autoship classify`     | Decide whether a changed set needs the review pass, naming the file and the test that decided it (`--json`)                                                           |
| `canon pr key-changes`        | Compare the files a pull request body's Key Changes names against its own diff, in both directions (`--body`, `--base`, `--json`)                                     |
| `canon repo metadata propose` | Compare a description, homepage, and topic set computed from the README and `package.json` against what the remote carries, writing nothing (`--root`, `--json`)      |
| `canon repo metadata apply`   | Write an explicitly supplied description, homepage, or topic set to the remote through `gh repo edit` (`--description`, `--homepage`, `--topics`, `--root`, `--json`) |
| `canon census [path]`         | Report tracked file count, a breakdown by extension, and a line total that skips whatever reads as binary (`--json`)                                                  |
| `canon audits run`            | Run every audit as one set, report per check under one verdict, and compare each count to the recorded baseline (`--json`, `--record`)                                |
| `canon audits list`           | List every audit the set runs, with the corpus each reads and whether it gates (`--json`)                                                                             |
| `canon gate run`              | Run every stage that guards a branch here, scoping shell, types, and tests to the changed set (`--all`, `--no-write`, `--nested`, `--json`)                           |
| `canon inventory [subject]`   | Walk every route a project declares and group its elements by the property each computes, as a listing rather than a gate (`--json`)                                  |
| `canon capture [source]`      | Render HTML capture sources to PNG, toolkit-only and absent from an installed package                                                                                 |
| `canon serve [dir]`           | Serve a directory on the loopback interface and print the link that opens it, running until interrupted (`--port`, `--entry`, `--json`)                               |
| `canon upgrade`               | Reinstall the CLI globally with the package manager the install path names (`--json`)                                                                                 |

`canon serve` ships and drives no browser, which is what separates it from the two that do. A generated page loses its stylesheet and its script to an editor preview and to a `file://` open, so the link is the delivery rather than a convenience, and every generated surface here reaches a reader through one. It binds `127.0.0.1` and never a wildcard, because what it is pointed at is routinely a gitignored record tree. It sends `cache-control: no-store`, since a preview exists to be edited and reloaded and a cached stylesheet reads as a fix that did not work.

A port already in use is the ordinary case rather than a refusal, so it walks forward to the next free one and reports which it took. That is why a caller reads `url` off the `--json` record instead of composing one from the port it asked for. Only contention is walked past. Any other bind failure refuses as `bind-failed` carrying the error's code, rather than being retried twenty times and reported as a range being full, which names a cause nothing checked.

A request naming a directory is redirected to its trailing-slash form rather than answered in place. A browser resolves a relative asset against the last slash of the URL it is on, so answering `/lesson` directly leaves the page asking for `/course.css` instead of `/lesson/course.css`, and it renders unstyled through the server that exists to prevent exactly that.

Containment is tested after symlinks are followed rather than on the path as written, and the test sits immediately before the read rather than beside the request that produced it. Resolving a request lexically clears a link pointing outside the served root, and this repository is a live instance of that shape, since `claude/standards` and `claude/snippets` are links out of `claude/`. Position is what makes the property hold: a directory request appends its index after the request path has been checked, so a check placed earlier leaves that index untested. An `--entry` that escapes the root refuses with `no-entry` before a port is taken, because `url` is the field a caller hands to a reader.

`canon demo` is the second browser command and the one that ships, since its purpose is running in a target rather than regenerating what this repository commits. It needs a browser binary the package does not carry, installed once with `bunx playwright install chromium`.

`canon inventory` is the third and takes the same answer for the same reason. It reads `inventory.toml` at the project root for its base URL, its routes, and the element query each subject runs over, so what it walks comes from the project rather than from the toolkit. It reports how many different answers a site gives for one property and never gates, because whether five focus rings across four routes is a defect is a judgment. A missing server and an unmatched query are both refusals rather than empty listings, since a listing with no rows reads as one consistent answer.

```toml
base-url = "http://localhost:4173"
routes = ["/", "/pricing", "/docs"]

[subjects.focus]
query = "button, a[href], input, select, textarea, [tabindex]"
```

## Domain commands

Each domain exposes a consistent shape where applicable: `list`, `install`, `sync`, `create`.

| Domain      | Subcommands                                                                                                                           |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `tooling`   | `list`, `sync`, `ref`, `create`, `verify`, `inject`, `prune-gitignore`                                                                |
| `snippets`  | `list`, `create`                                                                                                                      |
| `standards` | `list`, `audit`, `<name>`                                                                                                             |
| `gov`       | `list`, `install`, `sync`, `build`, `regen`, `test-order`, `superseded`, `citations`                                                  |
| `claude`    | `init`, `sync`, `routing`, `seeds list`, `skills list`, `skills audit`, `skills drift`, `skills reach`, `skills rank`, `setup [dest]` |
| `demo`      | `compile`, `run`                                                                                                                      |
| `inventory` | `run`                                                                                                                                 |
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
| `migrate`   | `rename`                                                                                                                              |
| `autoship`  | `classify`                                                                                                                            |
| `audits`    | `run`, `list`                                                                                                                         |
| `gate`      | `run`                                                                                                                                 |

Common patterns:

- `list --json` → machine-readable catalog on stdout.
- `install <name> <path>` → install a specific entry into a target project.
- `sync <path>` → reapply all installed entries in a target project.
- `create [name]` → scaffold a new authoring entry in this repo.

`migrate rename` moves a project off the retired `aitk` name. It reports until `--write` is passed, and `--scope target` rewrites the toolkit-owned folders alone, reporting every other citation as one the project owns rather than editing prose somebody wrote. A project installing `canon` fresh never needs it.

## Version skew

`canon sync --check` and `canon claude skills drift` are the two moments a target
already stops to reconcile with the toolkit, so each reports the installed
version against the newest published one. No other command performs the lookup,
which keeps a registry round trip out of the catalog reads an agent runs in a
loop.

The report carries three states and never changes an exit code. `behind` names
`canon upgrade` as the remedy, `current` says so, and `unknown` carries the
reason the registry could not be reached. Branch on the `skew.state` field in
the JSON record rather than on the exit, since an offline machine has to read as
unmeasured rather than as a failing check.
