import { describe, expect, it } from 'vitest'
import { type InitFlags, parseSkip, planInit } from '@/init/plan'

function flags(overrides: Partial<InitFlags> = {}): InitFlags {
  return {
    snippets: 'essentials',
    skip: parseSkip(undefined),
    ...overrides,
  }
}

function texts(plan: ReturnType<typeof planInit>): string[] {
  return plan.preview.map((line) => line.text)
}

describe('parseSkip', () => {
  it('should collect nothing when the flag is absent', () => {
    const plan = parseSkip(undefined)

    expect([...plan.skipped]).toEqual([])
    expect(plan.unknown).toEqual([])
  })

  it('should read a comma-separated list', () => {
    expect([...parseSkip('wiki,standards').skipped]).toEqual([
      'wiki',
      'standards',
    ])
  })

  it('should trim whitespace around each value', () => {
    expect([...parseSkip(' wiki , standards ').skipped]).toEqual([
      'wiki',
      'standards',
    ])
  })

  it('should report an unrecognized value without dropping the valid ones', () => {
    const plan = parseSkip('wiki,gov')

    expect([...plan.skipped]).toEqual(['wiki'])
    expect(plan.unknown).toEqual(['gov'])
  })

  it('should ignore empty entries from a trailing comma', () => {
    const plan = parseSkip('wiki,')

    expect([...plan.skipped]).toEqual(['wiki'])
    expect(plan.unknown).toEqual([])
  })
})

describe('planInit', () => {
  it('should count five domains when no stack is given', () => {
    expect(planInit(flags()).total).toBe(5)
  })

  it('should count six domains once a stack is given', () => {
    expect(planInit(flags({ stack: 'base' })).total).toBe(6)
  })

  it('should warn about governance rather than counting it without a stack', () => {
    const plan = planInit(flags())

    expect(plan.preview).toContainEqual({
      level: 'warn',
      text: 'governance (skipped: no --stack)',
    })
  })

  it('should name the extra rules alongside the stack', () => {
    const plan = planInit(flags({ stack: 'astro', add: '260-shadcn' }))

    expect(texts(plan)).toContain(
      'governance (stack: astro, extras: 260-shadcn)',
    )
  })

  it('should drop a skipped domain from the preview and the count', () => {
    const plan = planInit(flags({ stack: 'base', skip: parseSkip('wiki') }))

    expect(plan.total).toBe(5)
    expect(texts(plan)).not.toContain('wiki (.claude/wiki/ with a stub index)')
  })

  it('should subtract both skips and the missing stack from the count', () => {
    const plan = planInit(flags({ skip: parseSkip('wiki,standards') }))

    expect(plan.total).toBe(3)
  })

  it('should keep the count equal to the domains that will run', () => {
    const plan = planInit(
      flags({ stack: 'base', skip: parseSkip('standards') }),
    )

    expect(plan.preview.filter((line) => line.level === 'info')).toHaveLength(
      plan.total,
    )
  })

  it('should report the snippets category in the preview', () => {
    expect(texts(planInit(flags({ snippets: 'all' })))).toContain(
      'snippets (all)',
    )
  })

  it('should treat an empty stack the same as no stack', () => {
    expect(planInit(flags({ stack: '' })).total).toBe(5)
  })
})
