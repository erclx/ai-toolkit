#!/usr/bin/env bash
set -e
set -o pipefail

use_config() {
  export SANDBOX_SKIP_AUTO_COMMIT="true"
  export SANDBOX_INJECT_SEEDS="true"
}

stage_setup() {
  cat <<'EOF' >package.json
{
  "name": "sandbox-test-first",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "test": "bun test"
  }
}
EOF

  mkdir -p src

  # One function with the test that covers it, both already committed. The
  # pairing convention is the one the loop reads: a subject at `foo.ts` takes
  # its test at `foo.test.ts` beside it. Seeding the pair rather than
  # describing it leaves the run a shape to copy instead of a rule to recall.
  cat <<'EOF' >src/index.ts
export function greet(name: string): string {
  return `Hello, ${name}!`
}
EOF

  cat <<'EOF' >src/index.test.ts
import { describe, expect, it } from 'bun:test'

import { greet } from './index'

describe('greet', () => {
  it('should address the name it was given', () => {
    expect(greet('Ada')).toBe('Hello, Ada!')
  })
})
EOF

  git add .
  git commit -m "feat(greeting): add the greet helper and its test" --no-verify -q

  log_step "Scenario ready: a paired function and test, with a sibling function still to write"
  log_info "Context: src/index.ts carries greet with src/index.test.ts beside it, committed."
  log_info "         Nothing covers the farewell function the prompt asks for, so the test"
  log_info "         for it has to be written before the code that satisfies it."
  log_info "Action:  /canon:test-first, asking for a farewell function returning 'Goodbye, <name>!'"
  log_info "Expect:  a case added to src/index.test.ts naming what farewell proves, run once"
  log_info "         against the unchanged src/index.ts and read as failing for the missing"
  log_info "         export rather than for a typo or a bad import, then the smallest"
  log_info "         implementation, then the same test run green and the file's other case"
  log_info "         still passing. A run that writes both halves in one motion, or that"
  log_info "         never reports the red run, is the defect this arm exists to catch."
}
