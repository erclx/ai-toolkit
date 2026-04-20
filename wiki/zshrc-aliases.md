---
title: Zshrc aliases for Claude Code
description: Shell aliases that shorten common Claude Code invocations
---

# Zshrc aliases for Claude Code

Claude Code spawns a new session per directory, so a heavy worktree workflow means typing `claude --plugin-dir ... --worktree <name>` many times a day. A small set of zsh aliases cuts that to two or three keys while leaving the underlying flags available.

## The aliases

```zsh
alias claude='claude --plugin-dir ~/repos/ai/toolkit/claude'
alias cl='claude --plugin-dir ~/repos/ai/toolkit/claude'
alias clr='cl -r'
alias clc='cl -c'
alias clw='cl -w'
```

Place the block near the end of `~/.zshrc`, after any `PATH` mutations and the `claude` CLI install. Zsh expands aliases recursively on the first word, so `clr`, `clc`, and `clw` inherit `--plugin-dir` through `cl`.

## What each one does

- `claude`: unchanged entry point. Use it when passing arbitrary flags (`claude --model opus`, `claude --agents ...`). The `--plugin-dir` bake-in keeps the toolkit plugin set loaded.
- `cl`: identical to `claude`, two keys shorter. Use for plain sessions in the current directory.
- `clr`: opens the `/resume` picker scoped to the current directory. Trailing arguments filter the picker (`clr auth` searches for sessions with "auth" in the name).
- `clc`: jumps straight into the most recent session for the current directory. No picker. Faster than `clr` when the terminal closed or crashed and you want back into the session you were just in.
- `clw`: creates a new worktree under `.claude/worktrees/<name>/` on a fresh branch and starts a Claude Code session in it. Pass the worktree name as the trailing arg: `clw feat-auth`. Add `--tmux` manually if you want the session in a tmux or iTerm pane.

## When to use which

- Default to `cl` for one-off sessions in a repo you already `cd`'d into.
- Use `clw <name>` for any feature that will take more than one session. A worktree isolates the branch, the transcripts, and the `/resume` history. See [Claude Code and git worktrees](claude-worktrees.md) for the fan-out rules.
- Use `clc` to hop back into the session you just left. Skips the picker entirely.
- Use `clr` when you have several sessions in a directory and need to pick one by name or by recency.

## Why not a function

A function with subcommand dispatch was considered and rejected. Shapes like `cl r`, `cl c`, `cl w foo` collapse to one name but lose shell completion and add a layer of indirection. Separate aliases are more transparent, each one is self-contained, and the shared `cl` prefix makes them easy to recall. The tradeoff is four names to remember instead of one.
