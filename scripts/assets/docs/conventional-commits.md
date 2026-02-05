# CONVENTIONAL COMMITS REFERENCE

## STATUS

- **Version**: 1.0.0
- **Owner**: Release Manager
- **Last Updated**: 2026-02-05

## PRINCIPLES

- **Atomic Structure**: One commit per logical change. If you can't describe it in one sentence, split the commit.
- **Semantic Types**: Use standard types (`feat`, `fix`, `chore`, `refactor`, `docs`, `perf`, `test`) to drive automated versioning.
- **Lowercase Enforcement**: The entire subject line must be lowercase to ensure visual consistency in logs.
- **Imperative Mood**: Write as if giving a command (e.g., "add field" not "added field").
- **Scope Specificity**: Use single-word scopes that map to the directory or component modified.

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

- **Subject Length**: Maximum 72 characters.
- **No Filler**: Avoid words like "updates", "changes", "tweaks" in the subject. Be specific (e.g., "resize", "rename", "delete").
- **No WIP**: Do not commit "work in progress" to shared branches. Squash them locally first.
- **Body Requirement**: If the change is complex, add a body paragraph separated by a blank line.