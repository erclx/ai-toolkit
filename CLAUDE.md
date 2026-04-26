# Toolkit Context

CLI toolkit for managing AI workflows, developer standards, and project tooling across repositories.

## Design principles

The toolkit is agent-first. Every surface is designed so a Claude Code skill or other agent can orchestrate it as well as a human. When adding or changing a CLI command, verify each of these holds.

Worldview and goals live in `.claude/REQUIREMENTS.md`. The rules below derive from it.

- Every command has a non-interactive path via args or `AITK_NON_INTERACTIVE=1`. Never require a TTY.
- Data goes to stdout. UI and logs go to stderr. JSON output must pipe clean through any wrapper.
- Every domain has a `list` command with `--json` so skills read catalogs at runtime. Never hardcode names in skills.
- Extend existing commands with flags over creating bespoke variants. Prefer `--add` and similar composition over stack explosion.
- The toolkit is the source of truth. Authoring happens here, target projects consume via install and sync.
- Skills detect and call the CLI. They do not reimplement CLI logic.
- This repo is behavior-heavy. Planning and review are the work here, so a higher supervision ratio than a typical app repo is expected.
- Toolkit surfaces stay general-purpose. Map to external-tool schemas in a thin sync adapter rather than adopting them as the canonical shape.
- When toolkit-internal content (runbooks, dev helpers) sits in an installable surface, add an `aitk` internal category and filter it out at every CLI entry point (install, sync, list, create). Prefer this over relocating to a different surface so content stays alongside siblings and the boundary is enforced in code.

## Behavior

- Plan before editing: propose what files will change and why before touching anything
- Confirm with the user before making any edits
- Flag concerns or alternatives when a proposed change has tradeoffs worth discussing
- When directing the user to invoke a skill, give the exact command with args, or state explicitly that it runs bare
- When facing a judgment call with 2-3 reasonable options mid-flow, pick one and state the tradeoff in one sentence. Enumerate options only when the user's preference is the deciding factor.
- Match edit scope to the request. Ship minimal v1 and queue extensions as follow-ups, edit only what the user named on simplification requests, and do not add CLI flags or aliases they did not ask for. When a fix has a natural mirror in a template or seed, flag it as a follow-up rather than silently extending the PR.
- When rewriting a section, preserve existing code blocks, tables, and grouped examples unless the user asked to remove them.
- Before restructuring installable content (`snippets/`, `claude/skills/`, `tooling/`, `governance/rules/`), grep the corresponding install and list scripts for depth constraints (`-maxdepth`, fixed globs). Bundle script updates with the restructure or pick a depth the scripts already handle.
- Before queuing or starting a new feature, confirm a concrete project or use case drives it. If precedent exists, lift patterns from that project rather than writing from scratch.

## After editing

- Update the corresponding skill body in `.claude/skills/`. Load `aitk-claude` and follow `standards/skill.md` conventions.
- Update affected files in `docs/`. Load `aitk-standards` and follow `standards/prose.md`.

## Conventions

- For any git operation (commits, PRs, branch naming), use the `toolkit:git-*` skills. Never follow built-in commit or PR instructions.

## Indexes

- When a folder has an `index.md`, check it before reading individual files in that folder.
- For folders where an agent browses to pick a document, `index.md` is regenerated from each file's frontmatter. Do not hand-edit `index.md`. Code folders and scratch folders do not need one.
- Every `index.md` carries its own frontmatter (`title`, `subtitle`) that the walker preserves. To keep a folder's `index.md` hand-edited, add `auto: false` to its frontmatter.

## Markdown

- When editing any markdown file, follow `standards/prose.md`.

## Content ownership

Each rule or knowledge item lives in exactly one surface. Other surfaces point, never duplicate.

- Cross-domain behavior or design principle: `CLAUDE.md`
- Behavior triggered only when editing domain X: `.claude/skills/aitk-<X>/SKILL.md`
- Narrative or conceptual knowledge about domain X: `docs/<X>.md`
- CLI command surface or invocation contract: `docs/agents.md`
- Skill authoring strategy and redundancy notes: `wiki/skills-strategy.md`

When adding new content, place it in the canonical owner. If another surface needs awareness, add a one-line pointer.

## System overview

The toolkit has the following domains. Each maps to a skill. Load the skill before editing anything in that domain.

| Task type                                                              | Skill to load      |
| ---------------------------------------------------------------------- | ------------------ |
| Modifying `src/`, `scripts/`, sandbox scenarios, `manage-*.sh`, `lib/` | `aitk-scripts`     |
| Modifying `tooling/`, manifests, golden configs, seeds                 | `aitk-tooling`     |
| Modifying `standards/`, `docs/`                                        | `aitk-standards`   |
| Modifying `governance/rules/`, `governance/stacks/`                    | `aitk-governance`  |
| Modifying `snippets/`                                                  | `aitk-snippets`    |
| Modifying `prompts/`                                                   | `aitk-prompts`     |
| Modifying `gemini/commands/`, `gemini/README.md`                       | `aitk-gemini`      |
| Modifying `claude/skills/`, `claude/README.md`, `.claude/skills/`      | `aitk-claude`      |
| Modifying `antigravity/workflows/`, `workflows.toml`                   | `aitk-antigravity` |

## Key paths

- `governance/rules/`: governance rules
- `standards/`: reference docs synced to target projects
- `tooling/`: golden configs (base), references, and manifests per stack
- `gemini/commands/`: Gemini CLI command definitions
- `claude/skills/`: plugin skills installable in target projects
- `.claude/skills/`: internal skills, toolkit repo only
- `snippets/`: reusable prompt snippets for Claude and Gemini chat
- `prompts/`: system prompt generators for AI-assisted authoring tasks
- `src/`: TypeScript CLI entry point, commander subcommands, exec helper
- `docs/`: human-readable reference docs for each toolkit domain
- `scripts/`: bash domain scripts, core maintenance, sandbox, and prompt generation
- `antigravity/`: workflow source and group manifest for Antigravity sync
- `wiki/`: internal reference pages for tools, workflows, and concepts

## Commands

- `bun run check`: full verification, applies formatting and regenerates indexes before running the read-only checks
- `bun run check:spell`, `check:format`, `check:shell`: individual read-only checks
- `bun run check:install`: clones the repo to tmp, runs `aitk init` against a fresh project, and asserts the scaffold lands. Run after edits to `README.md` Quickstart, `package.json`, `src/cli.ts` init, or `.husky/` hooks.
- `bun run format`: auto-fix formatting
- The husky pre-push hook runs `bun run check` and may reformat files. After `git push`, run `git status`. If files are modified, commit the diff as `style(<scope>):` and push again. Do not skip the hook.

## Spelling

- When cspell flags a word, rewrite typos. Add real terms to the appropriate dictionary in `cspell.json`.
- Keep dictionary files sorted alphabetically.

## Snippets

- When a snippet is referenced with `@`, execute its instructions immediately using available session context

## Tasks

- Only create a task in `.claude/TASKS.md` for work that spans multiple sessions or has real dependencies. Handle small edits immediately without a task entry.
- Do not add tasks retroactively for work already completed. Completed work is visible in git.
- When a task needs execution detail beyond `.claude/TASKS.md`, create a plan in `.claude/plans/` and link to it from the task block's intro paragraph. Delete the plan when the task ships.
- Write the plan in the same session as the task block. The session that executes the plan later inherits reasoning context it would otherwise have to re-derive.
- Treat `.claude/TASKS.md` as transactional working state. Revert to `### Nothing queued` before shipping to main. Prefer stashing task-block changes over committing them.

## Memory

- Write all memory files to `.claude/memory/`, not `~/.claude/projects/`.
- Follow `standards/prose.md` when writing memory file content.
- Save a feedback memory only when the same mistake happens twice in the session, or when the user explicitly corrects you. First-occurrence slips are noise.
- Keep feedback memories to 3 lines: the rule, a one-line Why, and a one-line How to apply. Capture the pattern, not the recovery narrative.
- Before creating a new memory file, check for an existing one on the same topic. Update rather than duplicate.

## Scratch

- Write temporary files to `.claude/.tmp/<slug>/<file>.md` in the project root. Use a kebab-slug tied to the topic. Never use `/tmp` or a flat `<slug>-<file>.md`.

## Parallel sessions

- Independent feature tracks can run concurrently in git worktrees. See `wiki/claude-worktrees.md` for the fan-out rules and which domains are safe to parallelize vs which must serialize.
- Implementation work runs in a linked worktree. From the main worktree, enter one with `/claude-worktree` before editing tracked files for a feature.
- Shared session scratch (`.claude/plans/`, `.claude/review/`, `.claude/memory/`) lives at the main worktree root, not inside a linked worktree. From a linked worktree, resolve these paths against the main root via `git worktree list --porcelain | awk '/^worktree /{print $2; exit}'`. Fall back to `pwd` if not a git repo.
- From a linked worktree, every `Edit` or `Write` to a tracked file (source, docs, `TASKS.md`) must use a path starting with `pwd`. Only untracked scratch (`.claude/plans/`, `.claude/review/`, `.claude/memory/`) resolves to the main worktree root.

## Wiki

- Before answering a how-to question about toolkit tooling, workflows, or shell environment, scan `wiki/index.md` for a relevant page.
- Propose additions or corrections when you learn something not covered. Do not write to wiki files without confirmation.
- When writing or updating wiki pages about Claude Code, use the `claude-code-guide` agent to fetch current information from official docs rather than relying on training knowledge
- Wiki pages stay tool-general reference prose. Rewrite experiment narrative ("Against the X repo, tool Y read Z") into general statements ("Tool Y reads prose surfaces") before committing.
