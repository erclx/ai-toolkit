import {
  chmodSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  applyChanges,
  listInstalled,
  planSync,
  runDomainSync,
  type SyncAdapter,
} from '@/sync/engine'

let ROOT: string
let SOURCE: string
let TARGET: string

function writeFixture(path: string, content: string): void {
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, content)
}

function createAdapter(overrides: Partial<SyncAdapter> = {}): SyncAdapter {
  return {
    banner: 'aitk test sync',
    label: 'rules',
    missingMessage: 'Nothing installed',
    unit: 'changes',
    installedRoot: (target: string) => join(target, '.claude', 'rules'),
    locateSource: (file) => join(SOURCE, file.relToRoot),
    ...overrides,
  }
}

let PREVIOUS_NON_INTERACTIVE: string | undefined

beforeEach(() => {
  ROOT = mkdtempSync(join(tmpdir(), 'aitk-engine-'))
  SOURCE = join(ROOT, 'source')
  TARGET = join(ROOT, 'target')
  PREVIOUS_NON_INTERACTIVE = process.env.AITK_NON_INTERACTIVE
  process.env.AITK_NON_INTERACTIVE = '1'
})

afterEach(() => {
  rmSync(ROOT, { recursive: true, force: true })
  if (PREVIOUS_NON_INTERACTIVE === undefined) {
    delete process.env.AITK_NON_INTERACTIVE
  } else {
    process.env.AITK_NON_INTERACTIVE = PREVIOUS_NON_INTERACTIVE
  }
})

describe('listInstalled', () => {
  it('should sort entries by path across nested directories', () => {
    writeFixture(join(TARGET, '.claude/rules/lang/100-ts.md'), 'a')
    writeFixture(join(TARGET, '.claude/rules/core/000-const.md'), 'b')

    const files = listInstalled(join(TARGET, '.claude/rules'), TARGET)

    expect(files.map((file) => file.relToRoot)).toEqual([
      'core/000-const.md',
      'lang/100-ts.md',
    ])
  })

  it('should include files inside dot directories', () => {
    writeFixture(join(TARGET, '.claude/rules/.hidden/900-x.md'), 'a')

    const files = listInstalled(join(TARGET, '.claude/rules'), TARGET)

    expect(files.map((file) => file.relToRoot)).toEqual(['.hidden/900-x.md'])
  })

  it('should report paths relative to the target', () => {
    writeFixture(join(TARGET, '.claude/rules/core/000-const.md'), 'a')

    const files = listInstalled(join(TARGET, '.claude/rules'), TARGET)

    expect(files[0].rel).toBe(join('.claude', 'rules', 'core', '000-const.md'))
  })

  it('should return an empty list when the root is absent', () => {
    expect(listInstalled(join(TARGET, '.claude/rules'), TARGET)).toEqual([])
  })
})

describe('planSync', () => {
  it('should classify an identical file as matching with no change', () => {
    writeFixture(join(SOURCE, 'core/000-const.md'), 'same\n')
    writeFixture(join(TARGET, '.claude/rules/core/000-const.md'), 'same\n')

    const plan = planSync(createAdapter(), TARGET)

    expect(plan.entries[0].state).toBe('matching')
    expect(plan.changes).toEqual([])
  })

  it('should classify a differing file as drifted and queue a copy', () => {
    writeFixture(join(SOURCE, 'core/000-const.md'), 'new\n')
    writeFixture(join(TARGET, '.claude/rules/core/000-const.md'), 'old\n')

    const plan = planSync(createAdapter(), TARGET)

    expect(plan.entries[0].state).toBe('drifted')
    expect(plan.changes).toEqual([
      {
        kind: 'copy',
        source: join(SOURCE, 'core/000-const.md'),
        dest: join(TARGET, '.claude/rules/core/000-const.md'),
        rel: join('.claude', 'rules', 'core', '000-const.md'),
      },
    ])
  })

  it('should leave a file with no source untouched', () => {
    writeFixture(join(TARGET, '.claude/rules/core/500-project.md'), 'local\n')

    const plan = planSync(createAdapter(), TARGET)

    expect(plan.entries[0].state).toBe('orphaned')
    expect(plan.changes).toEqual([])
  })

  it('should treat an undefined source lookup as orphaned', () => {
    writeFixture(join(TARGET, '.claude/rules/core/500-project.md'), 'local\n')

    const plan = planSync(
      createAdapter({ locateSource: () => undefined }),
      TARGET,
    )

    expect(plan.entries[0].state).toBe('orphaned')
  })

  it('should drop an excluded entry from the report entirely', () => {
    writeFixture(join(SOURCE, 'index.md'), 'source\n')
    writeFixture(join(TARGET, '.claude/rules/index.md'), 'stale\n')

    const plan = planSync(
      createAdapter({
        isExcluded: (file) => file.relToRoot === 'index.md',
      }),
      TARGET,
    )

    expect(plan.entries).toEqual([])
    expect(plan.changes).toEqual([])
  })

  it('should keep classifying entries the exclusion does not match', () => {
    writeFixture(join(SOURCE, 'index.md'), 'source\n')
    writeFixture(join(TARGET, '.claude/rules/index.md'), 'stale\n')
    writeFixture(join(SOURCE, 'core/000-const.md'), 'new\n')
    writeFixture(join(TARGET, '.claude/rules/core/000-const.md'), 'old\n')

    const plan = planSync(
      createAdapter({
        isExcluded: (file) => file.relToRoot === 'index.md',
      }),
      TARGET,
    )

    expect(plan.entries.map((entry) => entry.state)).toEqual(['drifted'])
  })

  it('should queue a delete for each retired surface', () => {
    writeFixture(join(TARGET, '.claude/GOV.md'), 'retired\n')

    const plan = planSync(
      createAdapter({
        collectRetired: (target) => [
          {
            path: join(target, '.claude/GOV.md'),
            rel: join('.claude', 'GOV.md'),
            notice: 'retired',
          },
        ],
      }),
      TARGET,
    )

    expect(plan.changes).toEqual([
      {
        kind: 'delete',
        dest: join(TARGET, '.claude/GOV.md'),
        rel: join('.claude', 'GOV.md'),
      },
    ])
  })

  it('should order retired deletes after file copies', () => {
    writeFixture(join(SOURCE, 'core/000-const.md'), 'new\n')
    writeFixture(join(TARGET, '.claude/rules/core/000-const.md'), 'old\n')
    writeFixture(join(TARGET, '.claude/GOV.md'), 'retired\n')

    const plan = planSync(
      createAdapter({
        collectRetired: (target) => [
          {
            path: join(target, '.claude/GOV.md'),
            rel: join('.claude', 'GOV.md'),
            notice: 'retired',
          },
        ],
      }),
      TARGET,
    )

    expect(plan.changes.map((change) => change.kind)).toEqual([
      'copy',
      'delete',
    ])
  })
})

describe('applyChanges', () => {
  it('should overwrite a drifted destination with its source', async () => {
    writeFixture(join(SOURCE, 'core/000-const.md'), 'new\n')
    writeFixture(join(TARGET, '.claude/rules/core/000-const.md'), 'old\n')
    const plan = planSync(createAdapter(), TARGET)

    await applyChanges(plan.changes)

    expect(
      readFileSync(join(TARGET, '.claude/rules/core/000-const.md'), 'utf8'),
    ).toBe('new\n')
  })

  it('should create missing parent directories for a copy', async () => {
    writeFixture(join(SOURCE, 'core/000-const.md'), 'new\n')
    const dest = join(TARGET, '.claude/rules/core/000-const.md')

    await applyChanges([
      {
        kind: 'copy',
        source: join(SOURCE, 'core/000-const.md'),
        dest,
        rel: 'x',
      },
    ])

    expect(readFileSync(dest, 'utf8')).toBe('new\n')
  })

  it('should leave an existing destination mode alone', async () => {
    writeFixture(join(SOURCE, 'core/000-const.md'), 'new\n')
    const dest = join(TARGET, '.claude/rules/core/000-const.md')
    writeFixture(dest, 'old\n')
    chmodSync(dest, 0o600)

    await applyChanges(planSync(createAdapter(), TARGET).changes)

    expect(statSync(dest).mode & 0o777).toBe(0o600)
  })

  it('should not strip an executable bit the destination carries', async () => {
    writeFixture(join(SOURCE, 'core/000-const.md'), 'new\n')
    const dest = join(TARGET, '.claude/rules/core/000-const.md')
    writeFixture(dest, 'old\n')
    chmodSync(dest, 0o755)

    await applyChanges(planSync(createAdapter(), TARGET).changes)

    expect(statSync(dest).mode & 0o777).toBe(0o755)
  })

  it('should remove a retired surface', async () => {
    const path = join(TARGET, '.claude/GOV.md')
    writeFixture(path, 'retired\n')

    await applyChanges([{ kind: 'delete', dest: path, rel: 'x' }])

    expect(existsSync(path)).toBe(false)
  })

  it('should ignore a delete whose target is already gone', async () => {
    const path = join(TARGET, '.claude/GOV.md')

    await expect(
      applyChanges([{ kind: 'delete', dest: path, rel: 'x' }]),
    ).resolves.toBeUndefined()
  })
})

describe('runDomainSync', () => {
  const options = { protectedRoot: '/nowhere' }

  it('should apply drift in a headless run when no policy is set', async () => {
    writeFixture(join(SOURCE, 'core/000-const.md'), 'new\n')
    const dest = join(TARGET, '.claude/rules/core/000-const.md')
    writeFixture(dest, 'old\n')

    const code = await runDomainSync(createAdapter(), TARGET, options)

    expect(code).toBe(0)
    expect(readFileSync(dest, 'utf8')).toBe('new\n')
  })

  it('should write nothing in a headless run when the policy refuses', async () => {
    writeFixture(join(SOURCE, 'core/000-const.md'), 'new\n')
    const dest = join(TARGET, '.claude/rules/core/000-const.md')
    writeFixture(dest, 'old\n')

    const code = await runDomainSync(
      createAdapter({
        nonInteractive: { kind: 'refuse', message: 'refused', hint: 'run it' },
      }),
      TARGET,
      options,
    )

    expect(code).toBe(0)
    expect(readFileSync(dest, 'utf8')).toBe('old\n')
  })

  it('should skip the completion hook when the policy refuses', async () => {
    writeFixture(join(SOURCE, 'core/000-const.md'), 'new\n')
    writeFixture(join(TARGET, '.claude/rules/core/000-const.md'), 'old\n')
    let fired = false

    await runDomainSync(
      createAdapter({
        nonInteractive: { kind: 'refuse', message: 'refused', hint: 'run it' },
        onComplete: async () => {
          fired = true
        },
      }),
      TARGET,
      options,
    )

    expect(fired).toBe(false)
  })

  it('should run the completion hook when there are no changes', async () => {
    writeFixture(join(SOURCE, 'core/000-const.md'), 'same\n')
    writeFixture(join(TARGET, '.claude/rules/core/000-const.md'), 'same\n')
    let fired = false

    const code = await runDomainSync(
      createAdapter({
        onComplete: async () => {
          fired = true
        },
      }),
      TARGET,
      options,
    )

    expect(code).toBe(0)
    expect(fired).toBe(true)
  })

  it('should run the completion hook after applying changes', async () => {
    writeFixture(join(SOURCE, 'core/000-const.md'), 'new\n')
    const dest = join(TARGET, '.claude/rules/core/000-const.md')
    writeFixture(dest, 'old\n')
    let contentAtHook = ''

    await runDomainSync(
      createAdapter({
        onComplete: async () => {
          contentAtHook = readFileSync(dest, 'utf8')
        },
      }),
      TARGET,
      options,
    )

    expect(contentAtHook).toBe('new\n')
  })

  it('should refuse to run against the protected root', async () => {
    mkdirSync(TARGET, { recursive: true })

    const code = await runDomainSync(createAdapter(), TARGET, {
      protectedRoot: TARGET,
    })

    expect(code).toBe(1)
  })
})
