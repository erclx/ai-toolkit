---
title: Versioning reference
description: Phase label vs semver discipline across tasks, PRs, reviews, issues, commits, and tags
---

# Versioning reference

Two namespaces, kept separate.

## Scope

Governs the two version namespaces, phase labels and semver tags, and which surfaces each may appear on. It is an attribute standard rather than a document-type one, so it applies wherever either namespace is written, and it carries no template because a label has no document to shape.

Does not govern:

- The format of a phase label, which is project-specific by the rule below
- Task filenames and board layout: `tasks.md`
- Commit subject, branch name, and pull request title format: `commit.md`, `branch.md`, and `pr.md`
- Voice and word choice in any text carrying a label: `prose.md`
- Punctuation and formatting in any text carrying a label: `markdown.md`

## Phase labels

Internal coordination vocabulary used in the task board and chat.

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
| `.claude/tasks/`          | yes          | no                                  |
| Chat with the operator    | yes          | no                                  |
| PR titles                 | no           | only when the PR cuts a release     |
| PR bodies                 | no           | only when the PR cuts a release     |
| Review comments           | no           | only when referencing a release     |
| Issue titles and bodies   | no           | only when referencing a release     |
| Commit messages           | no           | only when the commit cuts a release |
| Git tags                  | no           | yes                                 |
| README and `CHANGELOG.md` | no           | yes                                 |

## Rules

- PR titles describe the user-observable change in conventional-commit form. Do not prefix or suffix with phase labels.
- Commit subjects do not embed phase labels.
- Git tags use semver only. Phase labels never become tags.
- A PR that cuts a release may reference its semver tag in the title or body. Phase labels still do not appear.
- PR bodies, review comments, and issue text name the change itself, never the internal stream that scheduled it. Describe the work rather than the label it was planned under.

## Pre-publish check

Text bound for a remote is checked for phase labels against the finished draft, before it is sent. A body, comment, or title reaches a reader who has no task board, so a label that survives to publication cannot be resolved by anyone downstream.

The surface publishing the text is the last gate on it. Where no automated check covers that surface, the author performs the check as an explicit step rather than relying on having read this file while drafting.

## Why

Phase labels keep planning conversations efficient. They make `git log`, PR titles, and the tag list unreadable when they leak in. A future reader cannot reconstruct what an internal label meant without the matching task file, which is gitignored. Semver tags carry meaning independent of conversation state and survive in git history. Keeping the two namespaces apart preserves both.
