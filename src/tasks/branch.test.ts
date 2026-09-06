import { mkdirSync, mkdtempSync, rmSync } from 'node:fs'
import { writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { type BranchOutcome, planBranch } from '@/tasks/branch'

let ROOT: string

const BODY = [
  '# Feature: A plan under test',
  '',
  '**Files to touch:**',
  '',
  '- `src/a.ts`: the thing.',
  '',
].join('\n')

async function writePlan(slug: string, folder = 'plans'): Promise<string> {
  const dir = join(ROOT, '.canon', ...folder.split('/'))
  mkdirSync(dir, { recursive: true })
  const path = join(dir, `feature-${slug}.md`)
  await writeFile(path, BODY, 'utf8')

  return path
}

function assertOk(
  outcome: BranchOutcome,
): asserts outcome is Extract<BranchOutcome, { ok: true }> {
  expect(outcome.ok).toBe(true)
}

beforeEach(() => {
  ROOT = mkdtempSync(join(tmpdir(), 'plan-branch-'))
  mkdirSync(join(ROOT, '.canon', 'plans'), { recursive: true })
  mkdirSync(join(ROOT, '.canon', 'tasks'), { recursive: true })
})

afterEach(() => {
  rmSync(ROOT, { recursive: true, force: true })
})

describe('planBranch', () => {
  it('should derive the branch string from a bare slug', async () => {
    await writePlan('dispatch-branch-derivation')

    const outcome = planBranch(ROOT, 'dispatch-branch-derivation')

    assertOk(outcome)
    expect(outcome.branch).toBe('feat/dispatch-branch-derivation')
  })

  it('should report the type and the slug apart from the branch', async () => {
    await writePlan('dispatch-branch-derivation')

    const outcome = planBranch(ROOT, 'dispatch-branch-derivation')

    assertOk(outcome)
    expect(outcome.type).toBe('feat')
    expect(outcome.slug).toBe('dispatch-branch-derivation')
  })

  it('should answer a root-relative path with the same branch a slug gives', async () => {
    await writePlan('dispatch-branch-derivation')

    const outcome = planBranch(
      ROOT,
      '.canon/plans/feature-dispatch-branch-derivation.md',
    )

    assertOk(outcome)
    expect(outcome.branch).toBe('feat/dispatch-branch-derivation')
    expect(outcome.plan).toBe(
      join('.canon', 'plans', 'feature-dispatch-branch-derivation.md'),
    )
  })

  it('should answer the board-relative link a task row writes', async () => {
    await writePlan('dispatch-branch-derivation')

    const outcome = planBranch(
      ROOT,
      '../plans/feature-dispatch-branch-derivation.md',
    )

    assertOk(outcome)
    expect(outcome.branch).toBe('feat/dispatch-branch-derivation')
  })

  it('should refuse a plan sitting in the archive as already shipped', async () => {
    await writePlan('gate', 'plans/archive')

    const outcome = planBranch(ROOT, '.canon/plans/archive/feature-gate.md')

    expect(outcome.ok).toBe(false)
    expect(outcome.ok === false && outcome.reason).toBe('archived')
  })

  it('should refuse a reference that resolves to no file', () => {
    const outcome = planBranch(ROOT, 'absent')

    expect(outcome.ok).toBe(false)
    expect(outcome.ok === false && outcome.reason).toBe('no-plan')
  })

  it('should refuse an empty reference as bad input rather than as a missing plan', () => {
    const outcome = planBranch(ROOT, '  ')

    expect(outcome.ok).toBe(false)
    expect(outcome.ok === false && outcome.reason).toBe('bad-input')
  })

  it('should conform a two-word description', async () => {
    await writePlan('branch-derivation')

    const outcome = planBranch(ROOT, 'branch-derivation')

    assertOk(outcome)
    expect(outcome.words).toBe(2)
    expect(outcome.conforms).toBe(true)
  })

  it('should conform a three-word description', async () => {
    await writePlan('dispatch-branch-derivation')

    const outcome = planBranch(ROOT, 'dispatch-branch-derivation')

    assertOk(outcome)
    expect(outcome.words).toBe(3)
    expect(outcome.conforms).toBe(true)
  })

  it('should conform a four-word description, which the amended cap admits', async () => {
    await writePlan('one-dispatch-branch-derivation')

    const outcome = planBranch(ROOT, 'one-dispatch-branch-derivation')

    assertOk(outcome)
    expect(outcome.words).toBe(4)
    expect(outcome.conforms).toBe(true)
  })

  it('should report a five-word description as non-conforming', async () => {
    await writePlan('one-more-dispatch-branch-derivation')

    const outcome = planBranch(ROOT, 'one-more-dispatch-branch-derivation')

    assertOk(outcome)
    expect(outcome.words).toBe(5)
    expect(outcome.conforms).toBe(false)
  })

  it('should report a branch past the length cap as non-conforming', async () => {
    const slug = 'extraordinarily-elongated-nonconforming-description'
    await writePlan(slug)

    const outcome = planBranch(ROOT, slug)

    assertOk(outcome)
    expect(outcome.words).toBe(4)
    expect(outcome.branch.length).toBeGreaterThan(50)
    expect(outcome.conforms).toBe(false)
  })
})
