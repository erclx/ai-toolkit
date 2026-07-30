import {
  mkdirSync,
  mkdtempSync,
  rmSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  checkExpectation,
  countMechanicalAssertions,
  expectFilePath,
  parseExpectation,
  parseTarget,
  resolveVerdict,
  verdictExitCode,
  type CheckInput,
  type Expectation,
  type RunEnvelope,
  type Verdict,
} from '@/sandbox/expect'

const ARCHIVE = '.claude/.tmp/plans-archive/feature-postgres-migration.md'
const PLANS_LIVE = '.claude/plans/feature-postgres-migration.md'
const PLANS_DECOY = '.claude/plans/feature-some-old-plan.md'
const TASKS = '.claude/tasks/v01.0-postgres.md'

const CLEAN_ENVELOPE: RunEnvelope = { isError: false, turns: 12, denials: 0 }

let sandbox: string

function write(path: string, body: string): void {
  const full = join(sandbox, path)
  mkdirSync(dirname(full), { recursive: true })
  writeFileSync(full, body)
}

/**
 * The tree a correct `/claude-docs` run leaves behind on the drift arm. Every
 * negative case mutates exactly one thing from here, so a case that goes red
 * names which assertion caught it.
 */
function seedCorrectTree(): void {
  write(ARCHIVE, '# Feature: Postgres migration\n')
  write(PLANS_DECOY, '# Feature: unlinked plan\n')
  write(
    TASKS,
    [
      '### Migrate storage to Postgres',
      '',
      'Plan: .claude/.tmp/plans-archive/feature-postgres-migration.md',
      '',
      '- [x] Outcome: tasks persist in Postgres instead of SQLite',
      '- [x] Outcome: connection config reads from environment',
      '',
    ].join('\n'),
  )
}

function driftExpectation(): Expectation {
  return {
    paths: [ARCHIVE, PLANS_DECOY],
    absent: [PLANS_LIVE],
    content: [
      { path: TASKS, pattern: '^- \\[x\\] Outcome: tasks persist in Postgres' },
      {
        path: TASKS,
        pattern:
          '^Plan: \\.claude/\\.tmp/plans-archive/feature-postgres-migration\\.md',
      },
    ],
    writeScope: ['.claude/**'],
    manual: [
      'ARCHITECTURE.md storage section rewritten',
      'REQUIREMENTS.md non-goals updated',
    ],
    maxTurns: 20,
  }
}

function checkInput(overrides: Partial<CheckInput> = {}): CheckInput {
  return {
    sandboxDir: sandbox,
    writes: [TASKS, ARCHIVE],
    envelope: CLEAN_ENVELOPE,
    ...overrides,
  }
}

function runDrift(overrides: Partial<CheckInput> = {}): Verdict {
  return checkExpectation(driftExpectation(), checkInput(overrides))
}

beforeEach(() => {
  sandbox = mkdtempSync(join(tmpdir(), 'aitk-expect-'))
})

afterEach(() => {
  rmSync(sandbox, { recursive: true, force: true })
})

describe('checkExpectation', () => {
  describe('on a correct tree', () => {
    it('should pass when every declared assertion holds', () => {
      seedCorrectTree()

      const verdict = runDrift()

      expect(verdict.state).toBe('pass')
      expect(verdict.failed).toBe(0)
    })

    it('should count manual lines as unchecked rather than asserted', () => {
      seedCorrectTree()

      const verdict = runDrift()

      expect(verdict.unchecked).toBe(2)
      expect(verdict.asserted).toBe(7)
    })
  })

  /**
   * A checker exercised only against a correct tree cannot distinguish asserting
   * correctly from asserting nothing, which is the defect this feature removes.
   * Each case below violates one assertion kind and must go red.
   */
  describe('on a tree that violates one assertion', () => {
    it('should fail when the swept plan was deleted rather than archived', () => {
      seedCorrectTree()
      unlinkSync(join(sandbox, ARCHIVE))

      const verdict = runDrift()

      expect(verdict.state).toBe('fail')
      expect(verdict.results).toContainEqual({
        ok: false,
        message: `missing: ${ARCHIVE}`,
      })
    })

    it('should fail when the swept plan is still in the plans folder', () => {
      seedCorrectTree()
      write(PLANS_LIVE, 'stale copy\n')

      const verdict = runDrift()

      expect(verdict.state).toBe('fail')
      expect(verdict.results).toContainEqual({
        ok: false,
        message: `should not exist: ${PLANS_LIVE}`,
      })
    })

    it('should fail when the unlinked plan was swept', () => {
      seedCorrectTree()
      unlinkSync(join(sandbox, PLANS_DECOY))

      expect(runDrift().state).toBe('fail')
    })

    it('should fail when the shipped task is left unchecked', () => {
      seedCorrectTree()
      write(
        TASKS,
        'Plan: .claude/.tmp/plans-archive/feature-postgres-migration.md\n\n- [ ] Outcome: tasks persist in Postgres instead of SQLite\n',
      )

      expect(runDrift().state).toBe('fail')
    })

    it('should fail when the plan line still points at the live plans folder', () => {
      seedCorrectTree()
      write(
        TASKS,
        'Plan: .claude/plans/feature-postgres-migration.md\n\n- [x] Outcome: tasks persist in Postgres instead of SQLite\n',
      )

      expect(runDrift().state).toBe('fail')
    })

    it('should fail when the run wrote outside the declared scope', () => {
      seedCorrectTree()

      const verdict = runDrift({ writes: ['src/db.ts'] })

      expect(verdict.state).toBe('fail')
      expect(verdict.results).toContainEqual({
        ok: false,
        message: 'wrote outside declared scope: src/db.ts',
      })
    })

    it('should fail a pattern that does not compile rather than throwing', () => {
      seedCorrectTree()
      const expectation: Expectation = {
        ...driftExpectation(),
        content: [{ path: TASKS, pattern: '[unclosed' }],
      }

      const verdict = checkExpectation(expectation, checkInput())

      expect(verdict.state).toBe('fail')
      expect(verdict.results).toContainEqual({
        ok: false,
        message: `invalid pattern for ${TASKS}: [unclosed`,
      })
    })

    it('should fail a content assertion whose file does not exist', () => {
      seedCorrectTree()
      unlinkSync(join(sandbox, TASKS))

      const verdict = runDrift()

      expect(verdict.state).toBe('fail')
      expect(verdict.results).toContainEqual({
        ok: false,
        message: `no file to match: ${TASKS}`,
      })
    })
  })

  describe('on the run envelope', () => {
    it('should fail a run that reported an error', () => {
      seedCorrectTree()

      const verdict = runDrift({
        envelope: { ...CLEAN_ENVELOPE, isError: true },
      })

      expect(verdict.state).toBe('fail')
    })

    it('should fail a run over the declared turn ceiling', () => {
      seedCorrectTree()

      const verdict = runDrift({ envelope: { ...CLEAN_ENVELOPE, turns: 99 } })

      expect(verdict.results).toContainEqual({
        ok: false,
        message: 'envelope: 99 turns over ceiling of 20',
      })
    })

    it('should fail a run that recorded a permission denial', () => {
      seedCorrectTree()

      const verdict = runDrift({ envelope: { ...CLEAN_ENVELOPE, denials: 3 } })

      expect(verdict.state).toBe('fail')
    })

    it('should not pass a failing tree because the envelope was clean', () => {
      seedCorrectTree()
      unlinkSync(join(sandbox, ARCHIVE))

      expect(runDrift({ envelope: CLEAN_ENVELOPE }).state).toBe('fail')
    })
  })
})

/**
 * The declaration counts what it declares and the verdict counts what ran. Those
 * diverge on `write_scope`, which yields one result per write rather than one per
 * glob, so a pass with zero assertions has to be unreachable.
 */
describe('checkExpectation with no assertion able to run', () => {
  const scopeOnly: Expectation = {
    paths: [],
    absent: [],
    content: [],
    writeScope: ['.claude/**'],
    manual: [],
    maxTurns: undefined,
  }

  it('should fail when a write-scope-only arm saw no writes', () => {
    const verdict = checkExpectation(scopeOnly, {
      sandboxDir: sandbox,
      writes: [],
    })

    expect(verdict.state).toBe('fail')
    expect(verdict.asserted).toBe(0)
  })

  it('should never report pass with zero assertions', () => {
    const verdict = checkExpectation(scopeOnly, {
      sandboxDir: sandbox,
      writes: [],
    })

    expect(verdict.state === 'pass' && verdict.asserted === 0).toBe(false)
  })
})

describe('checkExpectation with data the caller did not supply', () => {
  it('should skip write scope rather than drop it when writes are absent', () => {
    seedCorrectTree()

    const verdict = checkExpectation(driftExpectation(), {
      sandboxDir: sandbox,
      envelope: CLEAN_ENVELOPE,
    })

    expect(verdict.skipped).toContain(
      'write scope: no write data supplied, pass --writes',
    )
    expect(verdict.unchecked).toBe(3)
  })

  it('should skip the turn ceiling rather than pass it when no envelope is given', () => {
    seedCorrectTree()

    const verdict = checkExpectation(driftExpectation(), {
      sandboxDir: sandbox,
      writes: [TASKS],
    })

    expect(verdict.skipped).toContain(
      'turn ceiling: no envelope supplied, pass --envelope',
    )
  })

  it('should distinguish an absent write list from an empty one', () => {
    seedCorrectTree()

    const absent = checkExpectation(driftExpectation(), {
      sandboxDir: sandbox,
      envelope: CLEAN_ENVELOPE,
    })
    const empty = checkExpectation(driftExpectation(), {
      sandboxDir: sandbox,
      writes: [],
      envelope: CLEAN_ENVELOPE,
    })

    expect(absent.skipped).toHaveLength(1)
    expect(empty.skipped).toHaveLength(0)
  })
})

describe('resolveVerdict', () => {
  it('should report unchecked when no declaration exists', () => {
    const verdict = resolveVerdict(join(sandbox, 'expect.toml'), checkInput())

    expect(verdict.state).toBe('unchecked')
    expect(verdict.asserted).toBe(0)
  })

  it('should fail a declaration that carries only prose', () => {
    const file = join(sandbox, 'expect.toml')
    writeFileSync(file, 'manual = ["someone should read this"]\n')

    const verdict = resolveVerdict(file, checkInput())

    expect(verdict.state).toBe('fail')
    expect(verdict.unchecked).toBe(1)
  })

  it('should fail an empty declaration', () => {
    const file = join(sandbox, 'expect.toml')
    writeFileSync(file, '')

    expect(resolveVerdict(file, checkInput()).state).toBe('fail')
  })

  it('should fail a declaration that does not parse rather than throwing', () => {
    const file = join(sandbox, 'expect.toml')
    writeFileSync(file, 'paths = [unquoted\n')

    const verdict = resolveVerdict(file, checkInput())

    expect(verdict.state).toBe('fail')
    expect(verdict.results[0]?.message).toContain('does not parse')
  })

  it('should check a declaration carrying one mechanical assertion', () => {
    seedCorrectTree()
    const file = join(sandbox, 'expect.toml')
    writeFileSync(file, `absent = ["${PLANS_LIVE}"]\n`)

    expect(resolveVerdict(file, checkInput()).state).toBe('pass')
  })
})

describe('countMechanicalAssertions', () => {
  it('should exclude manual lines from the count', () => {
    const expectation = parseExpectation('manual = ["a", "b"]\n')

    expect(countMechanicalAssertions(expectation)).toBe(0)
  })

  it('should count each assertion kind', () => {
    const expectation = parseExpectation(
      'paths = ["a"]\nabsent = ["b"]\nwrite_scope = ["c/**"]\n\n[[content]]\npath = "d"\npattern = "e"\n',
    )

    expect(countMechanicalAssertions(expectation)).toBe(4)
  })
})

describe('parseExpectation', () => {
  it('should read a regex from a TOML literal string unescaped', () => {
    const expectation = parseExpectation(
      "[[content]]\npath = 'x.md'\npattern = '^- \\[x\\] done'\n",
    )

    expect(expectation.content[0]?.pattern).toBe('^- \\[x\\] done')
  })

  it('should drop a content entry missing its pattern', () => {
    const expectation = parseExpectation('[[content]]\npath = "x.md"\n')

    expect(expectation.content).toEqual([])
  })

  it('should default every key on an empty declaration', () => {
    const expectation = parseExpectation('')

    expect(expectation).toEqual({
      paths: [],
      absent: [],
      content: [],
      writeScope: [],
      manual: [],
      maxTurns: undefined,
    })
  })
})

describe('verdictExitCode', () => {
  it('should exit zero on an unchecked arm so a rollout stays usable', () => {
    expect(verdictExitCode('unchecked')).toBe(0)
  })

  it('should exit non-zero only on a failure', () => {
    expect(verdictExitCode('fail')).toBe(1)
    expect(verdictExitCode('pass')).toBe(0)
  })
})

describe('parseTarget', () => {
  it('should split a category and command', () => {
    expect(parseTarget('claude:docs')).toEqual({
      category: 'claude',
      command: 'docs',
    })
  })

  it('should reject a target with no separator', () => {
    expect(parseTarget('claude-docs')).toBeUndefined()
  })

  it('should reject a target with an empty half', () => {
    expect(parseTarget('claude:')).toBeUndefined()
    expect(parseTarget(':docs')).toBeUndefined()
  })

  it('should reject a target carrying more than one separator', () => {
    expect(parseTarget('claude:docs:drift')).toBeUndefined()
  })
})

describe('expectFilePath', () => {
  it('should resolve beside the numbered stage directories of the arm', () => {
    expect(expectFilePath('/root', 'claude', 'docs', 'drift')).toBe(
      '/root/scripts/sandbox/fixtures/claude/docs/drift/expect.toml',
    )
  })
})
