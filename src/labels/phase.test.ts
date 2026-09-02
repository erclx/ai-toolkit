import { describe, expect, it } from 'vitest'
import { scanPhaseLabels } from '@/labels/phase'
import { BAN_SETS } from '@/markdown/bans'

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
      boardReferences: [],
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
      boardReferences: [],
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
      boardReferences: [],
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
      boardReferences: [],
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
      boardReferences: [],
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
      boardReferences: [],
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
      boardReferences: [],
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
      boardReferences: [],
    })
  })

  it('should report a board identifier a code span holds on its own', () => {
    const result = scanPhaseLabels({
      title: 'feat: widen the scan',
      body: 'Planned under `v75.1` and nothing else.',
      headRefName: FEATURE_HEAD,
    })

    expect(result).toEqual({
      cutsRelease: false,
      phaseLabels: [],
      semverTags: [],
      boardReferences: ['v75.1'],
    })
  })

  it('should report a board identifier a code span holds where the possessive sits outside it', () => {
    const result = scanPhaseLabels({
      title: 'feat: widen the scan',
      body: "Carried over from `v53.9`'s pass on the same surface.",
      headRefName: FEATURE_HEAD,
    })

    expect(result).toEqual({
      cutsRelease: false,
      phaseLabels: [],
      semverTags: [],
      boardReferences: ['v53.9'],
    })
  })

  it('should name a token once when it is written both bare and quoted', () => {
    const result = scanPhaseLabels({
      title: 'feat: widen the scan',
      body: 'Planned under v75.1, which the row writes as `v75.1`.',
      headRefName: FEATURE_HEAD,
    })

    expect(result).toEqual({
      cutsRelease: false,
      phaseLabels: ['v75.1'],
      semverTags: [],
      boardReferences: [],
    })
  })

  it('should report a record path whether or not a code span holds it', () => {
    const result = scanPhaseLabels({
      title: 'feat: widen the scan',
      body: 'See .canon/review/feedback/ and `.canon/tasks/priority.md` for detail.',
      headRefName: FEATURE_HEAD,
    })

    expect(result).toEqual({
      cutsRelease: false,
      phaseLabels: [],
      semverTags: [],
      boardReferences: ['.canon/review/feedback/', '.canon/tasks/priority.md'],
    })
  })

  it('should report a record path written at the root an unmigrated project still uses', () => {
    const result = scanPhaseLabels({
      title: 'feat: widen the scan',
      body: 'The row sits in .claude/tasks/priority.md on that target.',
      headRefName: FEATURE_HEAD,
    })

    expect(result).toEqual({
      cutsRelease: false,
      phaseLabels: [],
      semverTags: [],
      boardReferences: ['.claude/tasks/priority.md'],
    })
  })

  it('should leave a tracked path under the same root alone', () => {
    const result = scanPhaseLabels({
      title: 'feat: widen the scan',
      body: 'The rule is .claude/rules/core/005-behavior.md, which every clone resolves.',
      headRefName: FEATURE_HEAD,
    })

    expect(result).toEqual({
      cutsRelease: false,
      phaseLabels: [],
      semverTags: [],
      boardReferences: [],
    })
  })

  it('should report nothing when a fenced block carries every reportable shape', () => {
    const result = scanPhaseLabels({
      title: 'fix: quote the row verbatim',
      body: [
        'Reproducing what the board holds:',
        '',
        '```',
        '- v59.7: fix the gate',
        'Planned under `v75.1`, tracked at .canon/tasks/priority.md',
        '```',
      ].join('\n'),
      headRefName: FEATURE_HEAD,
    })

    expect(result).toEqual({
      cutsRelease: false,
      phaseLabels: [],
      semverTags: [],
      boardReferences: [],
    })
  })

  it('should find no board identifier in the markdown ban sets, which are scanned inside the repository', () => {
    const result = scanPhaseLabels({
      title: 'fix: restate the ban sets',
      body: [
        ...BAN_SETS.characters,
        ...BAN_SETS.words,
        ...BAN_SETS.spellings,
      ].join(' '),
      headRefName: FEATURE_HEAD,
    })

    expect(result).toEqual({
      cutsRelease: false,
      phaseLabels: [],
      semverTags: [],
      boardReferences: [],
    })
  })
})
