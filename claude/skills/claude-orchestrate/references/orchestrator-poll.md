---
title: Orchestrator poll runbook
description: The review trigger, the condition under which it runs, and how to read what it reports
---

Run the orchestrator's review trigger. The poll reports pull request movement and the session acts on what it reports. The script reads and never writes, and the routing block below decides which report earns a review, which earns a dispatch, and which earns neither.

`${CLAUDE_SKILL_DIR}/scripts/poll.sh` is the script. It needs `gh` authenticated against the remote and `jq` on the path, and it reads the base branch from `origin/HEAD` rather than assuming a name.

## When to run it

Start the poll on a dispatch and stop it when the last pull request merges with nothing else out. An open pull request or a dispatched worker is the condition, and both resolve from the board plus `gh pr list` without asking the operator. A release pull request alone does not qualify, since its sweep carries no findings.

A session holding a recurring-prompt scheduler starts the loop itself on that condition and cancels it on the same test, without waiting for the operator. Both halves belong to whoever holds the loop, since a session that can start one can stop one, and a runbook stating only the start leaves the always-on failure unaddressed on the side that causes it.

Nothing enforces this. No hook starts the poll and no check stops it, so the condition holds only while whoever holds the loop applies it. Left always-on it fires into an empty board through every gap between a dispatch and its push.

The poll is session-scoped and dies with the session that started it. Restart it after a compaction, and take the prompt from this file rather than from a transcript, since a running loop holds whatever wording it was started with and a correction here does not reach it.

The reverse direction is the one that goes unnoticed. A scheduled prompt cannot be edited, so every routing fix is a cancel and a re-create, and three made inside one session each reached the running loop and none reached this file. Edit the block here first and re-create the loop from what this file then says. Rewriting the block from memory drops what the shipped one covered, which is how a `SEEN` report once fell through to no rule at all.

## The prompt

The requirement is a recurring prompt at roughly three minutes carrying the block below. `/loop 3m <the block>` is the mechanism this repository uses and one example among the schedulers a client may hold, so a client without that command reaches the same requirement through whatever recurring prompt it can schedule. Naming one vendor's command as the only path dates a file that ships to every target holding the plugin.

The interval belongs to the schedule rather than to the script. One run is a single snapshot returning in about six seconds, so a session that reads `3m` as the script's runtime and relaunches on completion fires every few seconds and never settles, which happened once for 35 minutes.

Resolve `${CLAUDE_SKILL_DIR}/scripts/poll.sh` to an absolute path and paste that in place of `<POLL_SCRIPT>` below. The variable expands while this runbook renders and not in a standalone loop turn, so a block carrying the variable reaches the session as a literal string and the run improvises a substitute.

```plaintext
Poll GitHub for pull request movement by running <POLL_SCRIPT>, then act on what it reports.

- A release pull request, whatever state follows it: report it and stop. Its sweep carries no findings, so no pass is owed. Test this before any rule below, since a release pull request is reported OPENED like any other and would otherwise match that rule first.
- MOVED or RESPONSE on a pull request I have already reviewed: run the aitk:claude-pr-review skill on it immediately, narrow pass. Re-reviews read prior..head and gain nothing from waiting.
- OPENED, or a pull request with no prior review pass: run the aitk:claude-pr-review skill on it. A draft counts, since every pull request here opens as one and skipping drafts skips everything.
- SEEN: report it and stop. A pass already covers that head, whether it arrived out of band or before the poll first saw the pull request, so no review follows.
- CONFLICT: report it and stop. The branch owner rebases, not this session.
- GONE: report it, then sweep the board by invoking the aitk:claude-orchestrate skill and following its queue-refill sweep.
- A line starting `poll:`: report it verbatim and treat that pull request as unread this run. It is a failed query, not a state.
- Nothing changed: say exactly "No movement." and nothing else.

After any pass that posts a critical or should-fix finding, tell the session holding that branch to run the aitk:claude-address-review skill, resolving it from a session listing taken at that moment. Name the worktree and branch you believe the reader holds and ask to be corrected. Report the invocation for me instead when no live session holds it. A pass carrying only minor findings dispatches nobody.
```

## Reading the output

Every classification line names a pull request and a state. A line starting `poll:` is not a classification. It means a query failed and the script declined to guess, so that pull request keeps its last known state and is neither reported as moved nor swept as merged. Treat it as unread and let the next run classify it.

The script exits non-zero and classifies nothing when the open pull request list itself fails to load. That case would otherwise report every tracked pull request as merged, so the baseline is left untouched and the run says so.

The baseline lives at `.claude/.tmp/pr-poll/baseline.txt` under the main worktree root and is per-machine. A first run against a board already in flight reports each open pull request once before it settles.

The four review headings the script matches are written by `claude-pr-review` and `claude-address-review`. A project that posts its reviews under different headings edits the two jq filters in the script to match, or every pull request reads as never reviewed.
