import { describe, expect, it } from 'vitest'
import { countBySeverity, noRecordMessage, parseAdvisories } from '@/deps/audit'

const RECORD = JSON.stringify({
  astro: [
    {
      id: 1118920,
      url: 'https://github.com/advisories/GHSA-xr5h-phrj-8vxv',
      title: 'Astro: replay of encrypted parameters',
      severity: 'low',
      vulnerable_versions: '<6.1.10',
    },
    {
      id: 1139377,
      url: 'https://github.com/advisories/GHSA-2pvr-wf23-7pc7',
      title: 'Astro: Host header SSRF',
      severity: 'high',
      vulnerable_versions: '<6.4.6',
    },
  ],
  yaml: [
    {
      id: 1115556,
      url: 'https://github.com/advisories/GHSA-48c2-rrv3-qjmp',
      title: 'yaml: stack overflow on nested collections',
      severity: 'moderate',
      vulnerable_versions: '>=2.0.0 <2.8.3',
    },
  ],
})

describe('parseAdvisories', () => {
  it('should flatten every package into one list carrying its name', () => {
    const advisories = parseAdvisories(RECORD)

    expect(advisories?.map((entry) => entry.package)).toEqual([
      'astro',
      'astro',
      'yaml',
    ])
  })

  it('should carry the fields a reader acts on', () => {
    const [first] = parseAdvisories(RECORD) ?? []

    expect(first).toEqual({
      package: 'astro',
      id: 1118920,
      title: 'Astro: replay of encrypted parameters',
      url: 'https://github.com/advisories/GHSA-xr5h-phrj-8vxv',
      severity: 'low',
      vulnerableVersions: '<6.1.10',
    })
  })

  it('should read an empty record as a clean tree', () => {
    expect(parseAdvisories('{}')).toEqual([])
  })

  it('should refuse output that does not parse', () => {
    expect(parseAdvisories('bun audit v1.3.14')).toBeUndefined()
  })

  it('should refuse empty output', () => {
    expect(parseAdvisories('')).toBeUndefined()
  })

  it('should refuse a record that is not an object of lists', () => {
    expect(parseAdvisories('[1, 2]')).toBeUndefined()
  })

  it('should read an unknown severity as info rather than dropping it', () => {
    const record = JSON.stringify({
      x: [{ id: 1, url: 'u', title: 't', severity: 'spicy' }],
    })

    expect(parseAdvisories(record)?.[0]?.severity).toBe('info')
  })
})

describe('countBySeverity', () => {
  it('should count each severity the record carries', () => {
    expect(countBySeverity(parseAdvisories(RECORD) ?? [])).toEqual({
      critical: 0,
      high: 1,
      moderate: 1,
      low: 1,
      info: 0,
    })
  })

  it('should report every severity as zero on a clean tree', () => {
    expect(countBySeverity([])).toEqual({
      critical: 0,
      high: 0,
      moderate: 0,
      low: 0,
      info: 0,
    })
  })
})

describe('noRecordMessage', () => {
  it('should name the stall rather than reporting an empty stream', () => {
    const message = noRecordMessage({ timedOut: true, stderr: '' })

    expect(message).toContain('timed out')
  })

  it('should take the timeout reading over stderr, even where both are present', () => {
    const message = noRecordMessage({
      timedOut: true,
      stderr: 'ENOTFOUND registry.npmjs.org',
    })

    expect(message).toContain('timed out')
    expect(message).not.toContain('ENOTFOUND')
  })

  it('should read the last stderr line for a refusal that was not a stall', () => {
    const message = noRecordMessage({
      timedOut: false,
      stderr: 'warning: ignoring\nerror: request failed',
    })

    expect(message).toBe('error: request failed')
  })

  it('should say nothing was on stdout when a non-stall refusal carries no stderr', () => {
    expect(noRecordMessage({ timedOut: false, stderr: '' })).toBe(
      'no output on stdout',
    )
  })
})
