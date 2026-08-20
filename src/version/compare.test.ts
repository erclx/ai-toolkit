import { describe, expect, it } from 'vitest'
import { compareVersions, parseVersion } from '@/version/compare'

function parsed(raw: string) {
  const version = parseVersion(raw)
  if (version === undefined) throw new Error(`${raw} did not parse`)
  return version
}

describe('parseVersion', () => {
  it('should read the three core numbers off a plain release', () => {
    const version = parsed('0.110.3')

    expect(version).toEqual({ major: 0, minor: 110, patch: 3 })
  })

  it('should keep the prerelease tail as its own field', () => {
    const version = parsed('1.0.0-rc.2')

    expect(version.prerelease).toBe('rc.2')
  })

  it('should drop build metadata, which orders nothing', () => {
    const version = parsed('1.2.3+build.9')

    expect(version.prerelease).toBeUndefined()
  })

  it('should report a non-version as unparseable rather than as zero', () => {
    expect(parseVersion('unknown')).toBeUndefined()
  })

  it('should reject a two-part version, which names no patch', () => {
    expect(parseVersion('1.2')).toBeUndefined()
  })
})

describe('compareVersions', () => {
  it('should order by major before minor', () => {
    expect(compareVersions(parsed('1.0.0'), parsed('0.999.0'))).toBeGreaterThan(
      0,
    )
  })

  it('should order by minor before patch', () => {
    expect(compareVersions(parsed('0.109.9'), parsed('0.110.0'))).toBeLessThan(
      0,
    )
  })

  it('should order by patch when the rest matches', () => {
    expect(compareVersions(parsed('0.110.1'), parsed('0.110.2'))).toBeLessThan(
      0,
    )
  })

  it('should report two spellings of one version as equal', () => {
    expect(compareVersions(parsed('0.110.0'), parsed('0.110.0'))).toBe(0)
  })

  it('should sort a prerelease below the release sharing its core', () => {
    expect(compareVersions(parsed('1.0.0-rc.1'), parsed('1.0.0'))).toBeLessThan(
      0,
    )
  })

  it('should sort a release above the prerelease sharing its core', () => {
    expect(
      compareVersions(parsed('1.0.0'), parsed('1.0.0-rc.1')),
    ).toBeGreaterThan(0)
  })
})
