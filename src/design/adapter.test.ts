import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  createDesignAdapter,
  DESIGN_INSTALL_DIR,
  DESIGN_PROJECT_SUBDIR,
} from '@/design/adapter'
import { DESIGN_BASE_CSS } from '@/design/regen'
import { planSync } from '@/sync/engine'

let toolkit: string
let target: string

const BASE = 'base.css'

const seedToolkit = (body: string): void => {
  const path = join(toolkit, DESIGN_BASE_CSS)
  mkdirSync(join(path, '..'), { recursive: true })
  writeFileSync(path, body)
}

const seedTarget = (rel: string, body: string): void => {
  const path = join(target, DESIGN_INSTALL_DIR, rel)
  mkdirSync(join(path, '..'), { recursive: true })
  writeFileSync(path, body)
}

const states = (): Record<string, string> => {
  const plan = planSync(createDesignAdapter(toolkit), target)
  return Object.fromEntries(
    plan.entries.map((entry) => [entry.rel, entry.state]),
  )
}

beforeEach(() => {
  toolkit = mkdtempSync(join(tmpdir(), 'design-toolkit-'))
  target = mkdtempSync(join(tmpdir(), 'design-target-'))
})

afterEach(() => {
  rmSync(toolkit, { recursive: true, force: true })
  rmSync(target, { recursive: true, force: true })
})

describe('createDesignAdapter', () => {
  it('walks stylesheets rather than the markdown every other domain ships', () => {
    seedToolkit(':root {}\n')
    seedTarget(BASE, ':root {}\n')
    seedTarget('notes.md', '# not a stylesheet\n')

    expect(Object.keys(states())).toEqual([join('.claude', 'design', BASE)])
  })

  it('reports a base matching the toolkit as matching', () => {
    seedToolkit(':root {}\n')
    seedTarget(BASE, ':root {}\n')

    expect(states()[join('.claude', 'design', BASE)]).toBe('matching')
  })

  it('queues a base the toolkit moved on from', () => {
    seedToolkit(':root {\n  --color-accent: #e0724b;\n}\n')
    seedTarget(BASE, ':root {}\n')

    const plan = planSync(createDesignAdapter(toolkit), target)

    expect(plan.changes).toHaveLength(1)
    expect(plan.changes[0].kind).toBe('copy')
  })

  /**
   * The whole of what base plus override buys. An override named exactly like
   * the shipped file is still the project's, because the folder decides and the
   * name inference never runs on it.
   */
  it('leaves the override folder alone, even where the name matches the base', () => {
    seedToolkit(':root {}\n')
    seedTarget(BASE, ':root {}\n')
    seedTarget(
      join(DESIGN_PROJECT_SUBDIR, BASE),
      ':root { --color-accent: red }\n',
    )

    const plan = planSync(createDesignAdapter(toolkit), target)
    const override = join('.claude', 'design', DESIGN_PROJECT_SUBDIR, BASE)

    expect(states()[override]).toBe('orphaned')
    expect(plan.changes.map((change) => change.rel)).not.toContain(override)
  })

  it('creates no override, so a first install ships the base alone', () => {
    seedToolkit(':root {}\n')
    seedTarget(BASE, ':root {}\n')

    expect(Object.keys(states())).toHaveLength(1)
  })
})
