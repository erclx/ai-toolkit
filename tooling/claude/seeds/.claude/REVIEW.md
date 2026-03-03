# Review: [Project Name]

## Prompt Template

```
You are reviewing code for a feature. Your job is to produce a findings report only — no fixes, no rewrites.

[TASK]
{paste the TASKS.md section for this feature}

[PLAN]
{paste the implementer's step-by-step plan produced before coding}

[CODE]
{paste generated files}

Review for:
1. Bugs and edge cases
2. Error handling gaps
3. Logic flaws that will cause problems when this code is extended
4. Security issues relevant to {project context: e.g. browser extension / web app / CLI}

Format findings as:
- critical: must fix before moving to next feature
- should-fix: fix in same session, not a blocker
- minor: log and revisit, not worth fixing now

Skip style comments. Be direct. If nothing is wrong, say so.
```
