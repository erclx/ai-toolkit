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
- STALLED: read the last pass and report what it carried. The pass has sat open for hours with nothing following it, so a worker mid-task is already ruled out and the dispatch either never went out or the session holding it is gone. Confirm and re-send it under the dispatch rule below, whatever grades the pass carried. Do not re-run a review to correct the heading, since a pass on an unchanged head with no response behind it stops by design.
- CONFLICT: report it and stop. The branch owner rebases, not this session.
- UNMATCHED: report it and stop. A comment posted under a heading outside the known set reaches nobody automatically, so a person decides whether to answer it by hand or the set needs a sixth heading.
- GONE: report it, then sweep the board by invoking the aitk:claude-orchestrate skill and following its queue-refill sweep.
- A line starting `poll:`: report it verbatim and treat that pull request as unread this run. It is a failed query, not a state.
- Nothing changed: say exactly "No movement." and nothing else.

After any pass that posts a finding, at any severity, tell the session holding that branch to run the aitk:claude-address-review skill. Resolve the target by running `aitk sessions list --branch <branch> --json` at that moment, which scopes the match to this repository, then route on how many sessions it returned. Zero: report the invocation for me and dispatch nobody. Exactly one, with the confidence field reading "confirmed": address that name directly. Any other count, any other confidence, or a command that is missing or refuses: fall back to picking from a session listing, open by naming the worktree and branch you believe the reader holds, and ask to be corrected. Two sessions can hold one branch, so read the count rather than the first row. The threshold is stated once in the aitk:claude-pr-review skill and governs the heading with it, so an open heading and an owed dispatch answer the same question and either one is enough to send.
```

## Reading the output

Every classification line names a pull request and a state. A line starting `poll:` is not a classification. It means a query failed and the script declined to guess, so that pull request keeps its last known state and is neither reported as moved nor swept as merged. Treat it as unread and let the next run classify it.

The script exits non-zero and classifies nothing when the open pull request list itself fails to load. That case would otherwise report every tracked pull request as merged, so the baseline is left untouched and the run says so.

The baseline lives at `.claude/.tmp/pr-poll/baseline.txt` under the main worktree root and is per-machine. A first run against a board already in flight reports each open pull request once before it settles.

The five review headings the script matches are written by `claude-pr-review` and `claude-address-review`, and the whole set is stated once in the first. A project that posts its reviews under different headings edits the jq filters in the script to match, or every pull request reads as never reviewed.

`UNMATCHED` is what a heading outside the five reaches, carried the same way `RESPONSE` is: a rising count against the baseline is what is new to this script, and the message names the heading so a person can tell whether to answer it by hand or add it to the set. It fires on a tracked pull request only, since a first sighting reports `SEEN` or `OPENED` and takes whatever count already sits on the thread as its starting baseline rather than flagging history the poll never watched.

`RESPONSE` is qualified by recency as well as by count, so it means a reply the last pass has not already answered rather than one this script has not seen before. A worker answers a finding and the reviewing session posts its close-out seconds later, which is the ordinary handback rather than a race, so a count on its own reported the answered thread on the next run and the re-review it routed to stopped at its own guard. The state now fires when the newest reply is stamped later than the last pass, and on a pull request carrying no pass at all, which is a worker talking to nobody and worth the turn. A reply landing inside the same second as the pass is dropped, matching the comparison `claude-pr-review` makes on the same two fields.

`STALLED` is the one state the script derives from a heading rather than from a commit or a count, since `claude-pr-review` posts the open heading exactly when a dispatch is owed, per the threshold that skill states. The heading alone cannot carry it, because an open pass means a dispatch was owed and made, so the ordinary healthy thread is a worker still working. The age of that pass is the third test: the state fires when the open pass covers the head, nothing has followed it, and it is older than the `STALE_AFTER` seconds set at the top of the script. It reports once per entry and fires again after any commit or reply resets the thread. A project whose workers run longer than the default two hours raises that number.

The state reaches every stalled dispatch, since one threshold governs the heading and the dispatch alike and a pass carrying anything posts the open heading. A minors-only pass therefore reports here on the same terms as a blocking one, which widens the state from what it caught while the two were split. It stays a heading test rather than a count test, so nothing here pins the summary line, which is a second string this script does not own.
