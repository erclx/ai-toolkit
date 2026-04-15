---
name: systematic-debugging
description: Forces root-cause investigation before any fix when a test fails, a bug surfaces, or unexpected behavior appears. Auto-triggers on "test is failing", "it's broken", "why does X happen", "this isn't working". Do NOT use for trivial typo fixes or when the cause is already agreed on.
---

# Systematic debugging

Random fixes waste time and create new bugs. Before proposing any fix, complete the four phases below in order.

## The rule

No fixes without root-cause investigation first. If phase 1 is incomplete, no fix may be proposed.

## Phase 1: investigate

1. Read every line of the error, stack trace, and log output. Note file paths, line numbers, error codes.
2. Reproduce the failure. If it is not consistently reproducible, gather more data before guessing.
3. Check what changed. Run `git diff` and `git log --oneline -10` from the project root to see recent changes.
4. For multi-component systems, add instrumentation at each component boundary and run once to see which layer fails before investigating further.
5. Trace bad values backward to their source. Fix at the origin, not the symptom.

## Phase 2: find the pattern

1. Locate similar working code in the same codebase. Compare it to the broken code line by line.
2. If following a reference implementation, read it completely before adapting. No skimming.
3. List every difference between working and broken, no matter how small.

## Phase 3: hypothesize and test

1. State one hypothesis: "I think X is the root cause because Y". Be specific.
2. Make the smallest possible change to test it. One variable at a time.
3. If the change does not resolve the issue, form a new hypothesis. Do not stack another fix.
4. If you do not understand something, say so. Do not pretend.

## Phase 4: fix

1. Write a failing test case that reproduces the issue before fixing.
2. Make one change that addresses the root cause. No bundled refactors, no "while I'm here" improvements.
3. Verify the test passes and no other tests break.

## Three-fix circuit breaker

After three failed fix attempts, stop. This pattern indicates an architectural problem, not a bug:

- Each fix reveals a new problem somewhere else.
- Each fix requires refactoring elsewhere to apply.
- Symptoms keep moving.

When this happens, stop fixing and ask the user whether the underlying pattern should be reconsidered.

## Red flags that mean "return to phase 1"

- "Quick fix for now, investigate later"
- "Just try X and see if it works"
- "It's probably Y, let me change that"
- Proposing a fix before tracing data flow
- Adding multiple changes and running tests to see what sticks
- Skipping the failing test "because I'll verify manually"

Any of these means phase 1 is not complete. Return to it.

## When investigation reveals no root cause

Rarely, an issue is genuinely environmental, timing-dependent, or external. In that case:

1. Document what was investigated and ruled out.
2. Implement appropriate handling: retry, timeout, explicit error.
3. Add logging so the next occurrence can be investigated.

Most "no root cause" conclusions are incomplete investigations. Exhaust phase 1 before accepting them.
