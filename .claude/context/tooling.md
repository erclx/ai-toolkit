---
title: Tooling
description: Stacks, configs, seeds, references, manifests
---

# Tooling system

## Overview

Owns the golden configs a project inherits, layered across a `base` to `web` to framework chain where each layer ships only its own slice. A stack is a folder holding configs, seeds, a manifest, and a reference. Sync auto-discovers new stacks, so adding one requires no infrastructure change.

## Layout

- `tooling/<stack>/` owns one stack, always with a `manifest.toml` and a `reference.md`
- `tooling/<stack>/configs/` owns golden files that always overwrite on sync
- `tooling/<stack>/seeds/` owns user-owned files that sync preserves
- `tooling/claude/` owns storage for `aitk claude`, excluded from stack discovery
- `src/tooling/` owns the manifest walk, scan, injection engine, and the reference resolver, in TypeScript
- `scripts/tooling/` owns the create and verify subcommands, still bash

| Stack        | Extends | Ships                                                                   |
| ------------ | ------- | ----------------------------------------------------------------------- |
| `base`       | -       | Universal: prettier, cspell, commitlint, husky, shell                   |
| `web`        | base    | Web-universal: ESLint, Vitest, Playwright, Tailwind, CI, screenshots    |
| `vite-react` | web     | Framework glue: vite.config, vitest.config, playwright.config, tsconfig |
| `astro`      | web     | Framework glue: astro.config, getViteConfig vitest, astro-aware eslint  |
| `python`     | base    | `uv` runtime plus ruff, mypy, pytest, and coverage sidecars             |

## Decisions

- Configs overwrite and seeds are preserved. The boundary is structural versus user-extensible: linters and formatters with no project-specific surface ship as configs, while files projects routinely extend (`cspell.json`, `.lintstagedrc`) ship as seeds.
- An overwrite needs authority a caller states. `runSync` resolves a write mode through `resolveWriteMode` in `src/commands/tooling.ts`, where `--check` reports, `--write` applies, a TTY prompts, and a headless caller with neither flag reports and exits 1. The install stamp follows the same authority, so a run with none leaves `.claude/aitk/config.json` alone rather than recording a sync it never performed. A confirm prompt carrying `nonInteractiveDefault` reads silence as consent, which is what made `AITK_NON_INTERACTIVE=1` mean apply-all and cost a real target its deploy job and a shipped harness.
- The overwrite contract names every config path rather than the category. `scripts/core/regen-tooling-paths.sh` writes the block in `claude/skills/toolkit-cli/SKILL.md` from `aitk tooling list --json` crossed with each stack's `configs/`, and `bun run check` asserts it against the tree. Reading the list from the verb rather than from a directory walk keeps an excluded stack out of a contract about what that verb does.
- Stack-specific configs override the extends chain. `scan` in `src/tooling/scan.ts` walks the current stack first, and a file seen there blocks the same relative path from every parent layer.
- Which stack wins a duplicate differs by category, and the split is inherited rather than designed. Configs, seeds, and scripts resolve nearest stack first. Dependencies and gitignore entries resolve from the furthest ancestor inward. The TypeScript port preserved both directions rather than unifying them, because unifying would silently change what a target receives.
- `sync` dropped the `Review diffs` prompt branch. It was the only path that shelled out to `code --diff`, which is the behavior an earlier fix removed for headless callers, so rebuilding it would reintroduce the defect the migration exists to remove. Compare with git after syncing instead.
- Injection is reachable as `aitk tooling inject <stack>` so `aitk claude` and the sandbox can apply one stack without the scan and prompt. The excluded-stack guard sits on `sync` rather than in the shared path, which is what lets `aitk claude` drive the `claude` stack through it.
- `python` extends `base` directly rather than going through `web`. It runs on `uv` instead of `bun`, so the web layer's assumptions do not apply.
- Dictionary seeds merge rather than copy-once. `.cspell/*.txt` accumulates project terms over time, so sync appends new entries and sorts. Every other seed type copies once and is then left alone.
- Gitignore merging is additive only and existing entries are never touched, so a project can reorder or annotate its own ignores without sync fighting it.
- Scripts are never overwritten except through `[scripts.override]`, which exists for three cases: scaffolds that ship an anti-pattern by default, toolkit-owned wrappers whose body must stay in lockstep with the shipped shell scripts, and a key whose value the stack owns where the scaffold writes its own. `dev` and `preview` are the third case, since both scaffolds define them and a plain `[scripts]` entry never replaces a defined key.
- A served port derives from the working directory rather than from a literal. `scripts/worktree-port.sh` in the web layer prints a base plus an offset hashed from the worktree folder name into a band of 50, each server-starting script exports it, and every config adds it to the stack default. A claim file was the alternative and needs a lock. `strictPort` and Playwright's `reuseExistingServer: false` are what make a collision fail loudly, since a suite reusing whatever answers on the port reports a pass against another branch.
- A folder left under `.claude/worktrees/` after its worktree was removed is refused rather than served, closed against the one installed target on this stack, where two such folders derived the main checkout's port on all three bases. Git reports the parent repository from inside one, so the test separating a linked worktree from the main checkout passes it, and the collision arrives with no signal at all where the deliberate one arrives through `strictPort`. Location is what separates a leftover from an ordinary subdirectory, since neither is a registered worktree and the base port is correct for the subdirectory. Handing a leftover the same name-derived offset the registered worktrees take was the alternative, and it moves which port collides rather than reporting anything, on top of reintroducing the two-name collision the band of 50 already carries.
- The two shapes reach the base port through different branches. A folder whose own `.git` was deleted sends git upward and lands in the main-checkout test, and a folder whose `.git` names a pruned administrative directory makes git refuse outright and lands in the fallback that answers 0 for a plain directory. A fix keyed on either alone reaches one of them, so the second walks up from the working directory for a `.git` file naming a target that is gone.
- Every manifest call site grew a `&& export VAR &&` guard in the same change, because the refusal reaches nothing without it. The shipped form was `VAR=$(bash scripts/worktree-port.sh) <server>`, and an assignment prefix discards the exit status of its own substitution, so a refusing helper started the server with `VAR` empty and every config read that back as an offset of zero, which is the main checkout's port. Measured 2026-08-19 under `bun run` against all three forms: the prefix served 4321 and exited 0, and both guards refused and exited 1. The bare assignment carries the status where the prefix drops it, so the guard reads it and the export puts the value back in the environment the server inherits. Guarding with a throwaway first call was the alternative and it invokes the helper twice for the same answer.
- Targets already carrying the old copy keep the defect, recorded rather than chased. A seed is a file a project owns once installed, `aitk tooling sync web . --write` replaces it, and nothing reports the drift until that runs. The accepted cost is an unsynced target serving the wrong port silently.
- The capture seed writes a folder per section holding one file per theme, replacing a flat `<name>-<state>.png` it shipped before. Measured at `d2c0281c`, the one target that adopted the seed had already converged on section folders split by theme, so the flat layout was abandoned where it was used and lived on only where nobody ran it. A route's themes now sit together, which is what makes the filename's embedded state suffix unnecessary. The two `ROUTES` and `STATES` consts collapse into one `CASES` record where each entry is one output file, since the second axis was what forced the suffix.
- The seed ships no run-mode set. The one target that grew this seed carries four modes and they encode its deployment shape, which is the part that does not travel, so a mode set risks teaching a convention the next target abandons the way this one abandoned the flat layout. The seed ships the output path and the case record and says nothing about modes, leaving the choice per project.
- Server readiness stays in `scripts/screenshot.sh` rather than moving into the seed. The wrapper already builds, starts the preview, polls it for ten seconds, and refuses a port already in use, so lifting it into TypeScript rewrites working shell to satisfy the wording of an intake item rather than a defect.
- The capture folder is gitignored and per-worktree. A linked worktree is its own directory, so the folder partitions by branch for free, unlike the review folder every skill writes to, which resolves against the main root and always overwrites. What that costs is a capture no reviewer sees, so a capture worth sharing is attached to the pull request by hand.
- `governance/rules/ui/440-surface-capture.md` fires on route and page files rather than on every component file. Every firing then names a route the capture can address, which the wide reading cannot promise. The accepted cost is a shared component changing every screen and firing nothing. Wide globs with the discrimination moved into the rule body was the rejected alternative, since it keeps the folder's glob precedent but asks a reader to judge rendered output on every match. The four sibling rules in that folder scope by file extension alone, so this one is the first there to key on a path.
- References shrank to anti-patterns and opinions once golden configs landed. The config is the source, the reference carries only what a config cannot express.
- Stacks do not compose horizontally. Single-root polyglot is unsupported, and a monorepo uses the subfolder pattern instead.
- `tooling/claude/` is storage, not a stack. It holds seeds, user-level config, and a minimal manifest consumed only by the `aitk claude` CLI, so `TOOLING_STACK_EXCLUDE` keeps it out of discovery.
- The non-goal against shipping application code turns on the word application, and its own carve-out in `.claude/REQUIREMENTS.md` already reads configs, seeds, snippets, and rules
- Test files, an e2e spec, the screenshot template, and six shell scripts land executable non-config source in a target, and `injectManifest` in `src/tooling/inject.ts` runs `bun add -D` against it, so the line reads as a hard stop on a stack that installs an entry point and is not one
- A whole-stack install records the chain it resolved into `.claude/aitk/config.json` through `recordToolingChain` in `src/tooling/stamp.ts`, which is what makes tooling drift measurable in `aitk sync --check`. The write lands after the copies, so a partial apply that throws leaves the previous record rather than a claim the target does not meet.
- Rationale and the workspace-root refusal sit in `.claude/context/cli/sync.md`

## Gotchas

- Commit golden config changes with `--no-verify`. Lint-staged runs against the template files themselves, not project source.
- `aitk capture` and `bun run screenshot` both produce PNGs and overlap nowhere else. `src/capture/render.ts` drives Chromium over static HTML files and never a running app, and `files` in `package.json` excludes `src/capture` so an installed `aitk` refuses the command.
- `bun run screenshot` is a web-stack config a target owns, and it builds that target, serves it, and captures the running application

### Manifest syntax

- The syntax invariants and the manifest-to-reference symmetry moved to `internal/rules/claude/595-tooling-reference.md`, which globs `tooling/*/manifest.toml` alongside `tooling/*/reference.md` so an edit to either side loads both. `internal/standards/tooling-reference.md` carries the symmetry in prose.
- A manifest edit shipping a stale reference is what widened that glob. The rule matched the reference alone, and the manifest is the side that moves first
- `runtime` is reserved and read by nothing today. `scaffold` is read only by `scripts/sandbox/tooling/upstream.sh`, not yet by `aitk tooling sync`.
- Bun's script shell expands command substitution and a leading environment assignment, so a script value may carry `VAR=$(bash scripts/x.sh) command`. Verified 2026-08-13 against `bun run`.
- This repository's own `.gitignore` splits its Claude entries across two headers, with `.claude/teach/` under `# Teaching workspace` rather than under `# Claude`. Diffing the manifest group against the first header alone therefore reads one entry short, so `scripts/core/check-ignore-parity.sh` compares against every `.claude/` line in the file, with the trailing slash dropped so `.claude/.tmp` and `.claude/.tmp/` read as one path. It gates `bun run check` rather than reporting, because the manifest reaches every target on the next `aitk tooling sync` and a drift between the two lists surfaces to nobody. The gap it was written against was `.claude/proposals/`, ignored here and missing from the manifest, found by a person reading a merged pull request rather than by any check.
- Two divergences stay, `.claude/README.md` and `.claude/diagrams/`, each with its reason beside it in the check's own `SANCTIONED` list and printed on the run that passes. The diagrams answer follows the decision that kept `diagrams` in `DEFAULT_FOLDERS` in `src/context/folders.ts`: removing it there would take the audit default from every target that does track its diagrams, and ignoring the folder for every target reaches the same population from the other side. `BACKED_FOLDERS` in `src/records/backup.ts` names `diagrams` regardless, so a target's own `aitk records push` carries the folder whether or not that target ignores it, an asymmetry recorded rather than resolved. A sanction naming a path that is no longer divergent fails the same as an unsanctioned one, so an exception cannot outlive its reason.
- The comparison reads a closed set in both directions and is blind to a folder a shipped command creates that neither file names, since the baseline it reads is the closed set rather than the created one. Catching that second class means walking the commands for what they write under `.claude/`. A folder whose contents are committed on purpose belongs in neither file, which is why `.claude/audits/` is absent from both and correct.

### Sync and layering

- Syncing a monorepo subtree without `--skip base` re-drops husky per subtree. Git honors only one `core.hooksPath`, so the extra hook dirs silently break.
- `--skip base` relies on the layer boundary holding: repo-root-once configs live in `base`, per-root configs live in `web` and the adapters. Moving a per-root config into `base` would break the split.
- Non-`.txt` seeds are copy-once. To re-seed a structured file, delete it and sync again.
- Preserving a destination's mode moved to `internal/rules/core/096-operator-files.md`. `tooling/web/configs/scripts/verify.sh` is 644 while base ships 755, so a copy applying the source mode would strip the executable bit on the `web` and `astro` chains.
- `copyPreservingMode` in `src/copy.ts` is the implementation, sitting at the top level rather than in `src/tooling/` because the sync engine needs the same guarantee
- `Bun.Glob` skips dotfiles unless `dot: true` is set. Tooling configs are almost entirely dotfiles, so omitting it matches 4 of 14 files in `base` and fails silently.

### Seed ownership

- The base stack owns `.claude/context/index.md` and the claude tree ships none, though it seeds three sibling indexes. Base owns it because it seeds the entries listed, and two trees writing one target path let install order pick the content, since neither installer overwrites a file the target has. Without one the tree is not auditable, since `resolveFolders` skips a folder lacking it.
- Per-stack `ci.md` and `development.md` seeds are not shipped, because seeds are user-owned and never overwritten. Stack references carry `## CI docs (extend)` sections telling the agent which rows to append instead.

`planSeeds` in `src/claude/seeds.ts` iterates a literal `SUBDIRS` array rather than listing the tree, so a folder added under `tooling/claude/seeds/.claude/` is invisible to `aitk init` while the sandbox still shows it, because `inject_seeds` in `scripts/manage-sandbox.sh` does a plain `cp -r` of the whole tree. The two paths disagree and the sandbox is the one that looks right. Pair every seed-folder addition with the `SUBDIRS` entry, an assertion in `scripts/core/install-check.sh`, and a run of `aitk claude init` into an empty repo. The array order is also the install and timeline order, which `src/claude/seeds-list.test.ts` asserts against.

Two seed sources can write one destination, and nothing reports the collision. A development-entry seed was added to the Claude domain while `tooling/base/seeds/.claude/context/` had shipped a filled version of the same file all along. `aitk init` runs base tooling before the Claude domain and `pendingSeeds` skips any destination that exists, so the new seed was inert on the normal path and would only have landed, empty, on a bare `aitk claude init`. Grep `tooling/*/seeds/.claude/` for the same destination path before adding a file, since the resolution is by domain order in `src/commands/init.ts` rather than by intent.

### The seed gate

- The seed tree is held to the standards it seeds by a `check` stage, not by a rule path. Widening the `paths` globs on the claude rules was the alternative and it fires only when a session happens to edit a seed, which leaves a seed nobody touches wrong indefinitely.
- `verify.sh` runs `context audit <root> --gate` against each `tooling/<stack>/seeds/` carrying a `.claude/`, discovered per run rather than listed, so a new stack is covered without a script edit
- The seed gate reaches only what the index-plus-entry contract covers, which today is `tooling/base/seeds/.claude/context/`. The claude tree seeds four folders holding an `index.md` and no entries, so the gate measures their indexes and nothing else, and `ARCHITECTURE.md`, `DESIGN.md`, and `REQUIREMENTS.md` sit under no audited folder and stay out.
- Reaching those three needs an audit keyed to a document standard rather than a folder, which no command has
- A seed exempts itself from the section check with `stub: true` in its frontmatter, and both install paths strip the field so no target receives it. The exemption exists because the section check carries a false-positive class its own comment in `src/context/audit.ts` records: a standard may sanction omitting a section, and no measure separates that from a file that forgot it.
- Reporting is the right answer where the finding is advisory, and the seed gate makes it fail, so the tree needs a way to say an omission is deliberate
- No seed sets the marker today. Every skeletal seed is skeletal in its body and still declares each section its standard requires, which is what the gate measures. Marking one that already passes would switch off a live check for nothing, so the field stays unset until a seed genuinely has to omit a section.
- Stripping is duplicated across two install paths because the seed trees are, `injectSeeds` in `src/tooling/inject.ts` for the stacks and `applySeeds` in `src/claude/seeds.ts` for the claude tree. Both narrow to `.md`, so hook scripts and `settings.json` still copy byte for byte, and `src/seed-marker.ts` holds the one reader and the one stripper they share.

The citation gate resolves every context-entry path string against this repository's root, including lines instructing a target project about its own tree, so those pass only while the toolkit's layout matches the layout it seeds. Splitting the development entry into a folder put ten of its fifteen citation sites into that state in one commit, across `claude/skills/project-commands/SKILL.md`, the four `tooling/*/reference.md` files, `tooling/claude/seeds/CLAUDE.md`, and `docs/target-projects.md`, and retargeting them would have shipped a path resolving nowhere into every scaffolded project, since `tooling/base/seeds/` seeds a flat file. Classify every citation site by whose tree it names rather than by its path before splitting a seeded domain. Keep the flat spelling on a target-facing line and suppress it with `<!-- audit-ignore-citations -->`, or reword to drop the path where a marker would ship into a file a target reads daily. The CI entry is the next one sitting in this position.

### Seed independence

- `tooling/*/seeds/**/*.md` prose may not name the toolkit CLI token literally, not even in a line explaining what an installed rule's own command citation refers to. `scripts/core/check-seed-independence.sh` greps every seed markdown file for the string and fails the push on a hit, since a scaffolded project may not have the CLI installed. A line explaining a cited command names the capability instead, a toolkit CLI with its own commands, present only where installed.

## Manifest authoring

Each stack has a `manifest.toml` that controls what sync does. `[stack]` is the only required block.

```toml
[stack]
name = "stack-name"     # must match the folder name under tooling/
extends = "parent"      # parent stack to inherit from, empty string if none
runtime = "runtime-name"      # reserved: package manager for this stack (not active yet)
scaffold = "scaffold-command"  # bootstrap command, read today by sandbox/tooling/upstream.sh
```

```toml
[dependencies.dev]
packages = []

[scripts]
"script-key" = "command --flag"

[gitignore]
"# group-label" = ["pattern/", ".file"]
```

`[dependencies.dev]` injects into `devDependencies`, adding only missing packages. `[scripts]` injects into the `scripts` block, adding only missing keys. `[gitignore]` appends each group as a comment header plus one line per path. Group keys use single-word labels (`# VSCode`, `# Python`) so headers stay stable across renames.

`mergeSections` in `src/tooling/gitignore.ts` writes that header only when the whole group is missing from the target. A group the target already carries takes its new entries bare at the end of the file, so an entry added to a shipped group does reach an already-scaffolded project on the next sync, sitting detached from the header it belongs under. Presence is re-tested against the growing file and ignores a trailing slash, so `.claude/.tmp` and `.claude/.tmp/` count as one entry.

```toml
[verify]
prepare = "command to run after scaffold, before sync"
```

`[verify] prepare` declares a post-scaffold, pre-sync setup command for `aitk tooling verify`. Use it for integrations that cannot ship as golden configs, such as astro's `bunx astro add react --yes`. Optional.

## CLI

| Command                  | What it does                                                    |
| ------------------------ | --------------------------------------------------------------- |
| `aitk init`              | Bootstrap a project with base tooling and toolkit domains       |
| `aitk tooling`           | Full sync: configs, seeds, deps, and gitignore entries          |
| `aitk tooling reference` | Print a stack's reference doc. Reads, never writes.             |
| `aitk tooling create`    | Create a new stack folder with stub manifest and reference      |
| `aitk tooling list`      | Emit catalog of stacks with extends chain and dep summary       |
| `aitk tooling verify`    | Scaffold into a temp dir, sync, then run the full project check |

Flags and arguments live in `docs/agents/index.md`.

Every stack-name lookup in `src/commands/tooling.ts` (`prepare`, `promptForStack`, `printReference`) resolves against `PROJECT_ROOT`, never the caller's working directory, because a stack is toolkit-authored and a target project never carries its own `tooling/` folder. `listStacks` called against a non-`PROJECT_ROOT` root returns an empty list from any real target rather than falling back.

## Common workflows

Bootstrap a new project with `aitk init`, which installs base configs, Claude workflow, and governance in one command, and scaffolds an empty `.claude/wiki/`. Governance installs the `base` stack when `--stack` is absent, and `--skip governance` is the way to decline it. Neither standards nor snippets installs into a project, so neither carries a flag. The `setup-init` skill resolves the flags from project detection and runs the chain in one shot.

Sync tooling with `aitk tooling` and pick stack and path. Pass `--skip <stack>` to drop a layer from the resolved chain. A stack's reference doc reads through `aitk tooling reference <stack>` and takes no part in sync.

Set up a multi-language monorepo by letting the repo root own the `base` layer and giving each language its own subfolder:

```bash
aitk init                                              # base at the root
aitk tooling sync vite-react ./frontend --skip base --write
aitk tooling sync python ./backend --skip base --write
```

`--skip <stack>` removes the named layer and its parents across configs, seeds, deps, scripts, and gitignore. Each subtree still gets its own language configs, and its own stack reference reads through `aitk tooling reference <stack>`.

## Testing

`aitk tooling verify <stack>` is the end-to-end validator. It scaffolds fresh into `.claude/.tmp/verify-<stack>/`, runs the optional `[verify] prepare` hook, invokes `aitk tooling sync <stack> . --write`, then executes `bun run lint:fix`, `bun run check`, `bun run test:e2e`, and `bun run screenshot`, asserts screenshot artifacts, and reports a pass/fail matrix. The tmp dir auto-removes on success. Use `--keep` to inspect a green run, or rely on the auto-preserve on failure.

Run it after any change to `tooling/<stack>/configs/`, a manifest, or the sync logic in `src/tooling/`.

The stack it names has to be one that scaffolds. `aitk tooling verify web` refuses with `Stack 'web' has no scaffold command in manifest.`, because the web layer is a shared parent rather than a stack that scaffolds, so a change to `tooling/web/configs/` is validated through its two consumers, `vite-react` and `astro`, rather than through the layer that owns the edited file. The instruction above names the folder edited and not the stack that can run, which is the gap a session editing a parent layer falls into. Measured 2026-08-14.

The validator cannot reach its `test:e2e` and `screenshot` phases while the scaffolded project's dictionary fails. Measured 2026-08-13 on `vite-react`: `check` exits on unknown words in `.husky/post-merge`, `.lintstagedrc`, and `README.md`, all seeded rather than authored by the stack under test, so a config change reaches no end-to-end run until those words land in a dictionary. `.claude/tooling/base.md` no longer joins that list, since sync stopped dropping it.

Unit tests cover the manifest walk, the gitignore transforms, the package.json comparisons, and the scan. Equivalence against the bash this replaced was established by syncing every stack into paired fixtures and diffing contents and file modes, which is the check to repeat when changing injection order or copy semantics.

## Adding a new stack

1. Run `aitk tooling create` to generate the stub structure
2. Fill in `manifest.toml` with `extends`, deps, scripts, and optionally `[gitignore]` or `[verify]`
3. Fill in `reference.md` with prose documentation
4. Add golden configs to `configs/` for anything that ships as source of truth
5. Add seed files to `seeds/` for user-owned files that accumulate over time
6. Run `aitk tooling verify <name>` to validate end-to-end

Sync auto-discovers the new stack.
