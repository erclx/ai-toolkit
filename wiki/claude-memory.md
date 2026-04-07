# Claude Code memory

Claude Code carries knowledge across sessions through two mechanisms: `CLAUDE.md` files you write, and auto-memory notes Claude writes itself.

## CLAUDE.md hierarchy

Claude loads all `CLAUDE.md` files it finds by walking up the directory tree from the working directory. More specific files take precedence. The four scopes, from broadest to narrowest:

- Managed policy: system-wide, set by an org admin. Cannot be excluded
- User: `~/.claude/CLAUDE.md`, applies to all your projects
- Project: `./CLAUDE.md` or `./.claude/CLAUDE.md`, shared via source control
- Local: `./CLAUDE.local.md`, personal overrides, add to `.gitignore`

`CLAUDE.local.md` appends after `CLAUDE.md` at the same directory level.

Subdirectory `CLAUDE.md` files load on demand when Claude reads files in that directory, not at startup. Root-level files load in full at startup.

## Auto-memory

Auto-memory stores notes Claude writes itself, per repository. Files live in `~/.claude/projects/<project>/memory/`. Claude saves useful learnings automatically: build commands, debugging patterns, project conventions.

Only the first 200 lines or 25 KB of `MEMORY.md` loads at startup. Topic files load on demand.

Toggle auto-memory with `/memory` or set `autoMemoryEnabled: false` in settings.

## Rules files

For modular instructions, use `.claude/rules/`. Each file covers one topic (e.g. `testing.md`, `api-style.md`). Claude discovers them recursively.

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
