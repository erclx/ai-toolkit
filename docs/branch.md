# BRANCH REFERENCE

## RULES

- Format: `<type>/<description>` or `<type>/<ticket>-<description>`
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
- Length: 50 characters maximum
- Casing: kebab-case only

## CONSTRAINTS

- Do not use underscores or camelCase
- Do not duplicate type in description (e.g., `feat/feature-login`)
- Do not exceed 50 characters

## EXAMPLES

### Correct

```
feat/jwt-expiration                    # clear feature scope
fix/AUTH-123-connection-pool           # includes ticket ID
refactor/remove-deprecated-endpoints   # clear refactor intent
```

### Incorrect

```
feature/auth_stuff                                           # wrong type name + underscore
feat/feature-add-login                                       # duplicates type in description
fix/DB-456-fix-the-database-connection-pool-memory-leak     # exceeds 50 characters (59)
```
