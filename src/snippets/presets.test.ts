import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { snippetsSourceDir } from '@/snippets/categories'
import { findPreset, loadPresets, presetsPath } from '@/snippets/presets'

let root: string

function seedPresets(body: string): void {
  mkdirSync(snippetsSourceDir(root), { recursive: true })
  writeFileSync(presetsPath(root), body)
}

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'canon-snippets-presets-'))
})

afterEach(() => {
  rmSync(root, { recursive: true, force: true })
})

describe('loadPresets', () => {
  it('should expand a preset into its slug list in declaration order', () => {
    seedPresets('[essentials]\nnames = ["decision-help", "step-by-step"]\n')

    expect(loadPresets(root)).toEqual([
      { name: 'essentials', slugs: ['decision-help', 'step-by-step'] },
    ])
  })

  it('should read every preset section', () => {
    seedPresets(
      '[essentials]\nnames = ["a"]\n\n[research]\nnames = ["b", "c"]\n',
    )

    expect(loadPresets(root).map((preset) => preset.name)).toEqual([
      'essentials',
      'research',
    ])
  })

  it('should treat a preset with no names array as empty', () => {
    seedPresets('[essentials]\n')

    expect(loadPresets(root)).toEqual([{ name: 'essentials', slugs: [] }])
  })

  it('should return an empty list when snippets.toml is absent', () => {
    expect(loadPresets(root)).toEqual([])
  })
})

describe('findPreset', () => {
  it('should find a preset by name', () => {
    seedPresets('[essentials]\nnames = ["a"]\n')

    expect(findPreset(root, 'essentials')?.slugs).toEqual(['a'])
  })

  it('should return undefined for a name that is not a preset', () => {
    seedPresets('[essentials]\nnames = ["a"]\n')

    expect(findPreset(root, 'claude')).toBeUndefined()
  })
})
