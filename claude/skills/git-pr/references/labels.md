---
title: Label reference
description: Path-to-label map format, prefix matching against the changed set, and the one-time label creation a map requires
---

# Label reference

## Scope

Governs the labels a pull request carries: the map a project declares, how a changed path resolves to a label, and what a label missing from the remote costs.

Does not govern:

- Pull request title and body: `pr.md`
- Branch naming: `branch.md`
- Issue labels, which `git-issue` derives from the issue type rather than from a diff

## Map format

The map lives at `.claude/pr-labels.toml` in the project root. Each key under `[domains]` is a label name and its value is the list of path prefixes that earn it.

```toml
[domains]
api = ["services/api/"]
web = ["apps/web/", "packages/ui/"]
```

A label takes more than one prefix when two folders read as one surface. Two labels may claim overlapping prefixes, and a path under both earns both.

Matching is prefix-anchored, so a row written for an authoring root reaches nothing under the copy a project consumes. A surface living only under a dotted folder carries its own prefix on the row that owns its subject, and a folder holding several subjects rather than one splits across the rows that own them.

The map is authored by hand and nothing detects a directory it fails to cover, so a surface added after the map was written labels nothing until someone adds a row. A map that has been censused against its own history says in its comment where that check is owned, so a reader meeting the gap is sent somewhere rather than left with the prediction.

## Paths a map declines to label

A path that moves only when a release or a generator rewrites it earns no row. Release automation applies its own label, and a domain label on a generated file gives a mechanical edit a subject it does not have. Neither is covered, so both are recorded in the map's comment with the reason, which is what separates a path nobody has gotten to from one somebody decided against.

## Matching

- Take the changed set from `git diff --name-only <base> HEAD`, resolved against the same base as the diff the body is written from
- A path earns a label when the path starts with one of that label's prefixes
- Collect the distinct labels across the whole set, ordered as the map declares them, so two runs over one branch produce one string
- Pass the result as a single comma-separated value. An empty result runs no labelling step.

## Applying

Apply labels after the pull request resolves, never as a flag on the create. `gh pr create --label` fails whole on a label the remote does not carry, so a name the map got wrong opens no pull request at all and the run stops with the branch pushed and nothing to review. A `gh pr edit --add-label` against a pull request that already exists costs a warning instead, and it is one command across both the create and the edit path rather than two flags that have to stay in step.

Labelling runs whenever this skill runs and at no other time. Nothing else computes the set, so a push made any other way leaves the labels exactly as the last run left them. Any caller invoking this skill again reaches the step again, and it recomputes over the whole branch diff rather than over the new commits.

An ordinary branch therefore labels once, when the pull request opens. The return leg that answers a review hands its push to `git-followup`, which refreshes the body without invoking this skill, so the commits that answer a review reach no labelling step.

A follow-up push reaching a surface the earlier ones did not merges under-labelled, with nothing to report the miss. Keeping the step in one skill is worth that cost, since a review fix lands in the files the review named and rarely opens a surface the branch had not already touched.

`--add-label` adds and never removes. A label a person applied by hand is not this skill's to strip, and a re-run over a branch that has since dropped a surface keeps the label that surface earned.

## A label the remote does not carry

Warn and continue rather than creating it, naming the command in the warning:

```bash
gh label create <name> --description "<text>"
```

Creating a label writes to the repository settings from a run the user invoked to open a pull request, and a label created from a typo in the map is harder to notice than a warning is.

The refusal names the label it rejected and applies none of the set, so a warning that reaches nobody leaves the run reading exactly like one that labelled. Surface it beside the result line rather than letting the pull request URL stand alone.

## Release pull requests

Release automation opens its own pull requests without this skill and applies its own labels, so nothing here needs a skip condition for them.
