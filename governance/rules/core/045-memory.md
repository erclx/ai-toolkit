---
description: Keep memory writes scoped to .claude/memory/ and out of context-owned domains
---

# Memory standards

## Writing memory

- Write all memory files to `.claude/memory/`, not `~/.claude/projects/`
- A fact about a domain goes to that domain's `.claude/context/` entry, not to memory. `claude-memory-capture` routes it there and `claude-docs` folds it in. Memory keeps only what no context entry owns.
- Never delete a memory entry. Retire one by moving it to `.claude/.tmp/memory-archive/`. A bulk retire runs through the shell, where no file edit fires a path-scoped rule, and the folder is gitignored with nothing to recover from.
- Follow the memory standard, which your toolkit resolves by name, for the filename and type prefix, the frontmatter, the body shape each type carries, and the lifecycle. Check every entry in the pen against that standard and fix what breaks it, since nothing keeps the folder conforming on its own.
