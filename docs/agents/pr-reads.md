---
title: Head-sensitive pull request reads
description: Resolving a branch tip from the remote rather than from the pull request object, reading check runs keyed on that tip, why an empty run list is not a pass, the refusal reasons each verb names, and what the remote read costs
---

# Head-sensitive pull request reads

`canon pr head` and `canon pr checks` answer about a commit. Both resolve the branch tip from the remote with `git ls-remote` and report what they found for that sha, rather than taking the pull request object's word for which commit the branch is on.

```bash
canon pr head
canon pr head 1341 --json
canon pr checks
canon pr checks 1341 --json
```

## The pull request object is not the authority for a head

`gh pr view --json headRefOid` reads a field on the pull request object. That object trails the branch ref by up to a minute after a push and carries nothing saying how far behind it is, so a session that keys a read on it is describing whichever commit GitHub last folded into the object.

Two failures on 2026-09-01 came off that one field. A reviewing session posted a `should-fix` on `#1341` calling a pushed commit unpushed. A worker on `#1340` fired a green claim and retracted it on the thread. Neither session did anything wrong with the value it was handed. The value was stale and said so nowhere.

The remote ref carries no such lag. `git ls-remote --heads origin <branch>` asks the remote itself rather than a tracking ref, which is only as current as the last fetch, and the push worth catching is the one this process never saw.

The argument is stated here once. The shipped skill bodies call the verb rather than repeating it, because a sentence telling a session to compare two shas is a sentence a session can decide it already followed.

## What each verb answers

`canon pr head` reports `fresh` when the object and the remote name the same commit and `stale` when they disagree, with both shas on the record. The tip is the authority and the object's head is the claim being checked against it.

`canon pr checks` reads `repos/{owner}/{repo}/commits/<tip>/check-runs` and collapses it to `passing`, `failing`, or `pending`. A failure outranks a run still going, since a run in flight cannot clear a job that already failed.

`gh pr checks` cannot be made to answer this question at all, which is the argument for the move rather than a preference between two working commands. Its `--json` field set is `bucket, completedAt, description, event, link, name, startedAt, state, workflow`, with no sha among them, so a caller cannot even learn which commit its answer describes.

## An empty run list is not a pass

Keying the query on a sha is necessary and not sufficient. The endpoint answered with `total_count` 2 and an empty row list during a measured window on 2026-09-02, so a reader that finds no run for the tip and reports `passing` reproduces the false green behind a better query.

Both empty cases report `pending` instead: a tip carrying no run yet, and a listing whose rows all belong to some other commit. The record separates them, since `matched` counts the runs belonging to the tip and `foreign` counts the rest, and a caller that wants to tell "not started" from "still going" reads those two numbers rather than the state alone.

`matched` counts runs and not distinct checks, which is where it parts company with the list `gh pr checks` prints. A workflow that fires twice on one commit lands two runs under one name, so a pull request whose body was edited after the push reads 3 against that command's 2. Measured on this repository at `bae5194c` on 2026-09-02, where the phase-label workflow ran on the push and again on the edit. Read a `matched` above the check count as that, rather than as the verb disagreeing with the command.

A listing carrying even one foreign run reports `pending` whatever the matching half says. A set that describes another commit says nothing about this one, so answering off the rows that happen to match would put a verdict on a set already known to be incomplete.

A count above the rows returned reports `pending` for the same reason. The query asks for 100 rows against the endpoint's default of 30, and a commit carrying more than that comes back short, so the verb reports the tip as unread rather than collapsing the page it happens to hold. `reported` against `matched` and `foreign` is where a reader sees which of the three shapes produced the answer.

## Reading the answer

Branch on the record rather than on the exit. Both verbs exit 0 whenever they resolved a tip, whatever the verdict, and 1 only when they refused. An operator shell profile can wrap `canon` in a function whose status comes from a trailing command, which flattens every non-zero exit to 0, so the exit is not a channel either verb puts a verdict on. `gh pr checks` reserving exit 8 for pending is the pattern being replaced rather than one to copy.

Each refusal names a different repair:

| Reason             | What it means                                                                              |
| ------------------ | ------------------------------------------------------------------------------------------ |
| `gh-missing`       | `gh` is not on the path, so no pull request resolved                                       |
| `gh-failed`        | `gh` could not answer for this branch, so name a number instead                            |
| `no-branch`        | The pull request carries no head branch name, so no ref could be read                      |
| `unresolvable-ref` | The remote read failed, which is not the same answer as an absent branch                   |
| `no-remote-branch` | The remote carries no branch by that name, so there is no tip to compare against           |
| `no-object-head`   | The pull request object reported no head, so `head` has nothing to compare the tip against |
| `runs-unreadable`  | The check runs for the tip could not be read, which is unread rather than none             |

A failed remote read and a branch the remote does not carry stay apart rather than collapsing into one reason. Reading the first as the second would report a network refusal as a deleted branch, and the repairs have nothing in common.

## What it costs

One remote round trip per call, sampled here at 0.41s, 0.55s, and 0.67s on 2026-09-01 and 2026-09-02, against 0.001s for the local ref read. The spread is the network rather than the command, so read it as roughly half a second and not as a figure to compare a later reading against. Every caller pointed at these verbs already spends a `gh` round trip on the same line, so the added cost lands on a path that was never local to begin with.

One head-sensitive read is left on the object deliberately. `canon targets pulls` reads `statusCheckRollup` for every open pull request across every target, where resolving a tip per row would cost one remote read per pull request across a dozen projects, against a surface that reports a listing rather than gating a push.

The orchestrator poll spends that same read per open pull request and repeats it on a three-minute timer, which makes it the heaviest caller here rather than an exception to the paragraph above. Six open pull requests is around 120 remote reads an hour. What separates the two cases is what each reading decides rather than what it costs. The poll's head fires the review trigger, so a stale one sends a pass at a commit nobody read or withholds one that is owed. The listing decides nothing, so the same spend buys a fresher column in a report and no correctness at all.

`canon pr key-changes` also stays on the object, for a different reason. It reads the body, the file list, and `headRefOid` in one call on purpose, so the three describe one commit. That is a consistency requirement rather than a freshness one, and keying its head elsewhere would break it.
