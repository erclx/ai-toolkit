import { execaSync } from 'execa'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { gitEnv } from '@/git-env'
import { listWorktrees } from '@/worktree'

let ROOT: string

function git(...args: string[]): string {
  return execaSync('git', ['-C', ROOT, ...args], {
    env: gitEnv(),
    extendEnv: false,
  }).stdout
}

beforeEach(() => {
  ROOT = mkdtempSync(join(tmpdir(), 'aitk-worktree-list-'))
  git('init', '--quiet', '--initial-branch=main')
  git('config', 'user.email', 'test@example.com')
  git('config', 'user.name', 'Test')
  git('commit', '--quiet', '--allow-empty', '-m', 'init')
})

afterEach(() => {
  rmSync(ROOT, { recursive: true, force: true })
})

describe('listWorktrees', () => {
  it('should report the branch a linked worktree holds', async () => {
    git('worktree', 'add', '--quiet', '-b', 'feat/parser', 'wt-linked')

    const entries = await listWorktrees(ROOT)

    expect(entries).toContainEqual(
      expect.objectContaining({
        path: join(ROOT, 'wt-linked'),
        branch: 'feat/parser',
      }),
    )
  })

  it('should report a detached worktree as holding no branch', async () => {
    git('worktree', 'add', '--quiet', '--detach', 'wt-detached')

    const entries = await listWorktrees(ROOT)
    const detached = entries.find((entry) => entry.path.endsWith('wt-detached'))

    expect(detached?.branch).toBeNull()
  })

  it('should report the main worktree among the entries', async () => {
    const entries = await listWorktrees(ROOT)

    expect(entries).toContainEqual({ path: ROOT, branch: 'main' })
  })

  it('should report no worktree outside a git repository', async () => {
    const notARepo = mkdtempSync(join(tmpdir(), 'aitk-worktree-none-'))

    try {
      expect(await listWorktrees(notARepo)).toEqual([])
    } finally {
      rmSync(notARepo, { recursive: true, force: true })
    }
  })
})
