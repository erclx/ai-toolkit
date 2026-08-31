---
title: Indexes
description: Flags, exit codes, and JSON shape for canon indexes regen, plus when it auto-stages what it rewrote
---

# Indexes

`canon indexes regen` rewrites `index.md` files from sibling frontmatter. With no positional paths, it walks the current directory. With paths, each resolves by walking up to the nearest indexed ancestor, bounded by `--root`.

Duplicates dedupe. The whole-repo walk prunes `.git`, `node_modules`, and anything `.gitignore` covers via `git check-ignore`.

A positional path is not filtered that way, because the walk-up resolves on the filesystem and never consults git. That is the only way to regenerate an index inside a gitignored folder, and it is how `.claude/tasks/` and `.claude/memory/` both stay current.

Each is driven by a `PostToolUse` hook matching `Write|Edit|MultiEdit`, so a file moved by a shell `mv` fires nothing. A caller that relocates an entry runs the command itself once the last move is done.

| Option          | Behavior                                                         |
| --------------- | ---------------------------------------------------------------- |
| `--dry-run`     | Report which indexes would change without writing                |
| `--json`        | Emit a machine-readable record per index on stdout               |
| `--root <path>` | Walk-up boundary when positional paths are passed (default: CWD) |
| `--no-stage`    | Skip the auto `git add` on modified indexes                      |

Exit codes: `0` clean, `1` frontmatter error or missing index, `2` drift found in `--dry-run`.

An exit code says nothing about a call made from a session, since a shell profile may wrap the binary in a function taking its status from a later command. Read the record's `results` array rather than the exit when a skill consumes this, on the write pass as well as the dry run.

When positional paths are passed inside a git repo, modified `index.md` files are staged so lint-staged and Claude `PostToolUse` hooks commit the regenerated catalog. Whole-repo walks never auto-stage, and neither does a path git ignores, since staging one always fails and the warning would fire on every edit.

Skills can parse drift without branching on exit code:

```bash
canon indexes regen --dry-run --json | jq '.results[] | select(.action == "would-write")'
```

For the system rationale, frontmatter contract, when to adopt, and bootstrap path, see `.claude/context/indexes.md`.
