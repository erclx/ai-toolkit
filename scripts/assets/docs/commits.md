# COMMIT MESSAGE REFERENCE

## RULES

- Format: `<type>(<scope>): <subject>`
- Types: `feat`, `fix`, `refactor`, `chore`, `docs`, `perf`, `test`, `style`, `build`, `ci`, `revert`.
- Scope: Use a single-word directory category or system component.
- Subject Mood: Use the imperative mood (e.g., `add` instead of `added`).
- Casing: Use lowercase for `<type>`, `<scope>`, and the first word of `<subject>`.
- Character Limits: Subject 50 chars (soft), Body 72 chars (hard).

## CONSTRAINTS

- Do not use multi-word scopes; no dashes, spaces, or kebab-case.
- Do not use specific filenames as scopes.
- Do not use generic scopes such as `(misc)`, `(general)`, or `(fix)`.
- Do not use trailing periods at the end of the subject line.
- Do not use backslash escaping `\"` or internal double quotes; use single quotes if necessary.
- Do not use conversational filler or introductory phrases.

## EXAMPLES

### Correct

```
feat(api): add retry logic for failed webhooks
```
```
fix(auth): update 'UserSession' validation logic
```

### Incorrect

```
fix(user auth): Fixed the redirect loop.
```
```
feat(ui): add the period at the end.
```