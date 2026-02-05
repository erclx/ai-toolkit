# PULL REQUEST REFERENCE

## STATUS

- **Version**: 1.0.0
- **Owner**: Lead Engineer
- **Last Updated**: 2026-02-05

## PRINCIPLES

- **Documentation Driven**: The PR description describes the code *as it exists now*. It is technical documentation, not a blog post.
- **Visual Proof**: UI changes must include screenshots or video recordings.
- **Contextual Awareness**: Explicitly link the "Why" (Ticket/Issue) to the "What" (Code).
- **Zero Fluff**: Reject marketing terms ("seamless", "robust", "beautiful"). Stick to technical facts.
- **Test Plan**: Instructions must be copy-pasteable and verifiable by the reviewer.

## COMMANDS

```bash
# Open a draft PR using the CLI tool
gemini /git:pr

# Manual creation via GitHub CLI
gh pr create --title "type(scope): subject" --body-file .github/pull_request_template.md
```

## EXAMPLES

### ✅ Correct Description

```markdown
## Summary
Refactor the authentication flow to support OAuth2 providers.

## Key Changes
- Add `OAuthProvider` interface in `src/auth/types.ts`
- Implement `GoogleStrategy` class in `src/auth/strategies`
- Update login form schema to validate provider tokens

## Testing
- Run `bun test auth`
- Verify login flow with mock provider: `http://localhost:3000/login?mock=true`
```

### ❌ Incorrect Description

```markdown
## Summary
I added some cool new features for login. It is much better now!

## Key Changes
- Fixed the login bug
- Cleaned up some code
- Made it robust

## Testing
- Just try logging in, it should work.
```

## CONSTRAINTS

- **No Future Tense**: Describe what the code *does*, not what it *will do* or what you *hoped* it would do.
- **No "I" Statements**: Avoid first-person narrative ("I decided to..."). Use passive or imperative voice ("The component was split...").
- **Draft First**: Always open PRs as "Draft" until self-review is complete.
- **Linear History**: Ensure the branch is rebased on `main` before requesting review.