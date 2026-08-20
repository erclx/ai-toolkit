import { describe, expect, it } from 'vitest'
import { describeSkew, latestOf, readSkew } from '@/version/skew'

const INSTALLED = { name: '@erclx/aitk', version: '0.110.0' }

function publishes(version: string) {
  return async () => version
}

function fails(message: string) {
  return async () => {
    throw new Error(message)
  }
}

describe('readSkew', () => {
  it('should report an older installed version as behind', async () => {
    const report = await readSkew({
      installed: INSTALLED,
      lookup: publishes('0.111.0'),
    })

    expect(report.state).toBe('behind')
    expect(latestOf(report)).toBe('0.111.0')
  })

  it('should report a matching version as current', async () => {
    const report = await readSkew({
      installed: INSTALLED,
      lookup: publishes('0.110.0'),
    })

    expect(report.state).toBe('current')
  })

  it('should report a version ahead of the registry as current', async () => {
    const report = await readSkew({
      installed: INSTALLED,
      lookup: publishes('0.109.0'),
    })

    expect(report.state).toBe('current')
  })

  it('should report an unreachable registry as unknown rather than rejecting', async () => {
    const report = await readSkew({
      installed: INSTALLED,
      lookup: fails('getaddrinfo ENOTFOUND registry.npmjs.org'),
    })

    expect(report.state).toBe('unknown')
    expect(describeSkew(report)).toContain('ENOTFOUND')
  })

  it('should keep the installed version on an unknown report', async () => {
    const report = await readSkew({
      installed: INSTALLED,
      lookup: fails('offline'),
    })

    expect(report.installed).toBe('0.110.0')
    expect(latestOf(report)).toBeUndefined()
  })

  it('should report an unreadable manifest as unknown without calling out', async () => {
    let called = false
    const report = await readSkew({
      installed: { name: 'unknown', version: 'unknown' },
      lookup: async () => {
        called = true
        return '1.0.0'
      },
    })

    expect(report.state).toBe('unknown')
    expect(called).toBe(false)
  })

  it('should report an unparseable published version as unknown', async () => {
    const report = await readSkew({
      installed: INSTALLED,
      lookup: publishes('not-a-version'),
    })

    expect(report.state).toBe('unknown')
    expect(describeSkew(report)).toContain('not-a-version')
  })
})

describe('describeSkew', () => {
  it('should name the remedy when the binary is behind', () => {
    const line = describeSkew({
      state: 'behind',
      name: '@erclx/aitk',
      installed: '0.110.0',
      latest: '0.111.0',
    })

    expect(line).toContain('aitk upgrade')
  })

  it('should carry the reason when the state is unknown', () => {
    const line = describeSkew({
      state: 'unknown',
      name: '@erclx/aitk',
      installed: '0.110.0',
      reason: 'Registry lookup failed: offline',
    })

    expect(line).toContain('offline')
  })
})
