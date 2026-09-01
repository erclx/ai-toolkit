import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  collisions,
  destinationPath,
  ignoresDestination,
  isExcludedPath,
  MOVED_ENTRIES,
  planFolderMoves,
  planRecordsMove,
  rewriteText,
  scanText,
  sourcePath,
} from '@/migrate/records'

let root: string

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'canon-records-migrate-'))
})

afterEach(() => {
  rmSync(root, { recursive: true, force: true })
})

describe('MOVED_ENTRIES', () => {
  it('should carry the twelve ignore entries the move collapsed', () => {
    expect(MOVED_ENTRIES).toHaveLength(12)
  })

  it('should leave the worktrees folder where the harness requires it', () => {
    expect(MOVED_ENTRIES).not.toContain('worktrees')
  })

  it('should leave every committed surface out', () => {
    for (const kept of ['context', 'rules', 'skills', 'hooks', 'canon']) {
      expect(MOVED_ENTRIES).not.toContain(kept)
    }
  })
})

describe('destinationPath', () => {
  it('should drop the scratch folder dot at the new root', () => {
    expect(destinationPath('.tmp')).toBe('.canon/tmp')
  })

  it('should keep the history directory dot, which marks a mechanism', () => {
    expect(destinationPath('.records.git')).toBe('.canon/.records.git')
  })

  it('should carry every other name through unchanged', () => {
    expect(destinationPath('memory')).toBe('.canon/memory')
  })
})

describe('rewriteText', () => {
  it('should rewrite a citation carrying a trailing path', () => {
    expect(rewriteText('see `.claude/plans/feature-x.md` for it')).toBe(
      'see `.canon/plans/feature-x.md` for it',
    )
  })

  it('should rewrite a bare folder citation with no trailing slash', () => {
    expect(rewriteText('the board lives at .claude/tasks')).toBe(
      'the board lives at .canon/tasks',
    )
  })

  it('should rename the scratch folder as it moves it', () => {
    expect(rewriteText('.claude/.tmp/gov/rules.md')).toBe(
      '.canon/tmp/gov/rules.md',
    )
  })

  it('should leave a committed folder alone', () => {
    const text = '.claude/context/index.md and .claude/rules/core/005.md'
    expect(rewriteText(text)).toBe(text)
  })

  it('should leave the worktrees carve-out alone', () => {
    expect(rewriteText('.claude/worktrees/<name>/')).toBe(
      '.claude/worktrees/<name>/',
    )
  })

  it('should leave a retired flat archive at the root it actually sat under', () => {
    const text = '.claude/plans-archive/ and .claude/task-archive/'
    expect(rewriteText(text)).toBe(text)
  })

  it('should leave a marked line alone', () => {
    const text = 'a fallback <!-- canon-keep-record-root --> .claude/memory/'
    expect(rewriteText(text)).toBe(text)
  })

  it('should leave the line below a marker alone', () => {
    const text = '<!-- canon-keep-record-root -->\n.claude/memory/x.md'
    expect(rewriteText(text)).toBe(text)
  })

  it('should resume rewriting two lines below a marker', () => {
    const text =
      '<!-- canon-keep-record-root -->\n.claude/memory/a.md\n.claude/memory/b.md'
    expect(rewriteText(text)).toBe(
      '<!-- canon-keep-record-root -->\n.claude/memory/a.md\n.canon/memory/b.md',
    )
  })

  it('should be idempotent over an already-swept tree', () => {
    const once = rewriteText('.claude/plans/x.md and .claude/.tmp/y')
    expect(rewriteText(once)).toBe(once)
  })
})

describe('scanText', () => {
  it('should count what it would rewrite', () => {
    expect(scanText('.claude/plans/a.md .claude/tasks/b.md').rewritten).toBe(2)
  })

  it('should count a marked citation as kept rather than rewritten', () => {
    const counts = scanText('.claude/memory/a.md canon-keep-record-root')
    expect(counts).toEqual({ rewritten: 0, kept: 1 })
  })

  it('should count nothing in prose naming no moved entry', () => {
    expect(scanText('.claude/rules/core/005.md')).toEqual({
      rewritten: 0,
      kept: 0,
    })
  })
})

describe('isExcludedPath', () => {
  it('should exclude the changelog, which records what shipped', () => {
    expect(isExcludedPath('CHANGELOG.md')).toBe(true)
  })

  it('should exclude the module stating the roots', () => {
    expect(isExcludedPath('src/record-root.ts')).toBe(true)
  })

  it('should exclude its own source', () => {
    expect(isExcludedPath('src/migrate/records.ts')).toBe(true)
  })

  it('should exclude a test asserting the old root still resolves', () => {
    expect(isExcludedPath('src/tasks/archive.test.ts')).toBe(true)
  })

  it('should exclude an eval transcript', () => {
    expect(isExcludedPath('scripts/eval/result-2026-08-20.md')).toBe(true)
  })

  it('should sweep an ordinary shipped body', () => {
    expect(isExcludedPath('claude/skills/claude-autoship/SKILL.md')).toBe(false)
  })
})

describe('planFolderMoves', () => {
  it('should name only the entries on disk', () => {
    mkdirSync(join(root, '.claude', 'plans'), { recursive: true })
    mkdirSync(join(root, '.claude', 'memory'), { recursive: true })

    expect(planFolderMoves(root)).toEqual([
      { from: '.claude/memory', to: '.canon/memory' },
      { from: '.claude/plans', to: '.canon/plans' },
    ])
  })

  it('should carry the scratch rename into the plan', () => {
    mkdirSync(join(root, '.claude', '.tmp'), { recursive: true })

    expect(planFolderMoves(root)).toEqual([
      { from: '.claude/.tmp', to: '.canon/tmp' },
    ])
  })

  it('should leave the worktrees folder out of the plan', () => {
    mkdirSync(join(root, '.claude', 'worktrees'), { recursive: true })

    expect(planFolderMoves(root)).toEqual([])
  })

  it('should plan nothing for a tree that has already moved', () => {
    mkdirSync(join(root, '.canon', 'plans'), { recursive: true })

    expect(planFolderMoves(root)).toEqual([])
  })
})

describe('collisions', () => {
  it('should name a destination the new root already carries', () => {
    mkdirSync(join(root, '.claude', 'memory'), { recursive: true })
    mkdirSync(join(root, '.canon', 'memory'), { recursive: true })

    expect(collisions(root, planFolderMoves(root))).toEqual(['.canon/memory'])
  })

  it('should name nothing when the new root is empty', () => {
    mkdirSync(join(root, '.claude', 'memory'), { recursive: true })

    expect(collisions(root, planFolderMoves(root))).toEqual([])
  })
})

describe('ignoresDestination', () => {
  it('should read the root entry with its trailing slash', () => {
    expect(ignoresDestination('node_modules/\n.canon/\n')).toBe(true)
  })

  it('should read it without one', () => {
    expect(ignoresDestination('.canon')).toBe(true)
  })

  it('should refuse a file that only ignores the old folders', () => {
    expect(ignoresDestination('.claude/plans/\n.claude/tasks/\n')).toBe(false)
  })

  it('should not accept a deeper entry as covering the root', () => {
    expect(ignoresDestination('.canon/memory/\n')).toBe(false)
  })
})

describe('sourcePath', () => {
  it('should spell the old root', () => {
    expect(sourcePath('tasks')).toBe('.claude/tasks')
  })

  it('should keep the scratch dot on the way out', () => {
    expect(sourcePath('.tmp')).toBe('.claude/.tmp')
  })

  it('should write into the tree the move reads', () => {
    mkdirSync(join(root, sourcePath('memory')), { recursive: true })
    writeFileSync(join(root, sourcePath('memory'), 'a.md'), 'x')

    expect(planFolderMoves(root)).toEqual([
      { from: '.claude/memory', to: '.canon/memory' },
    ])
  })
})

describe('planRecordsMove', () => {
  it('should carry a file whose citations move', () => {
    const plan = planRecordsMove(root, [
      { path: 'docs/a.md', text: 'see .claude/plans/x.md' },
    ])

    expect(plan.entries).toEqual([
      {
        path: 'docs/a.md',
        text: 'see .canon/plans/x.md',
        rewritten: 1,
        kept: 0,
      },
    ])
    expect(plan.rewritten).toBe(1)
  })

  it('should drop a file whose text does not change', () => {
    const plan = planRecordsMove(root, [
      { path: 'docs/a.md', text: 'see .claude/rules/core/005.md' },
    ])

    expect(plan.entries).toEqual([])
  })

  it('should report an excluded file only when it carries a citation', () => {
    const plan = planRecordsMove(root, [
      { path: 'CHANGELOG.md', text: 'shipped .claude/plans/x.md' },
      { path: 'src/a.test.ts', text: 'no record path here' },
    ])

    expect(plan.excluded).toEqual(['CHANGELOG.md'])
  })

  it('should count a marked citation without carrying the file', () => {
    const plan = planRecordsMove(root, [
      { path: 'docs/a.md', text: '.claude/memory/a.md canon-keep-record-root' },
    ])

    expect(plan.entries).toEqual([])
    expect(plan.kept).toBe(1)
  })

  it('should read the folder moves off disk beside the citations', () => {
    mkdirSync(join(root, '.claude', 'plans'), { recursive: true })

    const plan = planRecordsMove(root, [])

    expect(plan.moves).toEqual([{ from: '.claude/plans', to: '.canon/plans' }])
    expect(plan.collisions).toEqual([])
  })
})
