---
title: Zshrc aliases for Claude Code
description: Shell aliases that shorten common Claude Code invocations
---

# Zshrc aliases for Claude Code

Claude Code auto-discovers the toolkit plugin from `claude/.claude-plugin/plugin.json` when run inside the toolkit repository. Outside the toolkit, that discovery does not fire, so a separate set of aliases bakes in `--plugin-dir` explicitly. Two parallel sets cover both cases.

## The aliases

Set `TOOLKIT` to wherever you cloned the repository, then place the alias block below it in `~/.zshrc`.

```zsh
TOOLKIT=~/path/to/toolkit

alias cl='claude'
alias clr='cl -r'
alias clc='cl -c'
alias clw='cl -w'
alias cls='cl --model sonnet'

alias clp='claude --plugin-dir $TOOLKIT/claude'
alias clpc='clp -c'
alias clps='clp --model sonnet'
```

Place this block near the end of `~/.zshrc`, after any `PATH` mutations and the `claude` CLI install. Zsh expands aliases recursively on the first word, so `clr`, `clc`, `clw`, and `cls` inherit their base through `cl`, and `clpc` and `clps` inherit `--plugin-dir` through `clp`. `$TOOLKIT` expands at invocation time, so updating the variable and re-sourcing reroutes all `clp` calls without touching the alias definitions.

## What each one does

`cl` through `cls` carry no explicit plugin dir. Use them inside the toolkit repository, where Claude Code auto-discovers the plugin from `claude/.claude-plugin/plugin.json`. Loading `--plugin-dir` on top of auto-discovery registers every skill twice and produces duplicate entries in the slash command list.

- `cl`: plain session in the current directory
- `clr`: opens the `/resume` picker scoped to the current directory. Trailing arguments filter by name. `clr auth` limits results to sessions containing "auth".
- `clc`: jumps straight into the most recent session for the current directory. No picker. Faster than `clr` when the terminal closed and you want back into the same session.
- `clw`: creates a worktree under `.claude/worktrees/<name>/` on a fresh branch and starts a Claude Code session in it. Pass the worktree name as the trailing arg: `clw feat-auth`.
- `cls`: pins the session to Sonnet instead of the default Opus. Use for routine work where Opus cost is not justified.

`clp`, `clpc`, and `clps` bake in `--plugin-dir`. Use them outside the toolkit repository, where auto-discovery does not fire.

- `clp`: session with the toolkit plugin loaded explicitly
- `clpc`: jumps straight into the most recent session for the current directory with the plugin loaded. The `clp` mirror of `clc`.
- `clps`: `clp` pinned to Sonnet

## When to use which

Use `cl` by default when working in the toolkit repository. Auto-discovery loads the plugin and the two-key alias keeps it short.

Use `clp` in any other repository where you want the toolkit skills available. Without the flag, those repos do not load the plugin.

Use `cls` or `clps` to save Opus usage on routine sessions. Switch mid-session with `/model` to avoid restarting.

Use `clw <name>` for features that will take more than one session. A worktree isolates the branch, the transcripts, and the `/resume` history. See [Claude Code and git worktrees](claude-worktrees.md) for fan-out rules.

Use `clc` to resume the last session without a picker. Use `clr` when you have several sessions and need to pick by name or recency. Outside the toolkit repo, `clpc` is the same shortcut as `clc` with the plugin loaded.

## Why not a function

A function with subcommand dispatch (`cl r`, `cl c`, `cl w foo`) was considered and rejected. It loses shell completion and adds a layer of indirection. Separate aliases are self-contained and the shared `cl`/`clp` prefixes make them easy to recall.
