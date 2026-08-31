import { describe, expect, it } from 'vitest'
import { scanPhaseLabels } from '@/labels/phase'

const FEATURE_HEAD = 'feat/phase-label-gate'
const RELEASE_HEAD = 'release-please--branches--main--components--canon'
const RELEASE_TITLE = 'chore(main): release 3.46.0'

describe('scanPhaseLabels', () => {
  it('should fail a feature body carrying a phase label', () => {
    const result = scanPhaseLabels({
      title: 'feat: add the phase label gate',
      body: 'Planned under v59.7. See the plan for detail.',
      headRefName: FEATURE_HEAD,
    })

    expect(result).toEqual({
      cutsRelease: false,
      phaseLabels: ['v59.7'],
      semverTags: [],
    })
  })

  it('should pass a release body carrying a semver reference', () => {
    const result = scanPhaseLabels({
      title: RELEASE_TITLE,
      body: '## [3.46.0](https://github.com/erclx/canon/compare/v3.45.0...v3.46.0)',
      headRefName: RELEASE_HEAD,
    })

    expect(result).toEqual({
      cutsRelease: true,
      phaseLabels: [],
      semverTags: ['v3.45.0', 'v3.46.0'],
    })
  })

  it('should fail a feature body carrying both a phase label and a semver reference, naming only the phase label', () => {
    const result = scanPhaseLabels({
      title: 'fix: unblock v3.44',
      body: 'Scheduled under v68.5, references the v3.44 release.',
      headRefName: FEATURE_HEAD,
    })

    expect(result).toEqual({
      cutsRelease: false,
      phaseLabels: ['v3.44', 'v68.5'],
      semverTags: [],
    })
  })

  it('should not flag a phase label quoted inside a fenced block', () => {
    const result = scanPhaseLabels({
      title: 'fix: reproduce the task row',
      body: [
        'Quoting the row verbatim:',
        '',
        '```',
        '- v59.7: fix the gate',
        '```',
      ].join('\n'),
      headRefName: FEATURE_HEAD,
    })

    expect(result).toEqual({
      cutsRelease: false,
      phaseLabels: [],
      semverTags: [],
    })
  })

  it('should not flag a version-shaped token inside an inline code span', () => {
    const result = scanPhaseLabels({
      title: 'fix: document the fixture name',
      body: 'The function prints `v2.0-second` for the second call in the example.',
      headRefName: FEATURE_HEAD,
    })

    expect(result).toEqual({
      cutsRelease: false,
      phaseLabels: [],
      semverTags: [],
    })
  })

  it('should still flag a phase label written as plain text beside a code span', () => {
    const result = scanPhaseLabels({
      title: 'fix: document the fixture name',
      body: 'Planned under v59.7. The function prints `v2.0-second` in the example.',
      headRefName: FEATURE_HEAD,
    })

    expect(result).toEqual({
      cutsRelease: false,
      phaseLabels: ['v59.7'],
      semverTags: [],
    })
  })

  it('should require both the release head prefix and the release title to treat tokens as semver', () => {
    const result = scanPhaseLabels({
      title: 'feat: pretend this cuts a release',
      body: 'v59.7',
      headRefName: RELEASE_HEAD,
    })

    expect(result).toEqual({
      cutsRelease: false,
      phaseLabels: ['v59.7'],
      semverTags: [],
    })
  })

  it('should find no tokens in ordinary text', () => {
    const result = scanPhaseLabels({
      title: 'fix: correct the off-by-one',
      body: 'No version-shaped text here.',
      headRefName: FEATURE_HEAD,
    })

    expect(result).toEqual({
      cutsRelease: false,
      phaseLabels: [],
      semverTags: [],
    })
  })
})
