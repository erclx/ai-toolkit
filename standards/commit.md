# COMMIT MESSAGE REFERENCE

## Format

- Structure: `<type>(<scope>): <subject>`
- Casing: lowercase for `<type>`, `<scope>`, and first word of `<subject>`
- Subject: 72 characters maximum, no trailing period

## Types

- `feat`: new feature or capability
- `fix`: bug fix
- `refactor`: structural changes (not a fix or feature)
- `docs`: documentation only (README)
- `chore`: maintenance tasks (deps, tooling, configs)
- `perf`: performance improvements
- `test`: add or modify tests
- `style`: code formatting (whitespace, semicolons)
- `build`: build system changes (webpack, npm scripts)
- `ci`: CI/CD pipeline changes (GitHub Actions)
- `revert`: revert a previous commit

## Scope

- Single lowercase word representing a system component
- Prefer single word; use kebab-case only when two words are genuinely needed for specificity
- Do not use specific filenames as scopes
- Do not use a scope that duplicates the type

## Subject

- Use imperative mood (`add` not `added`)
- Describe the actual technical change, not that something changed
- Do not use vague verbs (`improve`, `refine`, `enhance`)
- Do not repeat the scope in the subject line
- Use single quotes if quoting; no backslash escaping or internal double quotes
- No conversational filler or introductory phrases

## EXAMPLES

### Correct

```text
feat(api): add retry logic for failed webhooks       # specific verb + clear change
fix(auth): update 'UserSession' validation logic     # scoped + imperative + single quotes
```

### Incorrect

```text
fix(user-auth): Fixed the redirect loop.    # wrong casing + period + multi-word scope
docs(docs): update the readme.              # duplicate scope + period
docs(api): improve documentation            # vague verb + lacks specificity
```
