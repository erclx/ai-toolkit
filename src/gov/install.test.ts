import {
  chmodSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { stat } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  installedRuleNames,
  installRules,
  lookupRules,
  ruleSubdir,
  rulesSourceDir,
} from '@/gov/install'

let root: string
let target: string

function seedRule(relPath: string, body: string): void {
  const path = join(rulesSourceDir(root), relPath)
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, body)
}

beforeEach(() => {
  const base = mkdtempSync(join(tmpdir(), 'canon-gov-install-'))
  root = join(base, 'toolkit')
  target = join(base, 'target')
  mkdirSync(root, { recursive: true })
  mkdirSync(target, { recursive: true })
})

afterEach(() => {
  rmSync(dirname(root), { recursive: true, force: true })
})

describe('ruleSubdir', () => {
  it('should return the folder a nested rule was authored in', () => {
    const rulesRoot = join(root, 'governance', 'rules')

    expect(ruleSubdir(join(rulesRoot, 'core', '000-a.md'), rulesRoot)).toBe(
      'core',
    )
  })

  it('should return an empty string for a rule sitting at the root', () => {
    const rulesRoot = join(root, 'governance', 'rules')

    expect(ruleSubdir(join(rulesRoot, '000-a.md'), rulesRoot)).toBe('')
  })
})

describe('lookupRules', () => {
  it('should find a rule by name across subfolders', () => {
    seedRule(join('core', '000-a.md'), 'A')
    seedRule(join('lang', '100-b.md'), 'B')

    const { found, missing } = lookupRules(root, ['100-b', '000-a'])

    expect(missing).toEqual([])
    expect(found.map((entry) => entry.rule)).toEqual(['100-b', '000-a'])
    expect(found.map((entry) => entry.subdir)).toEqual(['lang', 'core'])
  })

  it('should report a rule with no source file instead of dropping it', () => {
    seedRule(join('core', '000-a.md'), 'A')

    const { found, missing } = lookupRules(root, ['000-a', '999-ghost'])

    expect(found.map((entry) => entry.rule)).toEqual(['000-a'])
    expect(missing).toEqual(['999-ghost'])
  })

  it('should report every rule as missing when no rules source exists', () => {
    const { found, missing } = lookupRules(join(root, 'nowhere'), ['000-a'])

    expect(found).toEqual([])
    expect(missing).toEqual(['000-a'])
  })

  it('should preserve the requested order rather than the source order', () => {
    seedRule(join('core', '000-a.md'), 'A')
    seedRule(join('core', '010-b.md'), 'B')

    const { found } = lookupRules(root, ['010-b', '000-a'])

    expect(found.map((entry) => entry.rule)).toEqual(['010-b', '000-a'])
  })
})

describe('installRules', () => {
  it('should install each rule into its authored subfolder', async () => {
    seedRule(join('core', '000-a.md'), 'A')
    seedRule(join('lang', '100-b.md'), 'B')

    const { found } = lookupRules(root, ['000-a', '100-b'])
    const installed = await installRules(found, target)

    expect(installed).toEqual([
      join('.claude', 'rules', 'canon', 'core', '000-a.md'),
      join('.claude', 'rules', 'canon', 'lang', '100-b.md'),
    ])
  })

  it('should install a root-level rule flat', async () => {
    seedRule('000-a.md', 'A')

    const { found } = lookupRules(root, ['000-a'])

    expect(await installRules(found, target)).toEqual([
      join('.claude', 'rules', 'canon', '000-a.md'),
    ])
  })

  it('should install internal-only rules under internal/ when asked', async () => {
    seedRule(join('claude', '598-a.md'), 'A')

    const { found } = lookupRules(root, ['598-a'])

    expect(await installRules(found, target, 'internal')).toEqual([
      join('.claude', 'rules', 'internal', 'claude', '598-a.md'),
    ])
  })

  it('should leave an existing destination mode alone', async () => {
    seedRule(join('core', '000-a.md'), 'A')
    const dest = join(target, '.claude', 'rules', 'canon', 'core', '000-a.md')
    mkdirSync(dirname(dest), { recursive: true })
    writeFileSync(dest, 'old')
    chmodSync(dest, 0o600)

    const { found } = lookupRules(root, ['000-a'])
    await installRules(found, target)

    expect((await stat(dest)).mode & 0o777).toBe(0o600)
  })
})

describe('installedRuleNames', () => {
  it('should name every installed rule by its basename', async () => {
    seedRule(join('core', '000-a.md'), 'A')
    seedRule(join('lang', '100-b.md'), 'B')
    const { found } = lookupRules(root, ['000-a', '100-b'])
    await installRules(found, target)

    expect([...installedRuleNames(target)].sort()).toEqual(['000-a', '100-b'])
  })

  it('should return an empty set when nothing is installed', () => {
    expect(installedRuleNames(target)).toEqual(new Set())
  })
})
