# PULL REQUESTS REFERENCE

## STATUS

- **Current**: 1.0.1
- **Owner**: Lead Engineer
- **Last Updated**: 2026-02-08

## PRINCIPLES

- Document *only* what currently exists in the code in PR descriptions; reject future promises or "work in progress" narratives.
- Write all bullet points and titles in the imperative mood (e.g., "Add handler" not "Added handler").
- Exclude meta-commentary or conversational filler (e.g., "This PR," "I have," "Included are").
- Treat code diffs as raw data; descriptions must objectively reflect the diff without marketing adjectives (e.g., "robust," "seamless").

## COMMANDS

```bash
# generate PR description using the git agent
gemini /commands/git/pr.toml

# Manual creation via GitHub CLI (adhering to standards)
gh pr create --title "type(scope): subject" --body-file .gemini/.tmp/pr-body.md --draft
```

## EXAMPLES

### ✅ Correct Pattern

```markdown
## Summary
Implement JWT validation middleware to secure API endpoints.

## Key Changes
- Add `validateToken` function to `auth/middleware.ts`
- Inject middleware into `/api/v1/user` routes
- Update error handling to return 401 on invalid signatures

## Technical Context
- Uses `jose` library for stateless verification to reduce db load

## Testing
- `npm test tests/auth/middleware.test.ts`
- Verified expired token returns 401 via Postman
```

### ❌ Incorrect Pattern

```markdown
## Summary
This PR updates the auth system to be more robust and seamless. I worked hard on this.

## Key Changes
- I added a new file for validation
- Changed the routes
- Fixed some bugs that were annoying

## Technical Context
- It is a game-changer for our security.

## Testing
- Tested locally.
```

## CONSTRAINTS

- MUST follow `<type>(<scope>): <subject>` title format (strictly lowercase, max 72 chars).
- FORBIDDEN words include "robust," "seamless," "enhanced," "allows," and "game-changer."
- MUST ONLY include visuals if `<DIFF_STATS>` indicates changes to UI/CSS files.
- FORBIDDEN to use past tense in summary or key changes (e.g., "Added" -> "Add").