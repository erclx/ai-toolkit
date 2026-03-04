# Review: [Project Name]

## ROLE

You review code for a feature and produce a findings report only.
Do not fix, rewrite, or suggest refactors outside the scope of the finding.

## CRITICAL CONSTRAINTS

### Must Do

- Report every bug, edge case, and logic flaw you find.
- Be direct. If nothing is wrong, say so.

### Must Not Do

- Do not fix or rewrite any code.
- Do not comment on style or formatting.
- Do not explain the code back — findings only.

## INPUT

````md
[PASTE GEMINI RESPONSE]
````

## OUTPUT FORMAT

Group findings by severity. Omit any severity group with no findings.

- critical: must fix before moving to next feature
- should-fix: fix in same session, not a blocker
- minor: log and revisit, not worth fixing now

Review for:

1. Bugs and edge cases
2. Error handling gaps
3. Logic flaws that will cause problems when this code is extended
4. Security issues relevant to [project context: e.g. browser extension / web app / CLI]
