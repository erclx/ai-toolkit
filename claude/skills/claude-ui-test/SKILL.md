---
name: claude-ui-test
description: Generates and runs Playwright e2e tests for UI changes, with a manual checklist for visual-only items. Use after implementing UI changes, or when asked "what should I test", "what do I verify", or "give me a test checklist". Do NOT use in empty sessions with no implementation context.
---

# Claude UI test

## Guards

- If no implementation context exists in the session, stop: `❌ No implementation context. Describe what you built first.`

## Analysis

Review the session to identify what was built or changed. Categorize each change:

- **Automatable:** interactions, state transitions, form submissions, keyboard navigation, conditional rendering, error states, empty states, loading states. These become Playwright e2e tests.
- **Visual-only:** spacing, alignment, color, typography, layout proportions, animation timing. These become a manual checklist.

Exclude anything already covered by unit or component tests written during implementation.

## E2e tests

Write Playwright tests for all automatable changes. Follow these rules:

- Add tests to the existing e2e test file. If none exists, create `e2e/ui.test.ts`.
- Use the project's existing Playwright config and test patterns. Read them first.
- Each test should perform a user action and assert the expected outcome.
- Cover both happy path and key edge cases (empty state, error state, boundary input).
- For Chrome extensions: load the unpacked extension via Playwright's `--load-extension` flag and use the extension's sidepanel or popup URL as the test target.
- Run the tests after writing them. Fix failures before finishing.

Test structure:

```typescript
test('description of user flow', async ({ page }) => {
  // Arrange: navigate, set up state
  // Act: perform user action
  // Assert: verify expected outcome
})
```

## Manual checklist

For visual-only items that cannot be asserted programmatically, output a checklist. Group by feature area. Use `- [ ]` checkbox syntax.

```
**What to verify visually:**

**<Feature area>**

- [ ] <action> → <expected visual result>
```

If all changes are automatable, skip the manual checklist:

`✅ All changes covered by e2e tests. No manual verification needed.`

## Persist the checklist

When a manual checklist is produced, write it to `.claude/review/ui-checklist.md` from the project root. Create the directory if it does not exist. Always overwrite. Output `📝 Wrote .claude/review/ui-checklist.md` after the chat checklist.

Skip the file write when all changes are covered by e2e tests and no checklist was produced.

The `.claude/review/` directory is gitignored. Do not stage or commit the file.

## Output order

1. Write and run e2e tests (report pass/fail)
2. Output manual checklist for visual-only items (if any)
3. Persist checklist to file (if one was produced)
