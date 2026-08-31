import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  CONFIG_REL,
  parseInventoryConfig,
  readInventoryConfig,
  routeUrl,
} from '@/inventory/config'

const COMPLETE = `
base-url = "http://localhost:4173"
routes = ["/", "/pricing"]

[subjects.focus]
query = "button, a[href]"
`

describe('parseInventoryConfig', () => {
  it('should read the base URL, the routes, and every declared subject', () => {
    const read = parseInventoryConfig(COMPLETE)

    expect(read).toEqual({
      kind: 'config',
      config: {
        baseUrl: 'http://localhost:4173',
        routes: ['/', '/pricing'],
        subjects: [{ name: 'focus', query: 'button, a[href]' }],
      },
    })
  })

  it('should refuse a file that is not valid TOML', () => {
    const read = parseInventoryConfig('base-url = "unterminated')

    expect(read).toEqual({ kind: 'refused', reason: 'unreadable-config' })
  })

  it('should refuse a config carrying no base URL', () => {
    const read = parseInventoryConfig(
      'routes = ["/"]\n\n[subjects.focus]\nquery = "button"\n',
    )

    expect(read).toEqual({ kind: 'refused', reason: 'no-base-url' })
  })

  it('should refuse a config carrying no route to walk', () => {
    const read = parseInventoryConfig(
      'base-url = "http://localhost:4173"\nroutes = []\n\n[subjects.focus]\nquery = "button"\n',
    )

    expect(read).toEqual({ kind: 'refused', reason: 'no-routes' })
  })

  it('should refuse a config declaring no subject, since the query comes from the project', () => {
    const read = parseInventoryConfig(
      'base-url = "http://localhost:4173"\nroutes = ["/"]\n',
    )

    expect(read).toEqual({ kind: 'refused', reason: 'no-subjects' })
  })

  it('should drop a subject whose query is missing or empty rather than refusing the rest', () => {
    const read = parseInventoryConfig(`
base-url = "http://localhost:4173"
routes = ["/"]

[subjects.focus]
query = "button"

[subjects.reveal]
query = ""
`)

    expect(read.kind === 'config' && read.config.subjects).toEqual([
      { name: 'focus', query: 'button' },
    ])
  })

  it('should drop a route that is not a string', () => {
    const read = parseInventoryConfig(`
base-url = "http://localhost:4173"
routes = ["/", 4, "/pricing"]

[subjects.focus]
query = "button"
`)

    expect(read.kind === 'config' && read.config.routes).toEqual([
      '/',
      '/pricing',
    ])
  })
})

describe('readInventoryConfig', () => {
  it('should refuse a project declaring no config at all', () => {
    const root = mkdtempSync(join(tmpdir(), 'canon-inventory-'))

    expect(readInventoryConfig(root)).toEqual({
      kind: 'refused',
      reason: 'no-config',
    })
  })

  it('should read the config a project declares at its root', () => {
    const root = mkdtempSync(join(tmpdir(), 'canon-inventory-'))
    writeFileSync(join(root, CONFIG_REL), COMPLETE)

    const read = readInventoryConfig(root)

    expect(read.kind === 'config' && read.config.routes).toEqual([
      '/',
      '/pricing',
    ])
  })
})

describe('routeUrl', () => {
  it('should join a base and a route into one address', () => {
    expect(routeUrl('http://localhost:4173', '/pricing')).toBe(
      'http://localhost:4173/pricing',
    )
  })

  it('should keep a path the base already carries', () => {
    expect(routeUrl('http://localhost:4173/app/', '/pricing')).toBe(
      'http://localhost:4173/app/pricing',
    )
  })

  it('should read a route spelled without its leading slash', () => {
    expect(routeUrl('http://localhost:4173', 'pricing')).toBe(
      'http://localhost:4173/pricing',
    )
  })

  it('should keep the root route addressable', () => {
    expect(routeUrl('http://localhost:4173', '/')).toBe(
      'http://localhost:4173/',
    )
  })
})
