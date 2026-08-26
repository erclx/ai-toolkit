import { describe, expect, it } from 'vitest'
import {
  type InitFlags,
  parseSkip,
  planInit,
  resolveStack,
  snippetsSkipReason,
} from '@/init/plan'

function flags(overrides: Partial<InitFlags> = {}): InitFlags {
  return {
    skip: parseSkip(undefined),
    ...overrides,
  }
}

function texts(plan: ReturnType<typeof planInit>): string[] {
  return plan.preview.map((line) => line.text)
}

describe('planInit standards preview', () => {
  it('should offer no standards line, since no corpus installs', () => {
    expect(texts(planInit(flags())).join('\n')).not.toContain('standards')
  })
})

describe('parseSkip', () => {
  it('should collect nothing when the flag is absent', () => {
    const plan = parseSkip(undefined)

    expect([...plan.skipped]).toEqual([])
    expect(plan.unknown).toEqual([])
  })

  it('should read a comma-separated list', () => {
    expect([...parseSkip('wiki,governance').skipped]).toEqual([
      'wiki',
      'governance',
    ])
  })

  it('should trim whitespace around each value', () => {
    expect([...parseSkip(' wiki , governance ').skipped]).toEqual([
      'wiki',
      'governance',
    ])
  })

  it('should report standards as unrecognized, since it no longer installs', () => {
    const plan = parseSkip('standards')

    expect([...plan.skipped]).toEqual([])
    expect(plan.unknown).toEqual(['standards'])
  })

  it('should report an unrecognized value without dropping the valid ones', () => {
    const plan = parseSkip('wiki,gov')

    expect([...plan.skipped]).toEqual(['wiki'])
    expect(plan.unknown).toEqual(['gov'])
  })

  it('should accept governance as a skippable domain', () => {
    const plan = parseSkip('governance')

    expect([...plan.skipped]).toEqual(['governance'])
    expect(plan.unknown).toEqual([])
  })

  it('should ignore empty entries from a trailing comma', () => {
    const plan = parseSkip('wiki,')

    expect([...plan.skipped]).toEqual(['wiki'])
    expect(plan.unknown).toEqual([])
  })

  it('should accept snippets as a skippable domain', () => {
    const plan = parseSkip('snippets')

    expect([...plan.skipped]).toEqual(['snippets'])
    expect(plan.unknown).toEqual([])
  })
})

describe('snippetsSkipReason', () => {
  it('should skip when no --snippets flag was given', () => {
    expect(snippetsSkipReason(flags())).toBe('no --snippets given')
  })

  it('should skip when --skip snippets was passed, even with a category', () => {
    expect(
      snippetsSkipReason(
        flags({ snippets: 'all', skip: parseSkip('snippets') }),
      ),
    ).toBe('--skip snippets')
  })

  it('should not skip when a category was named and snippets was not skipped', () => {
    expect(
      snippetsSkipReason(flags({ snippets: 'essentials' })),
    ).toBeUndefined()
  })

  it('should treat an explicit none category as a real run rather than a skip', () => {
    expect(snippetsSkipReason(flags({ snippets: 'none' }))).toBeUndefined()
  })
})

describe('planInit', () => {
  it('should count four domains when no flags are given, snippets skipped by default', () => {
    expect(planInit(flags()).total).toBe(4)
  })

  it('should install the default stack when none is named', () => {
    expect(texts(planInit(flags()))).toContain('governance (stack: base)')
  })

  it('should install the named stack over the default', () => {
    expect(texts(planInit(flags({ stack: 'astro' })))).toContain(
      'governance (stack: astro)',
    )
  })

  it('should warn about governance rather than counting it when skipped', () => {
    const plan = planInit(
      flags({ snippets: 'essentials', skip: parseSkip('governance') }),
    )

    expect(plan.total).toBe(4)
    expect(plan.preview).toContainEqual({
      level: 'warn',
      text: 'governance (skipped)',
    })
  })

  it('should report extra rules the governance skip drops', () => {
    const plan = planInit(
      flags({ add: '260-shadcn', skip: parseSkip('governance') }),
    )

    expect(plan.preview).toContainEqual({
      level: 'warn',
      text: 'governance (skipped, --add 260-shadcn not installed)',
    })
  })

  it('should name the extra rules alongside the stack', () => {
    const plan = planInit(flags({ stack: 'astro', add: '260-shadcn' }))

    expect(texts(plan)).toContain(
      'governance (stack: astro, extras: 260-shadcn)',
    )
  })

  it('should drop a skipped domain from the preview and the count', () => {
    const plan = planInit(
      flags({ stack: 'base', snippets: 'essentials', skip: parseSkip('wiki') }),
    )

    expect(plan.total).toBe(4)
    expect(texts(plan)).not.toContain('wiki (.claude/wiki/ with a stub index)')
  })

  it('should subtract every skip from the count', () => {
    const plan = planInit(
      flags({ snippets: 'essentials', skip: parseSkip('wiki,governance') }),
    )

    expect(plan.total).toBe(3)
  })

  it('should keep the count equal to the domains that will run', () => {
    const plan = planInit(flags({ stack: 'base', skip: parseSkip('wiki') }))

    expect(plan.preview.filter((line) => line.level === 'info')).toHaveLength(
      plan.total,
    )
  })

  it('should report the snippets category in the preview', () => {
    expect(texts(planInit(flags({ snippets: 'all' })))).toContain(
      'snippets (all)',
    )
  })

  it('should warn snippets as skipped rather than counting it by default', () => {
    const plan = planInit(flags())

    expect(plan.preview).toContainEqual({
      level: 'warn',
      text: 'snippets (skipped)',
    })
  })

  it('should warn snippets as skipped when explicitly declined', () => {
    const plan = planInit(
      flags({ snippets: 'all', skip: parseSkip('snippets') }),
    )

    expect(plan.preview).toContainEqual({
      level: 'warn',
      text: 'snippets (skipped)',
    })
  })

  it('should count the none category as a run rather than a skip', () => {
    const plan = planInit(flags({ snippets: 'none' }))

    expect(texts(plan)).toContain('snippets (none)')
  })

  it('should treat an empty stack as unnamed rather than as a way to decline', () => {
    expect(texts(planInit(flags({ stack: '' })))).toContain(
      'governance (stack: base)',
    )
  })
})

describe('resolveStack', () => {
  it('should fall back to the default when the flag is absent', () => {
    expect(resolveStack(undefined)).toBe('base')
  })

  it('should fall back to the default when the flag is empty', () => {
    expect(resolveStack('')).toBe('base')
  })

  it('should keep a named stack', () => {
    expect(resolveStack('astro')).toBe('astro')
  })
})
