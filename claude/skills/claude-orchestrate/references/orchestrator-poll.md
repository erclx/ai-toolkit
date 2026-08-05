---
title: Orchestrator poll runbook
description: The review trigger, the condition under which it runs, and how to read what it reports
---

Run the orchestrator's review trigger. The poll reports pull request movement and the session acts on what it reports. It reads only, and it never starts a first-pass review.

`${CLAUDE_SKILL_DIR}/references/poll.sh` is the script. It needs `gh` authenticated against the remote and `jq` on the path, and it reads the base branch from `origin/HEAD` rather than assuming a name.

## When to run it

Start the poll on a dispatch and stop it when the last pull request merges with nothing else out. An open pull request or a dispatched worker is the condition, and both resolve from the board plus `gh pr list` without asking the operator. A release pull request alone does not qualify, since its sweep carries no findings.

Nothing enforces this. No hook starts the poll and no check stops it, so the condition holds only while a session applies it. Left always-on it fires into an empty board through every gap between a dispatch and its push, which leaves stopping it to the operator.

The poll is session-scoped and dies with the session that started it. Restart it after a compaction, and take the prompt from this file rather than from a transcript, since a running loop holds whatever wording it was started with and a correction here does not reach it.

## The prompt

```plaintext
/loop 3m Poll GitHub for pull request movement by running the poll.sh beside this runbook in the claude-orchestrate skill, then act on what it reports.

- MOVED or RESPONSE on a pull request I have already reviewed: run the aitk:claude-pr-review skill on it immediately, narrow pass. Re-reviews read prior..head and gain nothing from waiting.
- OPENED, or a pull request with no prior review pass: report it and stop. First passes wait for the operator, because reading several together is what surfaces cross-PR findings.
- SEEN: report it and stop. A pass already covers that head, whether it arrived out of band or before the poll first saw the pull request, so no review follows.
- CONFLICT: report it and stop. The branch owner rebases, not this session.
- GONE: report it, then sweep the board by invoking the aitk:claude-orchestrate skill and following its queue-refill sweep.
- A line starting `poll:`: report it verbatim and treat that pull request as unread this run. It is a failed query, not a state.
- Nothing changed: say exactly "No movement." and nothing else.

Never start a first-pass review on your own.
```

## Reading the output

Every classification line names a pull request and a state. A line starting `poll:` is not a classification. It means a query failed and the script declined to guess, so that pull request keeps its last known state and is neither reported as moved nor swept as merged. Treat it as unread and let the next run classify it.

The script exits non-zero and classifies nothing when the open pull request list itself fails to load. That case would otherwise report every tracked pull request as merged, so the baseline is left untouched and the run says so.

The baseline lives at `.claude/.tmp/pr-poll/baseline.txt` under the main worktree root and is per-machine. A first run against a board already in flight reports each open pull request once before it settles.

The four review headings the script matches are written by `claude-pr-review` and `claude-address-review`. A project that posts its reviews under different headings edits the two jq filters in the script to match, or every pull request reads as never reviewed.
