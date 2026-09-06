import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { PROJECT_ROOT } from '@/project-root'
import { injectGitignore } from '@/tooling/inject'
import { resolveChain } from '@/tooling/manifest'

let target: string

beforeEach(() => {
  target = mkdtempSync(join(tmpdir(), 'canon-inject-'))
})

afterEach(() => {
  rmSync(target, { recursive: true, force: true })
})

describe('injectGitignore', () => {
  it('should resolve the web chain and add the screenshots entry to a target .gitignore', async () => {
    const chain = resolveChain(PROJECT_ROOT, 'web')

    const added = await injectGitignore(chain, target)

    expect(added).toContain('screenshots/')
    expect(readFileSync(join(target, '.gitignore'), 'utf8')).toContain(
      'screenshots/',
    )
  })
})
