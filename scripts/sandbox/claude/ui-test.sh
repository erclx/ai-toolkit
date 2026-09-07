#!/usr/bin/env bash
set -e
set -o pipefail

# No project copy of the corpus, for the same reason `claude/review.sh` carries
# none. The absent project copy forces `ui-test` onto the
# `${CLAUDE_SKILL_DIR}/../../standards/skill.md` fallback, and the branch name
# below turns that citation into a checklist filename a reader can check by eye.
# `expect.toml` carries that claim as a manual entry rather than an assertion,
# because the checklist lands at a root no run determines.
use_config() {
  export SANDBOX_SKIP_AUTO_COMMIT="true"
  export SANDBOX_INJECT_SEEDS="true"
}

stage_setup() {
  cat <<'EOF' >package.json
{
  "name": "sandbox-ui-test",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "test:e2e": "playwright test"
  },
  "devDependencies": {
    "@playwright/test": "^1.48.0"
  }
}
EOF

  cat <<'EOF' >playwright.config.ts
import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  use: { baseURL: 'http://localhost:5173' },
})
EOF

  cat <<'EOF' >>CLAUDE.md

# Sample app

Vite and React task board. UI lives in `src/components/`.

## Commands

- `bun run test:e2e`: Playwright end to end tests
EOF

  mkdir -p src/components e2e

  cat <<'EOF' >src/components/TaskList.tsx
export function TaskList({ tasks }: { tasks: string[] }) {
  return (
    <ul className="task-list">
      {tasks.map((task) => (
        <li key={task}>{task}</li>
      ))}
    </ul>
  )
}
EOF

  cat <<'EOF' >e2e/ui.test.ts
import { expect, test } from '@playwright/test'

test('task list renders the seeded tasks', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('listitem')).toHaveCount(2)
})
EOF

  git add . && git commit -m "feat(ui): task list" --no-verify -q

  git checkout -b feat/task-filter -q

  # The diff the skill classifies. `TaskList` gains an empty state and a filter
  # input, which are automatable, and a spacing and color change, which is not.
  # Both kinds have to be present or the skill takes its all-automatable branch
  # and writes no checklist, which is the file the fallback claim is about.
  #
  # The input stays mounted alongside the empty state. Returning the paragraph
  # alone would unmount it and strand a user who filtered to no matches with no
  # way to clear the filter, and a skill reading that diff reviews the fixture's
  # own defect instead of the change under test.
  cat <<'EOF' >src/components/TaskList.tsx
import { useState } from 'react'

export function TaskList({ tasks }: { tasks: string[] }) {
  const [filter, setFilter] = useState('')
  const visible = tasks.filter((task) => task.includes(filter))

  return (
    <div>
      <input
        aria-label="Filter tasks"
        onChange={(event) => setFilter(event.target.value)}
        value={filter}
      />
      {visible.length === 0 ? (
        <p className="task-list-empty">No tasks match that filter.</p>
      ) : (
        <ul className="task-list">
          {visible.map((task) => (
            <li key={task}>{task}</li>
          ))}
        </ul>
      )}
    </div>
  )
}
EOF

  cat <<'EOF' >src/components/task-list.css
.task-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
}

.task-list-empty {
  color: #6b7280;
  padding: 24px 16px;
}
EOF

  git add . && git commit -m "feat(ui): filter tasks and handle the empty state" --no-verify -q

  log_step "Scenario ready: UI change with an automatable and a visual half"
  log_info "Context: feat/task-filter, one commit ahead of main"
  log_info "  automatable : filter input, empty state, list count after filtering"
  log_info "  visual only : 12px gap, 16px padding, muted empty-state color"
  log_info ""
  log_info "This arm also checks the standards citation, not the skill alone."
  log_info "  .claude/standards/ is absent, so the skill must reach the plugin copy"
  log_info "  the slug transform lives only in standards/skill.md, never in the skill body"
  log_info "  so ui-checklist-task-filter.md is evidence the fallback resolved"
  log_info "  read that filename yourself, the checker cannot assert it yet"
  log_info ""
  log_info "Playwright installs, and the tests cannot pass. There is no app entry"
  log_info "point and nothing serves the baseURL, so every test fails on a refused"
  log_info "connection. The arm asserts what the skill authored, not what a test"
  log_info "run reported, and a correct run says the scaffold is missing rather"
  log_info "than building a Vite app to get green."
  log_info ""
  log_info "Action:  /canon:ui-test I added a filter input and an empty state to TaskList, and restyled its spacing"
  log_info "Expect:  declared in fixtures/claude/ui-test/expect.toml"
  log_info "         Check it with: canon sandbox check claude:ui-test"
}
