---
title: Slug reference
description: Transform from a git branch name to a slug, and the three responses to an empty result
---

# Slug reference

## Scope

Governs the transform from a git branch name to the slug a surface carries in a derived name, and the responses available when the transform returns empty. It is an attribute standard rather than a document-type one, so it applies wherever a branch-derived name is produced, and it carries no template because a string has no document to shape.

Does not govern:

- The format of the branch name the transform reads: `branch.md`
- Where a surface writes what it names with the slug, and what goes in it, which is that surface's own subject

## The transform

Run `git branch --show-current`. Drop a leading segment naming one of the types `branch.md` defines when a further segment follows it, then replace every remaining `/` with `-`. The result is `<slug>`. Anything reading a branch-derived name uses this transform, so two surfaces cannot spell it differently.

The type comes off because a plan takes its slug from the concern it covers and the branch executing that plan carries the same slug behind a type prefix. Keeping the prefix sends every surface that finds a plan from a branch name looking for `feat-jwt-expiration`, which no plan is filed under. A first segment matching no type stays, so `spike/parser` still yields `spike-parser`.

A surface that persists output to a shared folder carries the slug in the filename, which is what keeps parallel worktrees from overwriting each other's output. Two branches differing only in type collapse onto one slug. That collision reaches the worktree directory as well, since it takes its name from the same string, so the branch is not where it would first surface.

## An empty result

The empty result is a detached HEAD, and the surface picks one of three responses rather than inheriting a default. State the choice where the transform is cited, since the transform is shared and this is not.

- Fall back to `latest`, so a read-only pass still writes somewhere predictable
- Stop, when the surface commits or opens a pull request. There is no branch to put the work on, so `latest` would bury the problem instead of reporting it. State the stop in the surface's guards.
- Fall through to the next source, when the slug is one candidate among several rather than the name of an output file
