---
name: internal-sandbox-check
description: Scope boundary for the ship-time pairing audit, and what separates a run that verified something from one that returned green
---

# Internal sandbox check requirement

## Gap

Without this skill, a branch ships a changed skill whose scenario still exercises the body it had before, a verification run measures an arm nobody chose, a run launched from a worktree provisions against the main checkout, a second scenario provisioned beside the first destroys it and leaves the run reading a tree the previous scenario built, and an item ships unverified with no record of what stopped it.

The audit also asks what is already answered. A skill the census has ruled on draws a prompt once per branch, and the answer reaches nothing durable, so the next branch touching that skill asks again. One word covers both deferring verification on this branch and ruling that no arm should ever exist, which are different claims with different lifetimes.

Every one of these returns without complaint. A stale pairing reports nothing because the scenario still passes against the old behavior, and a run on the wrong arm prints a verdict in the same shape a correct one does. The branch then carries a verification receipt covering something other than what it changed, which is worse than carrying none, because the receipt is what a reviewer reads instead of checking.

## Must

- Pair every changed skill and script to a scenario or to an explicit opt-out, and print a status for each so an unpaired item is visible rather than absent
- Resolve the arm and the gate before the report prints, since the report states both and the later steps decide whether to run on them
- Invoke the worktree-local script, because the globally installed `canon` resolves to the main checkout and would run main's scenarios against this branch
- Provision one scenario and queue the rest, since a single directory per root means the second provision destroys the first
- Name exactly one gate when an item ships without a live run, so an affordable run and an impossible one do not read the same
- Read the skill census before asking, so a recorded verdict is reported rather than re-decided, and reach it through the worktree-local entry point for the reason the provisioning command is worktree-local
- Ask where a scenario file sits at a path no spelling reaches, offering it rather than recording it, since the file proves a scenario exists and not that it exercises this skill
- Report a verdict, an internal skill outside the census, and an answer given this run under separate labels, since collapsing them is the defect that made the prompt repeat

## Must not

- Guess a pairing past the first fallback. Fuzzy matching across categories produces a wrong pairing that reads exactly like a real one.
- Guess an arm from the scenario file. An unresolved arm reaches a picker that aborts without a terminal and takes the first arm when forced past it, which is how a verdict comes to name an arm nobody selected.
- Read `unchecked` as a pass, or convert it into a failure. It is the absence of a claim.
- Open an interactive session, which holds a terminal a headless caller cannot release
- Sweep the queued scenarios through the runner, which is what keeps a run inside its documented cost
- Propose or apply a scenario edit, or fix a failing verdict. The audit surfaces the gap and the operator decides.
- Write an exemption. The file admits a harness capability limit or a skill producing no artifact, both judgments about the harness rather than about the branch in hand, and a claim authored mid-ship-check is how the two-kinds rule erodes.

## Guards

- On `main` or `master`, stop. The audit is defined against the diff since main and has nothing to read there.
- No skill or script changes since main, stop rather than reporting an empty pass
- A scenario pushing to a private remote is gated on credentials rather than run. Check authentication before the run, since nothing else catches it and the failure otherwise surfaces as a push error naming the host.

## Out of scope

- Authoring a scenario, extending one with a new arm, and running one during development: `internal-scripts`. This skill reports whether the pairing held.
- Which skills earn a mechanical assertion at all, which `canon sandbox coverage` reports and the sandbox coverage entry rules on by blast radius
- Verifying the change itself. A green verdict says the scenario ran, and whether the behavior is correct is the review's question.
