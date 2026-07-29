import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  listGovStacks,
  loadGovStack,
  mergeExtraRules,
  resolveRules,
} from '@/gov/stacks'

let root: string

function seedStack(name: string, body: string): void {
  const dir = join(root, 'governance', 'stacks')
  mkdirSync(dir, { recursive: true })
  writeFileSync(join(dir, `${name}.toml`), body)
}

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'aitk-gov-stacks-'))
})

afterEach(() => {
  rmSync(root, { recursive: true, force: true })
})

describe('loadGovStack', () => {
  it('should read the rules array', () => {
    seedStack('base', 'extends = ""\nrules = ["000-a", "010-b"]\n')

    expect(loadGovStack(root, 'base')?.rules).toEqual(['000-a', '010-b'])
  })

  it('should treat an empty extends as no parent', () => {
    seedStack('base', 'extends = ""\nrules = []\n')

    expect(loadGovStack(root, 'base')?.parent).toBeUndefined()
  })

  it('should read extends as the parent stack', () => {
    seedStack('astro', 'extends = "node"\nrules = []\n')

    expect(loadGovStack(root, 'astro')?.parent).toBe('node')
  })

  it('should return undefined for a stack that does not exist', () => {
    expect(loadGovStack(root, 'ghost')).toBeUndefined()
  })
})

describe('resolveRules', () => {
  it('should place ancestor rules before the stack own rules', () => {
    seedStack('base', 'extends = ""\nrules = ["000-a"]\n')
    seedStack('node', 'extends = "base"\nrules = ["100-b"]\n')
    seedStack('astro', 'extends = "node"\nrules = ["200-c"]\n')

    const resolved = resolveRules(root, 'astro')

    expect(resolved).toEqual({ ok: true, rules: ['000-a', '100-b', '200-c'] })
  })

  it('should keep only the first appearance of a rule named twice', () => {
    seedStack('base', 'extends = ""\nrules = ["000-a", "010-b"]\n')
    seedStack('node', 'extends = "base"\nrules = ["010-b", "100-c"]\n')

    const resolved = resolveRules(root, 'node')

    expect(resolved).toEqual({ ok: true, rules: ['000-a', '010-b', '100-c'] })
  })

  it('should report the missing ancestor rather than resolving partially', () => {
    seedStack('orphan', 'extends = "ghost"\nrules = ["000-a"]\n')

    expect(resolveRules(root, 'orphan')).toEqual({
      ok: false,
      missingStack: 'ghost',
    })
  })

  it('should report the stack itself when it does not exist', () => {
    expect(resolveRules(root, 'ghost')).toEqual({
      ok: false,
      missingStack: 'ghost',
    })
  })

  it('should stop instead of looping when extends forms a cycle', () => {
    seedStack('a', 'extends = "b"\nrules = ["000-a"]\n')
    seedStack('b', 'extends = "a"\nrules = ["010-b"]\n')

    expect(resolveRules(root, 'a')).toEqual({
      ok: true,
      rules: ['010-b', '000-a'],
    })
  })
})

describe('mergeExtraRules', () => {
  it('should append comma-separated extras after the stack rules', () => {
    expect(mergeExtraRules(['000-a'], '200-react,260-shadcn')).toEqual([
      '000-a',
      '200-react',
      '260-shadcn',
    ])
  })

  it('should trim surrounding whitespace from each extra', () => {
    expect(mergeExtraRules([], ' 200-react , 260-shadcn ')).toEqual([
      '200-react',
      '260-shadcn',
    ])
  })

  it('should skip an extra the stack already resolved', () => {
    expect(mergeExtraRules(['200-react'], '200-react,260-shadcn')).toEqual([
      '200-react',
      '260-shadcn',
    ])
  })

  it('should ignore empty entries from a trailing comma', () => {
    expect(mergeExtraRules([], '200-react,,')).toEqual(['200-react'])
  })
})

describe('listGovStacks', () => {
  it('should list stack names without the toml extension', () => {
    seedStack('node', 'rules = []\n')
    seedStack('base', 'rules = []\n')

    expect(listGovStacks(root)).toEqual(['base', 'node'])
  })

  it('should return an empty list when no stacks directory exists', () => {
    expect(listGovStacks(join(root, 'nowhere'))).toEqual([])
  })
})
