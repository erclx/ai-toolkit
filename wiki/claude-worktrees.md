---
title: Claude Code and git worktrees
description: Running parallel sessions on independent branches
---

# Claude Code and git worktrees

Each Claude Code conversation is a session tied to the current working directory. Sessions for a directory are stored under `~/.claude/projects/<sanitized-path>/`. A git worktree is a separate working directory on a separate branch, so a worktree gets its own session scope, its own transcripts, and its own `/resume` history. Two worktrees means two independent sessions, and those sessions can run in parallel.

See [how Claude Code works](https://code.claude.com/docs/en/how-claude-code-works) and the [parallel sessions workflow](https://code.claude.com/docs/en/common-workflows) for the canonical behavior.

## Two ways to create a worktree

**Native `--worktree` flag.** Claude Code creates and manages the tree for you:

```bash
claude --worktree feature-auth    # creates <repo>/.claude/worktrees/feature-auth/ on a new branch
claude -w                         # auto-generated name
```

Trees created this way are auto-cleaned on exit when the working copy is unchanged. If there are changes, the tree persists and can be resumed later. `.claude/worktrees/` is already marked as a writable path in the default permission model, so edits inside it don't trigger protected-path prompts.

**Plain `git worktree`.** Use this when you want the worktree to live outside the repo, on an existing branch, or under your own naming scheme:

```bash
git worktree add ../toolkit-feat-gemini feat/gemini-polish
cd ../toolkit-feat-gemini
claude
```

Either approach produces the same session isolation. The native flag is convenient for short-lived branches. Plain `git worktree` is better for long-lived parallel work where the path matters.

## Session scoping and `/resume`

`/resume` defaults to sessions from the current worktree. Press `Ctrl+W` inside the picker to widen the list to sessions from sibling worktrees of the same repository. Sessions resumed by name resolve across all worktrees of the repository, so you can jump back into a sibling tree's session without switching directories first.

Transcripts for each worktree live under their own `~/.claude/projects/<sanitized-path>/` directory. Removing a worktree does not delete its transcript directory. Prune manually if you care about disk.

## Settings and `CLAUDE.md` inside a worktree

Settings resolve hierarchically through four scopes: managed, user, project, and local. The project-scope `.claude/settings.json` is loaded from the worktree's directory, not from the main repo root. If a worktree carries its own `.claude/settings.json`, it overrides the main repo's project settings. User-scope settings still apply otherwise.

`CLAUDE.md` loads from the working directory and its parents, so a worktree inherits the main repo's `CLAUDE.md` when it sits inside the repo (the default for `--worktree`). A worktree placed outside the repo will not see the main repo's `CLAUDE.md`. Copy or symlink it if you need the same project rules.

Skills from `.claude/skills/` resolve from the worktree's directory as well. Skills added to the main branch are not visible inside a sibling worktree until that branch is checked out.

## Shared session scratch

`.claude/plans/`, `.claude/review/`, and `.claude/memory/` are gitignored and live at the main worktree root, not inside a linked worktree. Agents running inside a worktree resolve these paths against the main root via `git worktree list --porcelain | awk '/^worktree /{print $2; exit}'`, falling back to `pwd` when not in a git repo. The canonical rule is the Worktrees bullet in `CLAUDE.md`.

Ephemeral per-command scratch like `.claude/.tmp/pr/body.md` stays in the current worktree. It is deleted the same turn it is created, so centralizing buys nothing.

## Tooling caveats

Tools that honor `.gitignore` by walking parent directories will treat every file in a linked worktree as ignored once `.claude/worktrees/` is in the main repo's `.gitignore`. `cspell` is the concrete case in this repo. Bound its search with `gitignoreRoot: ["."]` in `cspell.json` so it stops at the config's own directory.

## Concurrent safety

Do not resume the same session in two terminals at once. Both terminals write to the same session file and messages interleave. Each terminal sees only its own view during the run, but the merged transcript becomes unreadable on the next resume. Use `--fork-session` to branch a session cleanly when two lines of work must share a starting context.

Separate sessions in separate worktrees are safe to run concurrently. There is no documented shared-cache or rate-limit contention between sessions, and no worktree-level locking. If two sessions auto-start the same stdio MCP server, each session spawns its own server process. Coordinate ports explicitly if a server binds one.

## Fan-out rules for this toolkit

The seven toolkit domains have different collision profiles. A worktree-based fan-out is safe when the branches touch disjoint trees and do not both write to the shared hotspots listed below.

**Safe to fan out.** Work confined to a single domain directory usually does not collide with work in another domain:

- `snippets/`
- `gemini/commands/`
- `prompts/`
- `antigravity/workflows/`
- A new skill under `claude/skills/<new-name>/` or `.claude/skills/<new-name>/`
- Independent fixes in different subtrees of `scripts/`

**Shared hotspots.** If a branch touches any of these, serialize rather than fan out. Parallel edits almost always produce a merge conflict or a stale regenerated file:

- `CLAUDE.md`: cross-domain behavior lives here, so every edit is on the hot path
- `.claude/TASKS.md`: append-only format, but the `Up next` block conflicts cleanly with one writer only
- `tooling/**`: stack manifests, golden configs, and seeds are tightly coupled, so a change often spans multiple files
- `docs/claude.md`, `docs/agents.md`: cross-referenced from multiple domains
- Any folder's `index.md`: regenerated by `bash scripts/core/regen-indexes.sh`, so two worktrees that both add files in regen-covered folders will race on the index

**Before fanning out.** Land any in-flight edit to a shared hotspot on `main` first. A worktree on a stale `CLAUDE.md` will drift from other parallel work and cost more to rebase than it saved.

## Related

- [Claude Code permissions](claude-permissions.md) for settings resolution details
- [Claude Code subagents](claude-subagents.md) for in-session parallelism without worktrees
- [Zshrc aliases for Claude Code](zshrc-aliases.md) for `clw` and friends to shorten worktree spawn
