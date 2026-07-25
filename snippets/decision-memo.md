Produce a decision memo for a research or should-we question. Write one file per independent concern under `.claude/plans/feature-<slug>.md`, or answer inline when the plan is small.

Structure each memo:

- Summary: three one-line bullets covering the goal, the deliverables, and the key tradeoff
- Finding: what the current state actually is, read from the code and docs, not assumed
- One block per decision, each carrying a current-state line, a one-sentence recommendation with its tradeoff, and the real options only when the choice is the user's to make
- Feasibility note: what is not buildable as asked, and why

Attach a proposed answer to every open question. Number the question, add a `Suggested:` line with the best-practice default derived from context, and leave an empty `Answer:` line for the user.

Keep chat to the file pointer plus the questions. Recommend, do not enumerate, unless the user's preference is the deciding factor.
