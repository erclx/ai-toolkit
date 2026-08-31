import { describe, expect, it } from 'vitest'
import {
  isExcludedPath,
  renamePath,
  renameText,
  scanText,
} from '@/migrate/rename'

describe('renameText', () => {
  it('should rewrite the lowercase token', () => {
    expect(renameText('run aitk gov sync')).toBe('run canon gov sync')
  })

  it('should rewrite the uppercase token so an environment prefix moves with it', () => {
    expect(renameText('AITK_NON_INTERACTIVE=1')).toBe('CANON_NON_INTERACTIVE=1')
  })

  it('should rewrite the title-case token', () => {
    expect(renameText('# Aitk operator')).toBe('# Canon operator')
  })

  it('should rewrite every spelling in one pass', () => {
    expect(renameText('aitk AITK Aitk')).toBe('canon CANON Canon')
  })

  it('should rewrite the scoped package name', () => {
    expect(renameText('@erclx/aitk')).toBe('@erclx/canon')
  })

  it('should rewrite the repository slug, which moved with the repository', () => {
    expect(renameText('gh pr list --repo erclx/aitk')).toBe(
      'gh pr list --repo erclx/canon',
    )
  })

  it('should rewrite a repository URL', () => {
    expect(renameText('https://github.com/erclx/aitk.git')).toBe(
      'https://github.com/erclx/canon.git',
    )
  })

  it('should leave the sibling repository name alone', () => {
    expect(renameText('clone aitk-sandbox now')).toBe('clone aitk-sandbox now')
  })

  it('should leave the sibling repository alone when it carries the owner prefix', () => {
    expect(renameText('https://github.com/erclx/aitk-sandbox')).toBe(
      'https://github.com/erclx/aitk-sandbox',
    )
  })

  it('should rewrite an unprotected token adjacent to a protected one', () => {
    expect(renameText('aitk-sandbox uses aitk gov')).toBe(
      'aitk-sandbox uses canon gov',
    )
  })

  it('should rewrite the governance marker', () => {
    expect(renameText('# aitk-allow-superseded: pinned')).toBe(
      '# canon-allow-superseded: pinned',
    )
  })

  it('should leave text carrying no token untouched', () => {
    expect(renameText('nothing to see')).toBe('nothing to see')
  })

  it('should drop the article that only agreed with the retired name', () => {
    expect(renameText('reached by an aitk install command')).toBe(
      'reached by a canon install command',
    )
  })

  it('should repair the article across a code span', () => {
    expect(renameText('goes through an `aitk` verb')).toBe(
      'goes through a `canon` verb',
    )
  })

  it('should repair an article that opens a sentence', () => {
    expect(renameText('An aitk verb resolves it')).toBe(
      'A canon verb resolves it',
    )
  })

  it('should repair the article before the uppercase token', () => {
    expect(renameText('set by an AITK_SANDBOX_DIR pointed inside')).toBe(
      'set by a CANON_SANDBOX_DIR pointed inside',
    )
  })

  it('should keep the article before the sibling repository, which does not move', () => {
    expect(renameText('cloned into an aitk-sandbox checkout')).toBe(
      'cloned into an aitk-sandbox checkout',
    )
  })

  it('should leave an article before an unrelated word starting with canon', () => {
    expect(renameText('an canonical taxonomy')).toBe('an canonical taxonomy')
  })

  it('should leave a line carrying the keep marker', () => {
    const line = "join(target, '.claude', 'aitk.json') // canon-keep-retired"

    expect(renameText(line)).toBe(line)
  })

  it('should leave the line below a keep marker', () => {
    const text = ['// canon-keep-retired', "const path = 'aitk.json'"].join(
      '\n',
    )

    expect(renameText(text)).toBe(text)
  })

  it('should still rewrite a line two below the marker', () => {
    const text = [
      '// canon-keep-retired',
      "const retired = 'aitk.json'",
      "const current = 'aitk.json'",
    ].join('\n')

    expect(renameText(text)).toBe(
      [
        '// canon-keep-retired',
        "const retired = 'aitk.json'",
        "const current = 'canon.json'",
      ].join('\n'),
    )
  })
})

describe('scanText', () => {
  it('should count what it rewrote and what it protected', () => {
    expect(scanText('aitk erclx/aitk aitk-sandbox AITK')).toEqual({
      renamed: 3,
      protectedCount: 1,
    })
  })

  it('should report nothing for text carrying no token', () => {
    expect(scanText('nothing to see')).toEqual({
      renamed: 0,
      protectedCount: 0,
    })
  })
})

describe('renamePath', () => {
  it('should move the stamp folder', () => {
    expect(renamePath('.claude/aitk/pr-labels.toml')).toBe(
      '.claude/canon/pr-labels.toml',
    )
  })

  it('should move a prefixed skill folder', () => {
    expect(renamePath('claude/skills/aitk-cli/SKILL.md')).toBe(
      'claude/skills/canon-cli/SKILL.md',
    )
  })

  it('should move a prefixed scenario script', () => {
    expect(renamePath('scripts/sandbox/claude/aitk-operator.sh')).toBe(
      'scripts/sandbox/claude/canon-operator.sh',
    )
  })

  it('should leave a path carrying no token alone', () => {
    expect(renamePath('src/cli.ts')).toBe('src/cli.ts')
  })
})

describe('isExcludedPath', () => {
  it('should exclude the changelog, which records what shipped under the old name', () => {
    expect(isExcludedPath('CHANGELOG.md')).toBe(true)
  })

  it('should not exclude an ordinary source file', () => {
    expect(isExcludedPath('src/cli.ts')).toBe(false)
  })

  it('should exclude its own token map, which the sweep would otherwise flatten', () => {
    expect(isExcludedPath('src/migrate/rename.ts')).toBe(true)
  })

  it('should exclude its own tests, whose assertions name both spellings', () => {
    expect(isExcludedPath('src/migrate/rename.test.ts')).toBe(true)
  })

  it('should exclude the command that documents both spellings', () => {
    expect(isExcludedPath('src/commands/migrate.ts')).toBe(true)
  })

  it('should exclude an eval transcript, which records what a session ran', () => {
    expect(isExcludedPath('scripts/eval/result-seed.md')).toBe(true)
  })

  it('should not exclude the eval harness itself', () => {
    expect(isExcludedPath('scripts/eval/run.sh')).toBe(false)
  })
})
