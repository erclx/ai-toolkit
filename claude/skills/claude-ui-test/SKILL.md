---
name: claude-ui-test
description: Generates a manual browser verification checklist from session context. Use after implementing UI changes, or when asked "what should I test", "what do I verify", or "give me a test checklist". Do NOT use in empty sessions with no implementation context.
---

# Claude UI test

## Guards

- If no implementation context exists in the session, stop: `❌ No implementation context. Describe what you built first.`

## Analysis

Review the session to identify what was built or changed. Focus on:

- New or modified UI components, views, or pages
- Changed interactions (clicks, form submissions, navigation, state transitions)
- Conditional rendering, loading states, or error states
- Layout or visual changes

Exclude anything covered by unit or integration tests.

## Output

Group by feature area. For each item, write one line: what to do, then what to expect. Keep it scannable.

**What to verify:**

**<Feature area>**

- [ ] <action> → <expected result>
- [ ] <action> → <expected result>

Repeat for each area. If nothing requires manual verification, output:

`✅ No manual verification needed. Changes are fully covered by automated tests.`
