# Project

[One-line description]

## Context

- Before non-trivial work in a domain read `.claude/context/<domain>.md`, and before touching a UI surface read `.claude/wireframes/<surface>.md`. Pick which from the index anchors below.
- Scan `.claude/wiki/index.md` before answering a how-to question about project tooling or the shell environment, where that folder exists
- `claude-docs` populates context entries at ship time

@.claude/REQUIREMENTS.md
@.claude/ARCHITECTURE.md
@.claude/context/index.md
@.claude/wireframes/index.md

## Behavior

- Flag concerns or alternatives when a proposed change has tradeoffs worth discussing
- When facing a judgment call with 2-3 reasonable options mid-flow, pick one and state the tradeoff in one sentence. Enumerate options only when the user's preference is the deciding factor.
- Put a call the user's preference decides through the structured question surface, such as `AskUserQuestion` in Claude Code, and fall back to a numbered list in one message where none exists. Rank the recommendation first and mark it, order the rest behind it, and give each option its cost, since an option with no stated cost is picked blind.
- Author the real choices only. A structured surface appends its own trailing escapes for a free-text answer and for reopening the question as conversation, so never write either as an option. On the numbered-list fallback, say that answering outside the list is fine.
- Answer from the artifact when one already put the question in writing with a suggestion, rather than re-asking it. A blank `- Answer:` slot in a plan accepts the `- Suggested:` line above it, per the plan standard, which your toolkit resolves by name.
- Match edit scope to the request. Ship minimal v1 and queue extensions as follow-ups.
- On simplification requests, edit only what the user named
- Do not add features the user did not ask for
- When rewriting a section, preserve existing code blocks, tables, and grouped examples unless the user asked to remove them
- When planning an edit to `CLAUDE.md`, show the proposed change as a fenced `diff` block in chat first, then wait for approval before calling `Edit`
- Keep a rule in `CLAUDE.md` when it applies every session regardless of what is being edited. Move one that fires only on a specific path being edited and ships silently when violated into `.claude/rules/`.
- Edit an existing file with the file-editing tool, never a shell stream editor. An unescaped `&` in a `sed` replacement expands to the whole match, and `sed -i` exits zero when its pattern matches nothing, so both fail silently while reporting success. This governs edits you make, not stream editors written into a project's own scripts.

## Indexes

- Check a folder's `index.md` before grepping its source or reading its files, starting with `.claude/context/` for a domain and `.claude/wireframes/` for a UI surface. It orients faster than a blind search.
- For folders where an agent browses to pick a document, `index.md` is regenerated from each file's frontmatter. Do not hand-edit `index.md`. Code folders and scratch folders do not need one.
- Every `index.md` carries its own frontmatter (`title`, `subtitle`) that the walker preserves. To keep a folder's `index.md` hand-edited, add `auto: false` to its frontmatter.

## Commands

- Run `bun run check` before committing. Full script reference in the development entry under `.claude/context/`.

## Output

- After creating or modifying a file, include its path on its own line so the reader can open it. Do not paraphrase paths into prose ("the seeds folder", "your CLAUDE.md").
- Read `CLAUDE_CODE_ENTRYPOINT` once, at the first response that emits a path, and reuse it for the rest of the session. The surface cannot change mid-session, so a second read only confirms the first.
- When it reads `claude-desktop`, emit each path as a markdown link carrying the path as its text and an absolute `file://` URI as its target, resolving a relative path against the main project root to build that target. The desktop file tree hides dotted folders, so a bare path into one names a file the reader cannot reach.
- On every other value, including unset, emit the path bare. A terminal emulator makes it clickable through its own path detection, and link markup defeats that.
- Both forms govern a path emitted in a response. A path written into a markdown file follows the markdown standard instead, which your toolkit resolves by name, and which backticks a file reference and never repeats it as a link label.
- Use the path the user's editor can resolve. The editor is rooted at the main project root.
- In the main worktree: relative from `pwd` works because `pwd` equals the editor root.
- In a linked worktree (under `.claude/worktrees/<name>/`): use absolute paths. Relative paths from worktree `pwd` would not resolve against the editor's project root.
- When the response covers multiple files, group paths under headers: `**Created:**`, `**Modified:**`, `**Deleted:**`. Every path under them takes the form the entrypoint selected rather than the first alone. For single-file changes, the path on its own line is enough.

## Key paths

- `src/`: [description]
- `.claude/`: planning docs (requirements, architecture, design, tasks)
- `.claude/context/`: per-domain narrative (how a domain is structured, decisions, gotchas), indexed via `.claude/context/index.md`
- `.claude/wireframes/`: per-surface ASCII layouts loaded on demand, indexed via `.claude/wireframes/index.md`
- `.claude/wiki/`: reference pages for tools, workflows, and concepts, indexed via `.claude/wiki/index.md`
- `.claude/rules/`: path-scoped coding standards loaded by Claude Code on file match
- `.claude/review/`: gitignored scratch for review and UI-test output, overwritten on each run

## Spelling

- When cspell flags a word, rewrite typos. Add real terms to the appropriate dictionary in `cspell.json`.
- Keep dictionary files sorted alphabetically

## Tasks

- `.claude/tasks/` is gitignored local session scratch, one file per task. Edit freely. No staging or revert before commits.
- Only create a task for work that spans multiple sessions or has real dependencies. Handle small edits immediately without a task entry.
- Do not add tasks retroactively for work already completed. Completed work is visible in git.
- When a task needs execution detail beyond its own file, create a plan in `.claude/plans/` and link to it from the task's intro paragraph. When that task ships, move its plan file to `.claude/plans/archive/`. Never delete it.
- Write the plan in the same session as the task file. The session that executes the plan later inherits reasoning context it would otherwise have to re-derive.

## Memory

- Write all memory files to `.claude/memory/`, not `~/.claude/projects/`
- A fact about a domain goes to that domain's `.claude/context/` entry, not to memory. `claude-memory-capture` routes it there and `claude-docs` folds it in. Memory keeps only what no context entry owns.
- Never delete a memory entry. Retire one by moving it to `.claude/.tmp/memory-archive/`. A bulk retire runs through the shell, where no file edit fires a path-scoped rule, and the folder is gitignored with nothing to recover from.
- Follow the memory standard, which your toolkit resolves by name, for the filename and type prefix, the frontmatter, the body shape each type carries, and the lifecycle. Check every entry in the pen against that standard and fix what breaks it, since nothing keeps the folder conforming on its own.

## Scratch

- Write temporary files to `.claude/.tmp/<slug>/<file>.md` in the project root, a nested `<slug>/` folder with a kebab-slug tied to the topic, not a flat `<slug>-<file>.md`. The scratch-guard hook enforces the location.

## Worktrees

- Implementation work runs in a linked worktree. From the main worktree, enter one with `/claude-worktree` before editing tracked files for a feature.
- Shared session scratch (`.claude/plans/`, `.claude/review/`, `.claude/memory/`, `.claude/tasks/`) lives at the main worktree root, not inside a linked worktree. From a linked worktree, resolve these paths against the main root via `git worktree list --porcelain | grep -m 1 '^worktree ' | cut -d' ' -f2-`. Fall back to `pwd` if not a git repo.
- From a linked worktree, every `Edit` or `Write` to a tracked file (source, docs) must use a path starting with `pwd`.
- From a linked worktree, `Edit` and `Write` are refused for every main-root path, session scratch included. The refusal names session isolation and points at the worktree copy, which is a second gitignored file no later session reads, so never take that redirect.
- `Read` resolves against the main root normally from a linked worktree. A main-root write reaches it only through `Bash`, as one plain command rather than a compound one, which is refused for complexity.
- Route a main-root write by what it does to the file. Creating a whole file goes out as one plain `Bash` command carrying a heredoc. Changing a line inside a file that already exists goes through a command that resolves the main root in-process, because the shell route for that case is the stream editor this file bans.
