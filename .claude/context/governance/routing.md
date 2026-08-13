---
title: Rule routing
description: The two-part test separating a rule from a skill, the standards each rule routes to, the surfaces reached without a glob, and the pair that reads as one
---

# Rule routing

A rule fires on a path match with no decision from the session and a skill fires on invocation or a description match, so the rule is the floor and the skill is the depth. `standards/rule.md` and `standards/skill.md` each carry the checkpoint pointing at the other, and both ship to targets. Nothing checks either one, which is accepted, since the checkpoint is a judgment prompt rather than an invariant.

## What crosses into a rule

The two-part test decides. Does the invariant fire when a specific path is edited, and does violating it ship silently? Run over the `## Gotchas` bullets, the six domain skill bodies, and `CLAUDE.md`'s behavior list, it promoted four rules and widened one, which is the filter working rather than failing. Most of the pool is orientation and fails the first half, and a second group fails the second half because `bun run check` already gates it.

A rejection is recorded by which half failed rather than by judgment. The init gate's asserted-path requirement fails the first half, since the trigger is adding a domain and no glob matches that. The husky re-drop on a monorepo subtree fails it for the same reason, firing when a command runs rather than when a path is edited. The stale-copy failure on a widened source rule fails the second half, since that gate is closed and loud.

One candidate passes both halves and is deferred. A child folder carrying no `index.md` drops out of every catalog silently, and closing it means widening `510-context`, which ships to every `base` consumer and would carry an invariant about a system a target may not run. It needs a shipped rule and a stack decision, which is the deferral `claude/skills/` already took.

## Rules that route to a standard

Every standard governing a file path carries a rule routing to it, so an edit loads the standard without the matching skill being invoked. The route is what makes a standard reachable from the action rather than from a session that thought to look.

`595-tooling-reference` is toolkit-local and is authored under `internal/rules/claude/`, because `internal/standards/tooling-reference.md` governs a surface a target never authors and shipping the route would point at a path no install creates. It sits in `internal/` rather than `governance/rules/` so location enforces the boundary, the same way the internal standards and snippets do. It globs `manifest.toml` alongside `reference.md`, because a rule protecting a symmetry has to fire from either side and the manifest is the side that moves first.

`510-context` carries a write-time policy alongside its read-time one, so editing a domain leaves its context entry conforming. It ships in `base.toml` to every consumer, so each write-time bullet states an outcome of the edit rather than a backlog to drain, which is the only phrasing that also reads correctly in a project with no entries yet.

`556-groundwork` and `557-intake` route the two track folders, added to `base` beside `555-tasks` so the three workflow surfaces sit on one roster. Both folders are gitignored and both were governed only by a `references/folder-format.md` inside their skill, which loads when the skill does and never when a promotion pass or a returning session opens the folder directly.

Each of those two carries the pair of directives that ship silently when violated, the answer contract for intake and the re-measure floor for groundwork, and points at its standard for the rest. What a rule cannot carry is the write scope, since a misrouted write lands on a path the glob never matches, so that floor stays in the skill body.

Fifteen of the seventeen claude rules now carry operative directives beside the pointer, since a rule arrives attached to the edit while a pointer reaches a session only if that session opens the file. Five bullets is the cap, matching the two largest of the seven that reached the shape on their own, and past it a rule reproduces the standard's structure rather than stating what must not go wrong. The standard keeps the full specification either way, so a drift is a rule falling behind rather than two files disagreeing, and nothing checks it.

`500-prose` and `501-markdown` are the two that stay pointer-only, permanently. The seeded audit hook parses the word bans out of `standards/prose.md`, so a rule restating that list is two sources for one list with a machine reading one of them. `.claude/ARCHITECTURE.md` carries the general form of that exemption, and `.claude/context/standards/scope.md` carries what it narrows on the standards side.

## Rules reached by something other than a glob

`standards/versioning.md` is deliberately unrouted. It governs commit subjects, PR titles and bodies, review comments, issues, and git tags, none of which are files, so a path-scoped rule has nothing to match and would never fire.

`git-commit` and `git-pr` reach that surface by instruction instead, and what catches a leak there is a check rather than a route. The check is `publish.md`, which reads the label rule from `versioning.md` beside it, so the six skills that publish to a remote inherit it from the citation they already carry.

`090-code-comments` owns the degradation term list rather than `src/comments/`, because `src/comments/vocabulary.ts` reads the terms out of whichever rule publishes a `## Degradation vocabulary` heading. Editing the backticked terms there changes what `aitk comments scan` sweeps for here and in every target on `base`. Discovery anchors on the heading rather than the filename, so a renumber cannot silently empty the list.

## Two always-loaded rules that read as one

`000-constitution.md` ranks native platform capabilities over third-party libraries, and `070-planning.md` says to search the project, its dependencies, and the standard library before writing new code. Both ship in `base`, both load on every session, and the pair scans as one instruction stated twice.

They govern different moments. The constitution ranks options a session is already choosing between, and the planning bullet fires before there are options, when the open question is whether the code already exists. A clause drawing that distinction inside either rule body was declined, since `standards/rule.md` bans reasoning in a rule, so the entry covering the rule tier carries it instead.

## Gotchas

- The degradation sweep matches on comment text, so a comment naming a term as an example reads as a hit. The matcher's own doc comment in `src/comments/scan.ts` is the standing case. Read a hit before treating it as a defect.
