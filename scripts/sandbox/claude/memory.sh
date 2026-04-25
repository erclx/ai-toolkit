#!/bin/bash
set -e
set -o pipefail

use_config() {
  export SANDBOX_SKIP_AUTO_COMMIT="true"
  export SANDBOX_INJECT_SEEDS="true"
}

stage_setup() {
  cat <<'EOF' >>CLAUDE.md

# Sample Project

Task API used as the fixture for /toolkit:claude-memory-review.

## Behavior

- Run `bun run check` before opening a PR.

## Memory

- Write all memory files to `.claude/memory/`, not `~/.claude/projects/`.
- Save a feedback memory only when the same mistake happens twice or when the user explicitly corrects you.
- Keep feedback memories to 3 lines: the rule, a one-line Why, and a one-line How to apply.

## Tasks

- Track work in `.claude/TASKS.md`.
EOF

  mkdir -p .claude/skills/aitk-sample
  cat <<'EOF' >.claude/skills/aitk-sample/SKILL.md
---
name: aitk-sample
description: Guide edits under src/.
---

# Sample skill

## When to load

When editing anything under `src/`.

## Conventions

- Route handlers live in `src/routes/`.
EOF

  mkdir -p .claude/memory

  cat <<'EOF' >.claude/memory/feedback-confirm-destructive-commands.md
---
name: Confirm destructive commands before running
description: Pause for user approval before rm, force-push, or branch deletion
type: feedback
---

Before running a destructive shell command, state the command and wait for user approval.

**Why:** User lost work last session when a `git reset --hard` ran without confirmation.

**How to apply:** On any command that deletes data or rewrites shared history, print the exact command in chat and pause.
EOF

  cat <<'EOF' >.claude/memory/feedback-zod-in-src-routes.md
---
name: Use Zod for request validation in src/routes
description: Parse request bodies with Zod schemas at the handler boundary
type: feedback
---

Route handlers in `src/routes/` must parse request bodies with Zod before touching the db layer.

**Why:** A past incident landed unchecked input into SQLite and corrupted the tasks table.

**How to apply:** When editing or adding a handler under `src/routes/`, co-locate the Zod schema in the same file and parse before any db call.
EOF

  cat <<'EOF' >.claude/memory/feedback-no-obvious-comments.md
---
name: Do not add obvious comments
description: Skip comments that restate what the code already says
type: feedback
---

Do not write comments that describe what the code does when the identifiers already state it.

**Why:** Obvious comments rot as code evolves and create review noise.

**How to apply:** Before writing a comment, ask whether removing it would confuse a reader. If no, skip it.
EOF

  cat <<'EOF' >.claude/memory/feedback-comments-explain-why.md
---
name: Comments should explain why, not what
description: Reserve comments for non-obvious rationale, hidden constraints, and workarounds
type: feedback
---

When a comment is warranted, it explains why the code is shaped this way, not what it does.

**Why:** "What" comments duplicate code. "Why" comments capture invariants the code cannot express.

**How to apply:** If a comment starts with a verb describing the code's action, rewrite it to name the constraint or reason instead.
EOF

  cat <<'EOF' >.claude/memory/feedback-memory-location.md
---
name: Write memories to .claude/memory/
description: Memory files belong under .claude/memory/, not ~/.claude/projects/
type: feedback
---

All memory files land in `.claude/memory/` at the project root, never in `~/.claude/projects/`.

**Why:** Per-project memory must be tracked alongside the repo it applies to.

**How to apply:** Before writing a memory file, verify the path starts with `.claude/memory/`.
EOF

  cat <<'EOF' >.claude/memory/feedback-be-careful.md
---
name: Be careful
description: Think before acting
type: feedback
---

Be thoughtful about changes.

**Why:** Mistakes are costly.

**How to apply:** Consider impact before editing.
EOF

  cat <<'EOF' >.claude/memory/MEMORY.md
# Memory Index

## Feedback

| Name | File | Description |
| ---- | ---- | ----------- |
| Confirm destructive commands before running | [feedback-confirm-destructive-commands.md](feedback-confirm-destructive-commands.md) | Pause for user approval before rm, force-push, or branch deletion |
| Use Zod for request validation in src/routes | [feedback-zod-in-src-routes.md](feedback-zod-in-src-routes.md) | Parse request bodies with Zod schemas at the handler boundary |
| Do not add obvious comments | [feedback-no-obvious-comments.md](feedback-no-obvious-comments.md) | Skip comments that restate what the code already says |
| Comments should explain why, not what | [feedback-comments-explain-why.md](feedback-comments-explain-why.md) | Reserve comments for non-obvious rationale, hidden constraints, and workarounds |
| Write memories to .claude/memory/ | [feedback-memory-location.md](feedback-memory-location.md) | Memory files belong under .claude/memory/, not ~/.claude/projects/ |
| Be careful | [feedback-be-careful.md](feedback-be-careful.md) | Think before acting |

## Project

| Name | File | Description |
| ---- | ---- | ----------- |

## User

| Name | File | Description |
| ---- | ---- | ----------- |
EOF

  git add . && git commit -m "chore(memory): seed review fixtures" --no-verify -q

  log_step "Scenario ready: memory review with mixed classification"
  log_info "Fixtures seeded in .claude/memory/:"
  log_info "  confirm-destructive-commands  : promote to CLAUDE.md Behavior (cross-domain)"
  log_info "  zod-in-src-routes             : promote to .claude/skills/aitk-sample/SKILL.md (path-scoped)"
  log_info "  no-obvious-comments + comments-explain-why : consolidate into one promote"
  log_info "  memory-location               : already absorbed in CLAUDE.md Memory, should delete"
  log_info "  be-careful                    : crisp-fail, should delete"
  log_info ""
  log_info "Action:  /toolkit:claude-memory-review"
  log_info "Expect:  review file at .claude/review/memory-review-<slug>.md with 5 numbered items"
  log_info "         respond 'all' to exercise the apply path"
  log_info "         after apply, review file is deleted and MEMORY.md rows for handled entries are gone"
}
