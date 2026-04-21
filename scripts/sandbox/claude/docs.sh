#!/bin/bash
set -e
set -o pipefail

use_config() {
  export SANDBOX_SKIP_AUTO_COMMIT="true"
  export SANDBOX_INJECT_SEEDS="true"
}

stage_setup() {
  cat <<'EOF' >package.json
{
  "name": "sandbox-docs",
  "version": "1.0.0",
  "private": true,
  "type": "module"
}
EOF

  cat <<'EOF' >CLAUDE.md
# My App

Task management API.

## Commands

- `bun run check`: lint and typecheck
EOF

  mkdir -p .claude
  cat <<'EOF' >.claude/ARCHITECTURE.md
# Architecture

## Storage

SQLite via better-sqlite3. Single `src/db.ts` module owns the connection and exports typed query functions.

## API layer

Express routes in `src/routes/`. Each route file exports a router. `src/app.ts` mounts them.
EOF

  cat <<'EOF' >.claude/REQUIREMENTS.md
# Requirements

- Users can create, list, and complete tasks
- Tasks persist across restarts

## Non-goals

- No multi-user support
- No task sharing between accounts
EOF

  cat <<'EOF' >.claude/TASKS.md
# Tasks

## Up next

### Migrate storage to Postgres

- [ ] Outcome: tasks persist in Postgres instead of SQLite
- [ ] Outcome: connection config reads from environment

> Test strategy: integration, run the API against a local Postgres and verify round-trip.

### Add multi-user accounts

- [ ] Outcome: users can sign up and log in
- [ ] Outcome: tasks are scoped to the owning user
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

  git add . && git commit -m "feat(api): initial task endpoints" --no-verify -q

  cat <<'EOF' >src/db.ts
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function getTasks() {
  const { rows } = await pool.query("SELECT * FROM tasks");
  return rows;
}

export async function createTask(title: string, userId: string) {
  const { rows } = await pool.query(
    "INSERT INTO tasks (title, user_id) VALUES ($1, $2) RETURNING id",
    [title, userId],
  );
  return rows[0];
}
EOF

  git add . && git commit -m "feat(api): migrate storage to Postgres and scope tasks to users" --no-verify -q

  mkdir -p .claude/plans
  cat <<'EOF' >.claude/plans/feature-some-old-plan.md
# Feature: stale plan

This plan is decoy scratch. The claude-docs skill should sweep this file in step 4.
EOF

  log_step "Scenario ready: docs drift after a session pivot"
  log_info "Context: planning docs are stale relative to HEAD"
  log_info "  ARCHITECTURE.md still says SQLite, but src/db.ts now uses Postgres"
  log_info "  REQUIREMENTS.md lists 'no multi-user support' as a non-goal, but createTask now takes userId"
  log_info "  TASKS.md has 'Migrate storage to Postgres' open, but it shipped in HEAD"
  log_info "  Decoy .claude/plans/feature-some-old-plan.md should be swept in step 4"
  log_info ""
  log_info "Before invoking the skill, narrate the pivot to Claude in chat:"
  log_info "  'We pivoted this session: switched storage from SQLite to Postgres,'"
  log_info "  'and promoted multi-user support from non-goal to in-scope.'"
  log_info ""
  log_info "Action:  /claude-docs"
  log_info "Expect:  ARCHITECTURE.md storage section updated to Postgres"
  log_info "         REQUIREMENTS.md non-goals updated, multi-user moved in-scope"
  log_info "         TASKS.md 'Migrate storage to Postgres' marked [x]"
  log_info "         .claude/plans/feature-some-old-plan.md swept"
}
