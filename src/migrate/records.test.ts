import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  collisions,
  destinationPath,
  ignoresDestination,
  isExcludedPath,
  isRecordArtifact,
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

describe('isRecordArtifact', () => {
  it('should read the whole new root as records', () => {
    expect(isRecordArtifact('.canon/memory/user-erclx.md')).toBe(true)
  })

  it('should read a new-root folder the entry list has never heard of', () => {
    expect(isRecordArtifact('.canon/unheard-of/a.md')).toBe(true)
  })

  it('should read the new root named bare', () => {
    expect(isRecordArtifact('.canon')).toBe(true)
  })

  it('should read the backup history under the new root', () => {
    expect(isRecordArtifact('.canon/.records.git/objects/ab/0123')).toBe(true)
  })

  it('should read an old-root record folder per entry', () => {
    expect(isRecordArtifact('.claude/plans/feature-x.md')).toBe(true)
  })

  it('should read the old-root scratch folder at its own spelling', () => {
    expect(isRecordArtifact('.claude/.tmp/gov/rules.md')).toBe(true)
  })

  it('should sweep a committed file under the old root', () => {
    expect(isRecordArtifact('.claude/rules/core/035-tasks.md')).toBe(false)
  })

  it('should sweep every other committed surface under the old root', () => {
    for (const path of [
      '.claude/context/index.md',
      '.claude/skills/internal-scripts/SKILL.md',
      '.claude/hooks/scratch-guard.sh',
      '.claude/ARCHITECTURE.md',
      '.claude/settings.json',
    ]) {
      expect(isRecordArtifact(path)).toBe(false)
    }
  })

  it('should sweep the worktrees carve-out the harness owns', () => {
    expect(isRecordArtifact('.claude/worktrees/a/src/x.ts')).toBe(false)
  })

  it('should sweep a retired flat archive, which sat outside the entries', () => {
    expect(isRecordArtifact('.claude/plans-archive/feature-x.md')).toBe(false)
  })

  it('should not take an entry name as a prefix of a longer folder', () => {
    expect(isRecordArtifact('.claude/tasks-board/a.md')).toBe(false)
  })

  it('should sweep an ordinary source file', () => {
    expect(isRecordArtifact('src/migrate/apply.ts')).toBe(false)
  })

  it('should sweep a fixture whose path merely contains a record folder', () => {
    expect(
      isRecordArtifact('scripts/sandbox/fixtures/create/.claude/tasks/a.md'),
    ).toBe(false)
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

  it('should leave a record under the old root out of the plan entirely', () => {
    const plan = planRecordsMove(root, [
      { path: '.claude/memory/user-erclx.md', text: 'see .claude/plans/x.md' },
    ])

    expect(plan.entries).toEqual([])
    expect(plan.excluded).toEqual([])
    expect(plan.rewritten).toBe(0)
  })

  it('should leave a record under the new root out of the plan entirely', () => {
    const plan = planRecordsMove(root, [
      { path: '.canon/tasks/v1.0-a.md', text: 'the board was .claude/tasks' },
    ])

    expect(plan.entries).toEqual([])
    expect(plan.excluded).toEqual([])
    expect(plan.rewritten).toBe(0)
  })

  it('should not count a marked citation inside a record it never read', () => {
    const plan = planRecordsMove(root, [
      {
        path: '.canon/memory/a.md',
        text: '.claude/memory/a.md canon-keep-record-root',
      },
    ])

    expect(plan.kept).toBe(0)
  })

  it('should still sweep an installed rule beside the records it repoints', () => {
    const plan = planRecordsMove(root, [
      { path: '.claude/memory/a.md', text: 'see .claude/tasks/b.md' },
      { path: '.claude/rules/core/035-tasks.md', text: '.claude/tasks/ is it' },
    ])

    expect(plan.entries.map((entry) => entry.path)).toEqual([
      '.claude/rules/core/035-tasks.md',
    ])
    expect(plan.rewritten).toBe(1)
  })

  it('should read the folder moves off disk beside the citations', () => {
    mkdirSync(join(root, '.claude', 'plans'), { recursive: true })

    const plan = planRecordsMove(root, [])

    expect(plan.moves).toEqual([{ from: '.claude/plans', to: '.canon/plans' }])
    expect(plan.collisions).toEqual([])
  })
})
