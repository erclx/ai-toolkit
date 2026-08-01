import { execFileSync } from 'node:child_process'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

const LIB = join(import.meta.dirname, '../scripts/lib/worktree.sh')

let root: string

// Every inherited GIT_* var is dropped before the fixtures are built. A git hook
// exports GIT_DIR, so a run under pre-push would otherwise resolve `git -C
// real-bare.git` against the toolkit's own repository and the genuinely-bare case
// would pass for the wrong reason. Isolating config also drops the commit
// identity, hence the ident vars.
const gitFreeEnv = (): NodeJS.ProcessEnv =>
  Object.fromEntries(
    Object.entries(process.env).filter(([key]) => !key.startsWith('GIT_')),
  )

const sh = (script: string): string =>
  execFileSync('bash', ['-c', script], {
    cwd: root,
    encoding: 'utf8',
    env: {
      ...gitFreeEnv(),
      GIT_AUTHOR_EMAIL: 'test@example.com',
      GIT_AUTHOR_NAME: 'test',
      GIT_COMMITTER_EMAIL: 'test@example.com',
      GIT_COMMITTER_NAME: 'test',
      GIT_CONFIG_GLOBAL: '/dev/null',
      GIT_CONFIG_SYSTEM: '/dev/null',
    },
  })

// `log_warn` lives in ui.sh, which guards the bash version on source. Stubbing it
// keeps the subject under test to the guard rather than the UI layer.
const repair = (target: string): string =>
  sh(
    `log_warn() { echo "WARN:$1"; }; source ${LIB}; repair_bare_flag ${target}`,
  )

const bareFlag = (target: string): string =>
  sh(`git -C ${target} config --get core.bare 2>/dev/null || echo unset`).trim()

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'worktree-repair-'))
  sh('git init -q repo')
  sh('git -C repo commit -q --allow-empty -m init')
  sh('git -C repo worktree add -q ../linked -b linked')
})

afterEach(() => {
  rmSync(root, { force: true, recursive: true })
})

describe('repair_bare_flag', () => {
  it('should leave a healthy repository untouched', () => {
    expect(repair('repo')).toBe('')
    expect(bareFlag('repo')).toBe('false')
  })

  it('should clear the flag when run from the main worktree', () => {
    sh('git -C repo config core.bare true')

    expect(repair('repo')).toContain('WARN:Repaired core.bare')
    expect(bareFlag('repo')).toBe('false')
  })

  it("should clear the parent's flag when run from a linked worktree", () => {
    sh('git -C repo config core.bare true')

    expect(repair('linked')).toContain('WARN:Repaired core.bare')
    expect(bareFlag('repo')).toBe('false')
  })

  it('should restore a stranded main worktree to a usable state', () => {
    sh('git -C repo config core.bare true')
    repair('linked')

    expect(sh('git -C repo status --short; echo ok').trim()).toBe('ok')
  })

  it('should leave a genuinely bare repository alone', () => {
    sh('git init -q --bare real-bare.git')

    expect(repair('real-bare.git')).toBe('')
    expect(bareFlag('real-bare.git')).toBe('true')
  })

  it('should return cleanly outside a git repository', () => {
    sh('mkdir plain')

    expect(repair('plain')).toBe('')
  })
})
