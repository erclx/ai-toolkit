import { mkdir, mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import type { GitRunner, PullRequestOpener } from '@/sync/git'
import { collectChanges, runGitWorkflow } from '@/sync/workflow'

const NOW = new Date(2026, 6, 29, 12, 42, 0)

const dirs: string[] = []

interface FakeGit extends GitRunner {
  readonly calls: string[]
}

interface FakeOptions {
  readonly status?: Record<string, string>
  readonly branch?: string
  readonly localTaken?: boolean
  readonly remoteTaken?: boolean
}

function makeGit(options: FakeOptions = {}): FakeGit {
  const calls: string[] = []
  const status = options.status ?? {}

  return {
    calls,
    status: async (paths) => status[paths.join(',')] ?? '',
    currentBranch: async () => options.branch ?? 'main',
    branchExists: async () => options.localTaken ?? false,
    remoteBranchExists: async () => options.remoteTaken ?? false,
    createBranch: async (name) => {
      calls.push(`createBranch ${name}`)
    },
    stage: async (paths) => {
      calls.push(`stage ${paths.join(' ')}`)
    },
    commit: async (message) => {
      calls.push(`commit ${message}`)
    },
    push: async (branch) => {
      calls.push(`push ${branch}`)
    },
  }
}

function makeOpener(calls: string[]): PullRequestOpener {
  return {
    create: async (title) => {
      calls.push(`pr ${title}`)
      return 'https://example.test/pr/1'
    },
  }
}

async function makeRepo(): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), 'aitk-sync-workflow-'))
  dirs.push(dir)
  await mkdir(join(dir, '.git'), { recursive: true })
  return dir
}

const DRIFTED_STANDARDS = {
  '.claude/standards/': ' M .claude/standards/prose.md\n',
}

afterEach(async () => {
  await Promise.all(
    dirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })),
  )
})

describe('collectChanges', () => {
  it('should report one entry per domain with pending changes', async () => {
    const git = makeGit({
      status: {
        '.claude/standards/': ' M .claude/standards/prose.md\n',
        '.gitignore': '?? .gitignore\n',
      },
    })

    const changes = await collectChanges(git)

    expect(changes).toEqual([
      {
        domain: 'standards',
        verb: 'Update',
        names: ['prose.md'],
        paths: ['.claude/standards/prose.md'],
      },
      {
        domain: 'claude',
        verb: 'Add',
        names: ['.gitignore'],
        paths: ['.gitignore'],
      },
    ])
  })

  it('should report nothing when no domain changed', async () => {
    expect(await collectChanges(makeGit())).toEqual([])
  })
})

describe('runGitWorkflow', () => {
  it('should do nothing when the target is not a git root', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'aitk-sync-workflow-'))
    dirs.push(dir)
    const git = makeGit({ status: DRIFTED_STANDARDS })

    const code = await runGitWorkflow(dir, {
      git,
      pullRequests: undefined,
      now: NOW,
      nonInteractive: false,
    })

    expect(code).toBe(0)
    expect(git.calls).toEqual([])
  })

  it('should do nothing when the syncs changed no files', async () => {
    const target = await makeRepo()
    const git = makeGit()

    const code = await runGitWorkflow(target, {
      git,
      pullRequests: undefined,
      now: NOW,
      nonInteractive: false,
    })

    expect(code).toBe(0)
    expect(git.calls).toEqual([])
  })

  it('should refuse to commit when the branch already exists locally', async () => {
    const target = await makeRepo()
    const git = makeGit({ status: DRIFTED_STANDARDS, localTaken: true })

    const code = await runGitWorkflow(target, {
      git,
      pullRequests: undefined,
      now: NOW,
      nonInteractive: false,
    })

    expect(code).toBe(0)
    expect(git.calls).toEqual([])
  })

  it('should refuse to commit when the branch already exists on the remote', async () => {
    const target = await makeRepo()
    const git = makeGit({ status: DRIFTED_STANDARDS, remoteTaken: true })

    const code = await runGitWorkflow(target, {
      git,
      pullRequests: undefined,
      now: NOW,
      nonInteractive: false,
    })

    expect(code).toBe(0)
    expect(git.calls).toEqual([])
  })

  it('should refuse the git workflow entirely under AITK_NON_INTERACTIVE', async () => {
    const target = await makeRepo()
    const git = makeGit({ status: DRIFTED_STANDARDS })
    const prCalls: string[] = []

    const code = await runGitWorkflow(target, {
      git,
      pullRequests: makeOpener(prCalls),
      now: NOW,
      nonInteractive: true,
    })

    expect(code).toBe(0)
    expect(git.calls).toEqual([])
    expect(prCalls).toEqual([])
  })

  it('should not open a pull request headlessly even on a feature branch', async () => {
    const target = await makeRepo()
    const git = makeGit({ status: DRIFTED_STANDARDS, branch: 'feat/x' })
    const prCalls: string[] = []

    await runGitWorkflow(target, {
      git,
      pullRequests: makeOpener(prCalls),
      now: NOW,
      nonInteractive: true,
    })

    expect(prCalls).toEqual([])
  })
})
