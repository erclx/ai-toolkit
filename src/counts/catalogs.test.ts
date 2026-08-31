import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { AUDITS } from '@/audits/catalog'
import { CATALOGS } from '@/counts/catalogs'

let ROOT: string

function write(path: string, body: string): void {
  const full = join(ROOT, path)
  mkdirSync(dirname(full), { recursive: true })
  writeFileSync(full, body)
}

function catalogFor(id: string) {
  const catalog = CATALOGS.find((entry) => entry.id === id)
  if (catalog === undefined) throw new Error(`No catalog registered for ${id}`)
  return catalog
}

beforeEach(() => {
  ROOT = mkdtempSync(join(tmpdir(), 'canon-counts-catalogs-'))
})

afterEach(() => {
  rmSync(ROOT, { recursive: true, force: true })
})

describe('the closed catalog set', () => {
  it('should register exactly the six catalogs the plan named', () => {
    expect(CATALOGS.map((catalog) => catalog.id)).toEqual([
      'skills',
      'rules',
      'standards',
      'snippets',
      'commands',
      'audits',
    ])
  })

  it('should pair every catalog with its singular and plural noun', () => {
    for (const catalog of CATALOGS) {
      expect(catalog.nouns).toHaveLength(2)
    }
  })
})

describe('the skills catalog', () => {
  it('should count a shipped skill folder per SKILL.md', () => {
    write('claude/skills/foo/SKILL.md', '# Foo\n')
    write('claude/skills/bar/SKILL.md', '# Bar\n')

    expect(catalogFor('skills').count(ROOT)).toBe(2)
  })
})

describe('the rules catalog', () => {
  it('should count a governance rule per authored file', () => {
    write('governance/rules/core/010-one.md', '# One\n')
    write('governance/rules/core/020-two.md', '# Two\n')
    write('governance/stacks/core.md', '- 010-one\n')

    expect(catalogFor('rules').count(ROOT)).toBe(2)
  })
})

describe('the snippets catalog', () => {
  it('should count an entry once per category it sits in', () => {
    write('snippets/claude/one.md', '# One\n')
    write('snippets/gemini/two.md', '# Two\n')

    expect(catalogFor('snippets').count(ROOT)).toBe(2)
  })

  it('should dedupe a slug reachable from two categories', () => {
    write('snippets/claude/shared.md', '# Shared\n')
    write('snippets/gemini/shared.md', '# Shared\n')

    expect(catalogFor('snippets').count(ROOT)).toBe(1)
  })
})

describe('the commands catalog', () => {
  it('should count one registration import per line', () => {
    write(
      'src/cli.ts',
      [
        "import { register as init } from '@/commands/init'",
        "import { register as gov } from '@/commands/gov'",
        "import { register as sync } from '@/commands/sync'",
        'program.parse()',
      ].join('\n'),
    )

    expect(catalogFor('commands').count(ROOT)).toBe(3)
  })

  it('should read no import as no command', () => {
    write('src/cli.ts', 'program.parse()\n')

    expect(catalogFor('commands').count(ROOT)).toBe(0)
  })

  it('should read no CLI entry point as not applicable, never as zero', () => {
    expect(catalogFor('commands').count(ROOT)).toBeUndefined()
  })
})

describe('the audits catalog', () => {
  it('should read the length of the registered audit set', () => {
    expect(catalogFor('audits').count(ROOT)).toBe(AUDITS.length)
  })
})
