# COMMIT MESSAGE REFERENCE

## RULES

- Format: `<type>(<scope>): <subject>`
- Types:
  - `feat`: New feature or capability
  - `fix`: Bug fix
  - `refactor`: Structural changes (not a fix or a new feature)
  - `docs`: Documentation only (README)
  - `chore`: Maintenance tasks (deps, tooling, configs)
  - `perf`: Performance improvements
  - `test`: Add or modify tests
  - `style`: Code formatting (whitespace, semicolons)
  - `build`: Build system changes (webpack, npm scripts)
  - `ci`: CI/CD pipeline changes (GitHub Actions)
  - `revert`: Revert a previous commit
- Scope: Single lowercase word representing a system component
- Subject Mood: Use the imperative mood (e.g., `add` instead of `added`)
- Casing: Use lowercase for `<type>`, `<scope>`, and the first word of `<subject>`
- Character Limits: Subject 72 chars maximum.
- Specificity: Describe the actual technical change, not that something changed (e.g., "add retry logic" not "improve api")

## CONSTRAINTS

- Do not use vague action verbs (e.g., refine, enhance)
- Do not use multi-word scopes or kebab-case (no dashes or spaces)
- Do not use specific filenames as scopes.
- Do not use a scope that duplicates the type.
- Do not repeat the scope in the subject line.
- Do not use trailing periods at the end of the subject line.
- Do not use backslash escaping `\"` or internal double quotes; use single quotes if necessary.
- Do not use conversational filler or introductory phrases

## EXAMPLES

### Correct

```
feat(api): add retry logic for failed webhooks
fix(auth): update 'UserSession' validation logic
```

### Incorrect

```
fix(user-auth): Fixed the redirect loop.  # wrong casing + period
docs(docs): update the readme.            # duplicate scope + period
docs(api): improve documentation          # vague verb + lacks specificity
```