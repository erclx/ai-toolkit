Produce a decision memo for a research or should-we question. This is the decision-heavy counterpart to `plan-feature`, which plans a build. Write one file per independent concern under `.canon/plans/feature-<slug>.md`, or answer inline when the plan is small. Use the same plans folder as `plan-feature`.

Read the current state from the code and docs before recommending. Do not assume it.

Output this shape per memo:

```markdown
# <slug title>

<the question in one or two lines>

## Summary

- <goal in one line>
- <deliverables in one line>
- <key tradeoff in one line>

## Finding

<what the current state actually is, from reading the code and docs>

## Item A: <decision>

**Current state.** <what exists today>

**Recommendation.** <the pick, with the tradeoff in one sentence>

**Options.** <the real alternatives, only when the choice is the user's to make>

**Feasibility.** <what is not buildable as asked and why, omit when all options are buildable>

**Questions.**

1. <question>
   - Suggested: <best-practice default derived from context>
   - Answer:
```

Repeat the `## Item` block per decision. Keep chat to the file pointer plus the questions. Recommend, do not enumerate, unless the user's preference is the deciding factor.
