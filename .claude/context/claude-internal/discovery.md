---
title: Plugin discovery
description: How a local session loads the plugin from this repository and from a target project
---

# Plugin discovery

Inside the toolkit repository, Claude Code auto-discovers the plugin from `claude/.claude-plugin/plugin.json`. No flag needed.

In other repositories, pass `--plugin-dir` explicitly:

```bash
claude --plugin-dir $TOOLKIT/claude
```

Add shell aliases to avoid typing the flag each time. Set `TOOLKIT` once in `~/.zshrc` and reference it in the `clp` alias:

```zsh
TOOLKIT=~/path/to/toolkit

alias cl='claude'
alias clp='claude --plugin-dir $TOOLKIT/claude'
alias clps='clp --model sonnet'
```

For the full alias set covering resume, continue, worktree, and model shortcuts, see `docs/zshrc-aliases.md`.

Machine provisioning is a separate concern reachable by the same word. `aitk claude setup` installs user-level Claude config at `~/.claude/` and is covered in `.claude/context/claude-plugin/cli.md`.
