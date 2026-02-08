# CONVENTIONAL COMMITS REFERENCE

## STATUS

- **Current**: 1.0.0
- **Owner**: Release Manager
- **Last Updated**: 2026-02-08

## PRINCIPLES

- Structure commits atomically, ensuring one logical change per commit.
- Use standard semantic types (`feat`, `fix`, `chore`, `refactor`, `docs`, `perf`, `test`) to drive automated versioning.
- Enforce lowercase subject lines to ensure visual consistency in logs.
- Write subject lines in the imperative mood (e.g., "add field" not "added field").
- Use single-word scopes that map to the directory or component modified.

## COMMANDS

```bash
# Stage all changes (verify diff first!)
git add .

# Commit using the CLI wizard (if installed)
gemini /git:commit

# Manual commit format
git commit -m "type(scope): subject"
```

## EXAMPLES

### ✅ Correct Pattern

```text
feat(auth): add jwt token validation middleware
fix(navbar): resolve z-index overlay issue on mobile
chore(deps): upgrade typescript to v5.4
refactor(utils): simplify date parsing logic
```

### ❌ Incorrect Pattern

```text
# Do not use uppercase
Feat(Auth): Added JWT token validation

# Do not use vague scopes
fix(misc): fixed bug

# Do not use past tense
chore(deps): upgraded packages

# Do not use periods at the end
docs(readme): update installation guide.
```

## CONSTRAINTS

- Limit subject lines to a maximum of 72 characters.
- Avoid filler words like "updates", "changes", or "tweaks" in the subject.
- Do not commit "work in progress" to shared branches; squash them locally first.
- Add a body paragraph separated by a blank line for complex changes.