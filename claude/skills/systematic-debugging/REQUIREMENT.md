---
name: systematic-debugging
description: Why a fix is blocked until investigation completes, and what the three-attempt stop is measuring
---

# Systematic debugging requirement

## Gap

Without this skill, a session handed a failure proposes a fix from the first plausible reading of the error, and the fix is judged by whether the symptom moved. A symptom that moves is the normal result of changing something near it, so the session reports success and the cause is still there.

The compounding failures come next. Several changes go in at once, so a pass says nothing about which one mattered. A fix that fails gets another fix stacked on top of it rather than a new hypothesis, and the code accumulates changes nobody can trace to a reason. A bad value gets corrected where it was observed rather than where it was produced, which moves the failure downstream instead of removing it.

Two failures are about stopping rather than about fixing. A session that never counts its attempts keeps fixing through the pattern where each fix reveals a problem elsewhere, which is architectural and cannot be reached from inside the loop. And a session that concludes an issue is environmental usually has an incomplete investigation rather than an environmental issue, because that conclusion is available at any point and is never contradicted by evidence.

## Must

- Complete the investigation before any fix is proposed, reading the failure in full and reproducing it
- Trace a bad value back to where it was produced and fix there
- Compare the broken code against working code in the same codebase before hypothesizing
- State one hypothesis and change one variable to test it
- Write the failing test before the fix, so the fix is judged against a reproduction rather than against the symptom
- Stop after three failed attempts and hand the architectural question to the user

## Must not

- Stack a second fix on a failed one rather than forming a new hypothesis
- Bundle a refactor or an unrelated improvement into the fix
- Accept an environmental or timing conclusion before the investigation is exhausted
- Claim an understanding it does not have

## Guards

- An incomplete investigation blocks the fix proposal, which is the skill's one refusal and the reason it exists
- Three failed attempts stop the loop, since the pattern is evidence about the design rather than about the bug

## Out of scope

- A typo fix and a cause already agreed on, where the phases cost more than they return
- Reviewing a change for defects it has not yet exhibited: `review-branch`
- Deciding whether the architecture should change, which the three-attempt stop hands to the user rather than answering
