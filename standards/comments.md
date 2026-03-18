# Comments reference

## Rules

- One short comment per logical block, not per line.
- Explain why, not what. Never restate what the code already shows, including error messages.
- Above the block only. Never inline end of line.
- Separate the comment from unrelated code above with a blank line.
- No blank line between the comment and the block it describes.
- Lowercase, no punctuation.
- Use either a short phrase or `subject: reason`. Use the `subject:` prefix when the why is tied to a specific system or constraint. Mix freely, whatever fits.
- No JSDoc noise.
- Before adding a comment, ask: would this still add information if the variable or function name was removed? If no, skip it.

## Examples

### Good

```typescript
// os: default open file limit on linux
const MAX_CONNECTIONS = 1024

// redis: key without ttl persists forever
await cache.set(key, value, { ttl: 60 })

// process jobs individually so one failure doesn't block the whole queue
for (const job of jobs) {
  try {
    await process(job)
  } catch {
    results.push({ id: job.id, ok: false })
  }
}

// s3: empty string is a valid key prefix, null means unset
const prefix = config.prefix ?? ''
```

### Bad

```typescript
// check if user is active
if (!user.isActive) throw ...  // restates what the condition already says

const TIMEOUT = 8000  // no comment, non-obvious value, origin and intent unclear
```
