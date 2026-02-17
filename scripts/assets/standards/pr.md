# PULL REQUEST REFERENCE

## Title

- Format: `<type>(<scope>): <subject>`
- Casing: lowercase for `<type>`, `<scope>`, and first word of `<subject>`
- Length: 72 characters maximum

## Content

- Use imperative mood for all content (`add`, `fix`, `refactor`)
- Do not start with "This PR," "This commit," "Included are," or "I have"
- Do not use buzzwords (`seamless`, `robust`, `game-changer`, `enhanced`)
- Do not describe historical behavior or unchanged code; describe new behavior only
- Do not include future promises or speculative documentation
- Do not explain obvious changes (formatting, renaming variables)
- Do not duplicate commit messages verbatim

## Sections

- `## Summary`: 1-2 sentences following `<Action Verb> <Direct Object> to <Result>`, expand for clarity if needed
- `## Key Changes`: name actual files, functions, or modules (e.g., `AuthService.verify()` not "auth handler")
- `## Technical Context`: 1-2 lines of architectural reasoning explaining why, not what; expand for complex changes
- `## Testing`: specify exact commands or test cases run
- Visuals: include only when they clarify architecture, UI, or complex logic flows

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

Update auth middleware to enforce jwt expiration checks. # imperative + direct object + result

## Key Changes

- Add `verifyExpiration()` to `src/auth/validators.ts` # specific function + file path
- Refactor `AuthService.authenticate()` to handle 401 codes # named component + clear change

## Technical Context

- Migration to stateless session management for horizontal scalability # why, not what

## Testing

- `npm run test:auth` # exact command
- Verified expired token rejection in staging # edge case
```

### Incorrect

```markdown
## Summary

This PR updates the authentication system to be more robust. # "This PR" opener + buzzword

## Key Changes

- Updated auth middleware files # vague, no specific component
- The old system used to check tokens differently # describes historical behavior

## Testing

- Tested manually # no specific command or case
```
