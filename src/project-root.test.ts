import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { findCheckoutMismatch, PROJECT_ROOT } from '@/project-root'

let fixture: string

const writePackage = (dir: string, name: string): void => {
  mkdirSync(dir, { recursive: true })
  writeFileSync(join(dir, 'package.json'), JSON.stringify({ name }))
}

beforeEach(() => {
  fixture = mkdtempSync(join(tmpdir(), 'checkout-mismatch-'))
})

afterEach(() => {
  rmSync(fixture, { force: true, recursive: true })
})

describe('findCheckoutMismatch', () => {
  it('should report the ancestor when a matching name sits at a different path', () => {
    writePackage(fixture, '@erclx/canon')
    const startDir = join(fixture, 'src/commands')
    mkdirSync(startDir, { recursive: true })

    expect(findCheckoutMismatch(startDir)).toBe(fixture)
  })

  it('should report nothing when no ancestor carries a matching package.json', () => {
    const startDir = join(fixture, 'unrelated/project')
    writePackage(startDir, 'some-other-package')

    expect(findCheckoutMismatch(startDir)).toBeUndefined()
  })

  it('should report nothing when the matching ancestor is PROJECT_ROOT itself', () => {
    expect(findCheckoutMismatch(PROJECT_ROOT)).toBeUndefined()
  })
})
