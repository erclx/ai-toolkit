# PULL REQUEST REFERENCE

## RULES

- Title: Format as `<type>(<scope>): <subject>` with lowercase for `<type>`, `<scope>`, and first word of `<subject>` (72 characters maximum).
- Voice: Use the imperative mood for all content (e.g., "Add," "Fix," "Refactor").
- Summary: Target 1-2 sentences following `<Action Verb> <Direct Object> to <r>` pattern. Expand for clarity if needed.
- Required Sections: Include `## Summary`, `## Key Changes`, `## Technical Context`, and `## Testing`.
- Component Clarity: Name actual files, functions, or modules in Key Changes (e.g., `AuthService.verify()` not "auth handler").
- Technical Context: Target 1-2 lines explaining architectural reasoning. Expand for complex architectural changes.
- Testing: Specify exact commands or test cases run.

## CONSTRAINTS

- Do not start sentences with "This PR," "This commit," "Included are," or "I have."
- Do not use marketing buzzwords like "seamless," "robust," "game-changer," "enhanced," or "allows."
- Do not describe historical behavior or unchanged code; describe new behavior only.
- Do not include future promises or speculative documentation.
- Do not include visuals unless they clarify architecture, UI, or complex logic flows
- Do not explain obvious changes (formatting, renaming variables)
- Do not duplicate commit messages verbatim

## EXAMPLES

### Template
  
```markdown
## Summary
<Action Verb> <Direct Object> to <Result>.

## Key Changes
- <Verb> <specific component/file/function> (<reason if non-obvious>)
- <Verb> <specific component/file/function>

## Technical Context
- <Architectural reasoning explaining why, not what>

## Testing
- <Specific command or test case>
- <Edge case verified>
```

### Correct

```markdown
## Summary
Update auth middleware to enforce jwt expiration checks.

## Key Changes
- Add `verifyExpiration()` utility to `src/auth/validators.ts`
- Refactor `AuthService.authenticate()` to handle 401 response codes
- Update `JwtMiddleware` to call expiration validator

## Technical Context
- Migration to stateless session management for horizontal scalability

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
