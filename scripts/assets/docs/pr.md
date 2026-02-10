# PULL REQUEST REFERENCE

## RULES

- Title: Format as `<type>(<scope>): <subject>` with lowercase for `<type>`, `<scope>`, and first word of `<subject>` (72 characters maximum).
- Voice: Use the imperative mood (e.g., "Add," "Fix," "Refactor") for all bullet points and the summary.
- Summary Pattern: `<Action Verb> <Direct Object> to <Result>` (target 20 words; expand if necessary for clarity).
- Required Sections: Include `## Summary`, `## Key Changes`, `## Technical Context`, and `## Testing`.
- Section Specifications: Summary (target 20 words), Key Changes (bullet list of component changes), Technical Context (1-2 lines architectural reasoning), Testing (specific commands or test cases).
- Content Focus: Document only what exists in the code right now; describe new behavior, not historical state.

## CONSTRAINTS

- Do not use filler phrases such as "This PR," "This commit," "Included are," or "I have."
- Do not use marketing buzzwords like "seamless," "robust," "game-changer," "enhanced," or "allows."
- Do not describe historical behavior or what the code "used to do"; describe the new behavior only.
- Do not include future promises or speculative documentation.
- Do not use generic or conversational opening sentences.
- Do not include `## 📸 Visuals` unless UI or CSS files are modified in the changeset.

## EXAMPLES

### Template

```markdown
## Summary
<Action Verb> <Direct Object> to <Result>.

## Key Changes
- <Verb> <component> (<reason if non-obvious>)
- <Verb> <component>

## Technical Context
- <Architectural reasoning in 1-2 lines>

## Testing
- <Specific command or test case>
- <Edge case verified>
```

### Correct

```markdown
## Summary
Update auth middleware to enforce jwt expiration checks.

## Key Changes
- Add `verifyExpiration` utility to core logic
- Refactor `AuthService` to handle 401 response codes

## Technical Context
- Migration to stateless session management for scalability

## Testing
- `npm run test:auth`
- Verified expired token rejection in staging
```

### Incorrect

```markdown
## Summary
This PR updates the authentication system to be more robust.

## Key Changes
- Updated auth middleware files
- The old system used to check tokens differently

## Testing
- Tested manually
```