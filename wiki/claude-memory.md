---
title: Claude Code memory
description: CLAUDE.md hierarchy, auto-memory, and rules files
---

# Claude Code memory

Claude Code carries knowledge across sessions through two mechanisms: `CLAUDE.md` files you write, and auto-memory notes Claude writes itself.

## CLAUDE.md hierarchy

Claude loads all `CLAUDE.md` files it finds by walking up the directory tree from the working directory. More specific files take precedence. The four scopes, from broadest to narrowest:

- Managed policy: system-wide, set by an org admin. Managed `CLAUDE.md` cannot be excluded
- User: `~/.claude/CLAUDE.md`, applies to all your projects
- Project: `./CLAUDE.md` or `./.claude/CLAUDE.md`, shared via source control
- Local: `./CLAUDE.local.md`, personal overrides, add to `.gitignore`

`CLAUDE.local.md` appends after `CLAUDE.md` within each directory.

Subdirectory `CLAUDE.md` files load on demand when Claude reads files in that directory, not at startup. Root-level files load in full at startup.

Set `claudeMdExcludes` in settings to skip specific `CLAUDE.md` files via glob patterns or absolute paths. Useful in monorepos where ancestor files are noisy. Managed-policy files cannot be excluded.

Files under `--add-dir` directories are not loaded by default. Set `CLAUDE_CODE_ADDITIONAL_DIRECTORIES_CLAUDE_MD=1` to opt in.

## Auto-memory

Auto-memory stores notes Claude writes itself, per repository. Files live in `~/.claude/projects/<sanitized-cwd>/memory/`. The directory key is derived from the git repo root, so worktrees and subdirs of the same repo share one auto-memory store. Outside git, the project root is used.

Claude saves useful learnings automatically: build commands, debugging patterns, project conventions.

Only the first 200 lines or 25 KB of `MEMORY.md` loads at startup, whichever comes first. Topic files load on demand.

Toggle auto-memory with `/memory` or set `autoMemoryEnabled: false` in settings. Override the location with `autoMemoryDirectory` (ignored when set in checked-in project settings, for security).

## Toolkit memory workflow

Project-scoped memory complements Claude Code's auto-memory. Files live at `.claude/memory/` in the project tree, gitignored, written by capture and curated through a review loop. The toolkit treats memory as a holding pen, not long-term storage. Every review should promote each entry to a durable surface (`CLAUDE.md`, skill body, standards, governance) or delete it. User-type memories are the exception when no in-repo target exists.

The loop:

1. **Capture** with `/claude-memory-capture`. Extracts durable patterns from the session and writes `feedback`, `project`, `user`, or `reference` entries.
2. **Review** with `/claude-memory-review`. Proposes per-entry actions (promote, hand off to governance, delete) and writes `.claude/review/memory-review-<branch>.md` with a `Decision:` slot per item.
3. **Discuss** with `@snippets/claude/memory-discuss`. Answers question Decisions inline as `Take:` lines. Multi-round, no mutations.
4. **Apply** with `@snippets/claude/memory-apply`. Commits `apply`, `skip`, or `defer` decisions, flips emoji statuses, surfaces pending items in the bucket summary.
5. **Cleanup** with `@snippets/claude/memory-cleanup`. Sweeps skipped non-user entries and deletes the review receipt.

`.claude/memory/` and `.claude/review/` always live at the main worktree root, never inside a linked worktree. Every snippet in the loop resolves the main root via `git worktree list --porcelain | awk '/^worktree /{print $2; exit}'` before reading or writing.

## Rules files

For modular instructions, use `.claude/rules/`. Each file covers one topic (e.g. `testing.md`, `api-style.md`). Claude discovers them recursively. Symlinks are followed.

Files support path scoping via frontmatter:

```yaml
---
paths:
  - 'src/api/**/*.ts'
---
```

User-level rules at `~/.claude/rules/` apply to all projects.

## Imports

`CLAUDE.md` supports `@path/to/file` to pull in additional markdown files. Paths resolve relative to the importing file.

```markdown
See @README for project overview and @package.json for commands.
```

Imports support up to five levels of nesting.

## Tips

- Keep individual `CLAUDE.md` files under 200 lines. Longer files reduce adherence
- Use HTML comments (`<!-- notes -->`) for internal notes. Claude strips them before injection to save tokens
- Use `CLAUDE.local.md` for personal preferences that should not be committed
