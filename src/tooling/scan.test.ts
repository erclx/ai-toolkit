import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import type { Manifest } from '@/tooling/manifest'
import { scan } from '@/tooling/scan'

let root: string

function makeManifest(
  name: string,
  overrides: Partial<Manifest> = {},
): Manifest {
  const dir = join(root, 'tooling', name)
  return {
    name,
    dir,
    configsDir: join(dir, 'configs'),
    seedsDir: join(dir, 'seeds'),
    scripts: {},
    scriptOverrides: {},
    gitignore: [],
    devPackages: [],
    ...overrides,
  }
}

function seedFile(path: string, body: string): void {
  mkdirSync(join(path, '..'), { recursive: true })
  writeFileSync(path, body)
}

function target(): string {
  const dir = join(root, 'target')
  mkdirSync(dir, { recursive: true })
  return dir
}

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'canon-scan-'))
})

afterEach(() => {
  rmSync(root, { recursive: true, force: true })
})

describe('scan', () => {
  it('should report a config the target lacks as new', () => {
    const manifest = makeManifest('base')
    seedFile(join(manifest.configsDir, '.editorconfig'), 'root = true\n')

    const result = scan([manifest], target())

    expect(result.configs).toEqual([
      { rel: '.editorconfig', stack: 'base', state: 'new' },
    ])
  })

  it('should report an identical config as matching', () => {
    const manifest = makeManifest('base')
    const dir = target()
    seedFile(join(manifest.configsDir, '.editorconfig'), 'root = true\n')
    seedFile(join(dir, '.editorconfig'), 'root = true\n')

    const result = scan([manifest], dir)

    expect(result.configs[0].state).toBe('matching')
  })

  it('should report a differing config as drifted', () => {
    const manifest = makeManifest('base')
    const dir = target()
    seedFile(join(manifest.configsDir, '.editorconfig'), 'root = true\n')
    seedFile(join(dir, '.editorconfig'), 'root = false\n')

    const result = scan([manifest], dir)

    expect(result.configs[0].state).toBe('drifted')
  })

  it('should see dotfiles when comparing configs', () => {
    const manifest = makeManifest('base')
    seedFile(join(manifest.configsDir, '.husky', 'pre-commit'), 'echo hi\n')

    const result = scan([manifest], target())

    expect(result.configs.map((entry) => entry.rel)).toEqual([
      '.husky/pre-commit',
    ])
  })

  it('should let the nearest stack own a config both stacks ship', () => {
    const child = makeManifest('web')
    const parent = makeManifest('base')
    seedFile(join(child.configsDir, 'shared.json'), '{}\n')
    seedFile(join(parent.configsDir, 'shared.json'), '{"a":1}\n')

    const result = scan([child, parent], target())

    expect(result.configs).toEqual([
      { rel: 'shared.json', stack: 'web', state: 'new' },
    ])
  })

  it('should not report the same gitignore entry twice across stacks', () => {
    const child = makeManifest('web', {
      gitignore: [{ header: '# Build', entries: ['dist/'] }],
    })
    const parent = makeManifest('base', {
      gitignore: [{ header: '# Build', entries: ['dist/'] }],
    })

    const result = scan([child, parent], target())

    expect(result.gitignore).toEqual([{ entry: 'dist/', state: 'missing' }])
  })

  it('should report a gitignore entry already in the file as present', () => {
    const dir = target()
    writeFileSync(join(dir, '.gitignore'), '# Build\ndist/\n')
    const manifest = makeManifest('base', {
      gitignore: [{ header: '# Build', entries: ['dist/'] }],
    })

    const result = scan([manifest], dir)

    expect(result.gitignore).toEqual([{ entry: 'dist/', state: 'present' }])
  })

  it('should skip scripts and deps when the target has no package.json', () => {
    const manifest = makeManifest('base', {
      scripts: { check: './verify.sh' },
      devPackages: ['prettier'],
    })

    const result = scan([manifest], target())

    expect(result.hasPackageJson).toBe(false)
    expect(result.scripts).toEqual([])
    expect(result.deps).toEqual([])
  })

  it('should count every pending change once in the total', () => {
    const dir = target()
    writeFileSync(join(dir, 'package.json'), '{}\n')
    const manifest = makeManifest('base', {
      scripts: { check: './verify.sh' },
      devPackages: ['prettier'],
      gitignore: [{ header: '# Build', entries: ['dist/'] }],
    })
    seedFile(join(manifest.configsDir, '.editorconfig'), 'root = true\n')
    seedFile(join(manifest.seedsDir, 'cspell.json'), '{}\n')

    const result = scan([manifest], dir)

    expect(result.totalChanges).toBe(5)
  })

  it('should report nothing to do when the target already matches', () => {
    const dir = target()
    const manifest = makeManifest('base')
    seedFile(join(manifest.configsDir, '.editorconfig'), 'root = true\n')
    seedFile(join(dir, '.editorconfig'), 'root = true\n')

    const result = scan([manifest], dir)

    expect(result.totalChanges).toBe(0)
  })
})
