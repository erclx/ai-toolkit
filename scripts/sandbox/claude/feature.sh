#!/bin/bash
set -e
set -o pipefail

use_config() {
  export SANDBOX_SKIP_AUTO_COMMIT="true"
  export SANDBOX_INJECT_SEEDS="true"
}

stage_setup() {
  select_or_route_scenario "Which scenario?" "full" "small"

  case "$SELECTED_OPTION" in
  "full")
    cat <<'EOF' >package.json
{
  "name": "sandbox-feature",
  "version": "1.0.0",
  "private": true,
  "type": "module"
}
EOF

    cat <<'EOF' >>CLAUDE.md

# My App

Task management API with SQLite storage.

## Commands

- `bun run check`: lint and typecheck
- `bun run test`: run tests

## Behavior

- All database access goes through `src/db.ts`
- Route handlers live in `src/routes/`
- Use Zod for input validation
EOF

    mkdir -p .claude
    cat <<'EOF' >.claude/ARCHITECTURE.md
# Architecture

## Storage

SQLite via better-sqlite3. Single `src/db.ts` module owns the connection and exports typed query functions.

## API layer

Express routes in `src/routes/`. Each route file exports a router. `src/app.ts` mounts them.

## Validation

Zod schemas co-located with route files. Parse request bodies at the handler boundary.
EOF

    mkdir -p src src/routes
    cat <<'EOF' >src/db.ts
import Database from "better-sqlite3";

const db = new Database("tasks.db");

db.exec(`
  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    done INTEGER DEFAULT 0
  )
`);

export function getTasks() {
  return db.prepare("SELECT * FROM tasks").all();
}

export function createTask(title: string) {
  return db.prepare("INSERT INTO tasks (title) VALUES (?)").run(title);
}
EOF

    cat <<'EOF' >src/routes/tasks.ts
import { Router } from "express";
import { getTasks, createTask } from "../db";

const router = Router();

router.get("/", (_req, res) => {
  res.json(getTasks());
});

router.post("/", (req, res) => {
  const { title } = req.body;
  const result = createTask(title);
  res.status(201).json({ id: result.lastInsertRowid });
});

export default router;
EOF

    cat <<'EOF' >.claude/TASKS.md
# Tasks

### Add due dates and priority to tasks

Add a `due` (ISO date string, nullable) and `priority` (enum: low, medium, high, default medium) column to the tasks table. Expose both fields in the create and list endpoints. Validate with Zod.

- [ ] Outcome: tasks table has `due` and `priority` columns
- [ ] Outcome: POST /tasks accepts and persists both fields
- [ ] Outcome: GET /tasks returns both fields
EOF

    git add . && git commit -m "feat(api): initial task endpoints" --no-verify -q

    log_step "Scenario ready: feature planning (full mode)"
    log_info "Context: task API with SQLite, Express routes, CLAUDE.md, ARCHITECTURE.md, and TASKS.md present"
    log_info "Action:  /claude-feature (reference the task in TASKS.md)"
    log_info "Expect:  plan written to .claude/plans/feature-<slug>.md with files to touch, risks, and questions"
    ;;
  "small")
    cat <<'EOF' >CLAUDE.md
# My Project

Personal notes repo. Mostly markdown.
EOF

    cat <<'EOF' >README.md
# My Project

This here project is a place where i keep notes and stuff for my work and other things i am doing, the notes are in markdown and there is no real structure to it but i try to keep things organized in folders by topic so i can find them later when i need to look something up or remember what i was thinking about a particular subject at the time.
EOF

    mkdir -p .claude
    cat <<'EOF' >.claude/DESIGN.md
# Design

SENTINEL: this file should NOT be read for prose-only changes. If the skill surfaces this content, the small-mode branch is broken.
EOF

    cat <<'EOF' >.claude/WIREFRAMES.md
# Wireframes

SENTINEL: this file should NOT be read for prose-only changes. If the skill surfaces this content, the small-mode branch is broken.
EOF

    cat <<'EOF' >.claude/GOV.md
# Governance

SENTINEL: this file should NOT be read for prose-only changes. If the skill surfaces this content, the small-mode branch is broken.
EOF

    cat <<'EOF' >.claude/TASKS.md
# Tasks

### Tighten the README intro paragraph

The opening paragraph in `README.md` is one long run-on sentence. Break it into two or three shorter sentences with clearer structure.

- [ ] Outcome: README intro reads as 2-3 sentences instead of one run-on
EOF

    git add . && git commit -m "chore(notes): initial notes repo" --no-verify -q

    log_step "Scenario ready: feature planning (small mode)"
    log_info "Context: prose-only repo, single README task, decoy DESIGN/WIREFRAMES/GOV with sentinel text"
    log_info "Action:  /claude-feature (reference the task in TASKS.md)"
    log_info "Expect:  chat-only output, NO .claude/plans/ file written, decoys NOT surfaced"
    ;;
  *)
    log_error "Unknown scenario: $SELECTED_OPTION"
    ;;
  esac
}
