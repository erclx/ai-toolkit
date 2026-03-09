# Comments reference

## Rules

- One short comment per logical block, not per line.
- Explain why, not what. Never restate what the code already shows, including error messages.
- Above the block only. Never inline end of line.
- Separate the comment from unrelated code above with a blank line.
- No blank line between the comment and the block it describes.
- Lowercase, no punctuation.
- Use either a short phrase or `subject: reason`, mix freely, whatever fits.
- No JSDoc noise.

## Examples

### Good

```typescript
const CANCELLABLE_STATUSES = ['pending', 'processing']

// db: limit transaction size
const MAX_BULK = 50

// stripe: skip duplicate webhook
if (await isEventProcessed(event.id)) return

// retry limit matches stripe's webhook timeout window
const MAX_RETRIES = 3
```

### Bad

```typescript
// cancels order if status allows it
if (!CANCELLABLE_STATUSES.includes(order.status)) throw ...  // restates the constant name

// loop through users and check if active
const activeUsers = users.filter(u => u.isActive);  // restates the code exactly

// send notification to user
await notify(order.userId, { type: "order_cancelled" });  // restates the function name
```
