---
title: Distribution
description: The marketplace entry, the install-shape traps it avoids, and the release wiring for the plugin manifest
---

# Distribution

`.claude-plugin/marketplace.json` at the repository root holds one entry whose `source` is `./claude`. The marketplace root is the directory holding `.claude-plugin/`, and an entry's source resolves against that root rather than against the manifest file. Adding the marketplace and installing the one plugin is the whole install path. The `--plugin-dir` alias survives as the development path, where a local edit overrides the installed copy for that session.

Sourcing the repository root instead is the trap this shape exists to avoid, and it was measured rather than reasoned about. Skills are discovered only at `<plugin-root>/skills/` and this repository keeps them a level down, so a root-sourced entry exposes zero skills. It also costs 312M, because Claude Code runs a dependency install on any plugin carrying a package manifest and copies `.claude/` and the internal skills into the cache. The closest comparable project sources its root, which works only because its skills sit there.

`claude/standards` and `claude/snippets` are symlinks to the root authoring sources. A symlink inside a plugin that resolves elsewhere within the marketplace is dereferenced at install and its content copied, so the files arrive as real directories in the cache. The measured install is 964K with 55 skills, against 760K for the same shape without the symlinks.

The entry carries no version on purpose. `plugin.json` overrides the enclosing entry for both name and version, so a version on the entry would drift on every release with nothing reporting it, and the release config writes only the plugin manifest.

The check pipeline does not follow the two symlinks. The index walker's glob, the spell checker, and the formatter were each tested against a symlinked directory in isolation, so `standards/` is not double-walked and the links produce no drift failures.

## Distribution gotchas

Validation proves the manifest parses and nothing about whether it works. `claude plugin validate --strict` passes a manifest whose `source` points at a directory that does not exist, so it would have accepted the zero-skill root-sourced shape. An install is the only check that proves a shape, which is why `bun run check` covering this file does not retire the manual install.

### Reaching a standard

Delivering a standard and reaching it are separate problems. The shipped skills cite `.claude/standards/X.md`, which resolves against the target project, so in a project with no standards installed a skill once resolved the citation to the project root, found nothing, and never looked in its own plugin root. The cache copies were inert until a skill was told to fall back to them. Each citing body now names `${CLAUDE_SKILL_DIR}/../../standards/X.md` as the fallback, which lands on the dereferenced symlink beside `skills/`. The project copy is still tried first, so a target that installed standards and edited them keeps its override.

The fallback conditions on the file, never on the `.claude/standards/` directory. `aitk standards sync` updates only filenames it already finds and never adds one, so a project that installed before a standard existed keeps the directory and never receives that file. A directory test passes there while the file is missing, which is the partial install the fallback exists to cover rather than an edge case. `git-commit` citing `versioning.md` is the concrete shape.

Only `${CLAUDE_SKILL_DIR}` survives to the model. Measured across three probe skills in a project with no `.claude/`, the body arrived with that variable already expanded to an absolute path, while `${CLAUDE_PLUGIN_ROOT}` reached the model as a literal string and a bare `../../` arrived unresolved. The latter two happened to work because the model inferred a base, which is the inference `standards/skill.md` bans a bare relative path to avoid. A guard on a standard's presence has to test both paths, since one testing only `.claude/standards/` refuses to run in a plugin-only project that has the file. `create-skill` and `claude-standards-audit` each carried such a guard.

### The first executable in a skill

`claude-orchestrate/references/poll.sh` is the only non-markdown file any skill ships, so a plugin that carried prose alone now carries code a target runs. Two stages had to reach it: `check:shell` globs `claude` alongside `scripts`, `tooling`, and `.claude/hooks`, and the boundary walk already covered it because that walk reads every file rather than every markdown file.

A shipped script is not a shipped standard. It executes in a target's environment rather than being read there, so it takes its dependencies from that machine and its base branch from `origin/HEAD` rather than assuming `main`. A second script inherits the shellcheck coverage without a further edit, and inherits the obligation to assume nothing about the repository it lands in.

### What a symlink costs

A symlink is an entry point that cannot filter. `standards/aitk/` and `snippets/aitk/` were excluded at every CLI verb and still reached every plugin cache, because an installer dereferences the two symlinks and copies whatever is behind them with no code in the path. The count reached five before the fix and grew on its own, since `snippets/aitk/` was where internal snippets were authored. Internal content now lives at `internal/`, which nothing under `claude/` reaches, and the filters that guarded the old category are deleted. `scripts/core/check-plugin-boundary.sh` walks the plugin tree with symlinks followed and fails on any file resolving under `internal/`, so what the filters asserted is now measured against what an install actually copies.

A native Windows checkout without symlink support materializes both links as plain text files holding the paths `../standards` and `../snippets`. The plugin then ships two junk files and no standards, and no stage notices, because every catalog command reads the real directories at the repository root. `.claude/context/sandbox/overview.md` treats Windows as a supported development environment, so this is a limitation to state rather than a case the pipeline can catch.

A marketplace name is one global slot per user. Adding a second marketplace under the same name replaces the first, and a local-path marketplace pointing at a worktree breaks when that worktree is removed.

## Release

`plugin.json` carries `author`, `homepage`, `repository`, `license`, and `keywords` alongside the three fields it started with. None of them change how the plugin loads. They exist because `claude plugin validate --strict` treats missing attribution as a failure, and because a manifest reaching an installer is the first thing a stranger reads about the project.

Its `version` is written by `release-please` through the `extra-files` wiring in `release-please-config.json`, never by hand. The manifest overrides the enclosing marketplace entry for both name and version, so a shape declared at one version installs at another when the two disagree, and `claude plugin tag` refuses to tag in that state. Parity that depends on someone remembering breaks on the first release nobody is watching, which is why the tool owns the field rather than a convention. The mechanics of the release itself live in `ci.md`.

Owning the field means owning the file's serialization. `release-please` rewrites the whole manifest on each bump and expands `keywords` to one string per line, while prettier collapses any array that fits the print width, so the two disagree at every release rather than once. `.prettierignore` excludes `**/.claude-plugin/*.json` to settle it, which leaves the release tool as the only formatter of the manifests it writes. The `**/` prefix is load-bearing, since a pattern carrying an interior slash anchors to the ignore file's directory and `.claude-plugin/*.json` would match nothing under `claude/`. `claude plugin validate --strict` still gates the schema, though that stage is author-side only, so CI checks neither the format nor the schema of these files.

The class pattern overreaches by one file, so a `!.claude-plugin/marketplace.json` negation follows it. The exclusion earns its place for a file a release tool rewrites, and the marketplace entry is hand-authored, carries no version, and is written by nothing. Without the negation it would sit outside the formatter and outside CI at once, since the validation stage runs author-side only. The negation has to come after the pattern it undoes, because the last matching line wins.

Version parity stays a two-file problem now that the marketplace entry exists. `package.json` and `plugin.json` are wired through `release-please`, and the entry carries no version to disagree with them. The validation stage in `bun run check` discovers manifests rather than naming them, so it picked up `marketplace.json` the day it landed.
