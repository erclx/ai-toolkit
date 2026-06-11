---
title: Versioning reference
description: Phase label vs semver discipline across TASKS, PRs, commits, and tags
---

# Versioning reference

Two namespaces, kept separate.

## Phase labels

Internal coordination vocabulary used in TASKS and chat.

- Format is project-specific.
- Used to order work and disambiguate streams during planning.
- Re-numbers freely as scope shifts. Inserting a half-step between two existing labels (a `v1.5` between `v1` and `v2`) is fine.
- Does not have to map to any external release.

## Semver tags

External release identity used in git tags and release notes. Independent of phase labels.

- Format is semver: `v<major>.<minor>.<patch>`.
- Tagged only when a real release is cut.
- Does not have to map to phase labels. A single semver tag may cover work that carried several internal phase labels.

## Where each appears

| Surface                   | Phase labels | Semver tags                         |
| ------------------------- | ------------ | ----------------------------------- |
| `.claude/TASKS.md`        | yes          | no                                  |
| Chat with the operator    | yes          | no                                  |
| PR titles                 | no           | only when the PR cuts a release     |
| Commit messages           | no           | only when the commit cuts a release |
| Git tags                  | no           | yes                                 |
| README and `CHANGELOG.md` | no           | yes                                 |

## Rules

- PR titles describe the user-observable change in conventional-commit form. Do not prefix or suffix with phase labels.
- Commit subjects do not embed phase labels.
- Git tags use semver only. Phase labels never become tags.
- A PR that cuts a release may reference its semver tag in the title or body. Phase labels still do not appear.

## Why

Phase labels keep planning conversations efficient. They make `git log`, PR titles, and the tag list unreadable when they leak in. A future reader cannot reconstruct what an internal label meant without the matching TASKS entry, which is gitignored. Semver tags carry meaning independent of conversation state and survive in git history. Keeping the two namespaces apart preserves both.
