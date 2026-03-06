# Branch reference

## Format

- Structure: `<type>/<description>` or `<type>/<ticket>-<description>`
- Length: 50 characters maximum
- Casing: kebab-case only, no underscores or camelCase
- Description: 2 words maximum, 3 only when genuinely needed for specificity; capture the core change, do not transcribe commit messages verbatim
- When commits span multiple related changes, the description reflects the unifying concern, not the most recent commit subject (e.g., `feat/git-commands` not the last commit's subject)
- Do not duplicate type in description (e.g., `feat/feature-login`)

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

## Examples

### Correct

```text
feat/jwt-expiration                    # clear feature scope
fix/AUTH-123-connection-pool           # includes ticket ID
refactor/remove-deprecated-endpoints   # clear refactor intent
```

### Incorrect

```text
feature/auth_stuff                                        # wrong type + underscore
feat/feature-add-login                                    # duplicates type in description
fix/DB-456-fix-the-database-connection-pool-memory-leak   # exceeds 50 chars + verbatim message
```
