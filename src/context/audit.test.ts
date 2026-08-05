import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  CATALOG_ROW_CHECKPOINT,
  LENGTH_CHECKPOINT,
  measureEntry,
  measureFolders,
  missingSections,
} from '@/context/audit'
import { resolveFolders } from '@/context/folders'

const FRONTMATTER = '---\ntitle: CI\ndescription: A domain\n---\n\n'

/** The sets the shipped rule publishes, held here so a scan has terms. */
const TERMS = {
  pronouns: ['It', 'That', 'This', 'These', 'Those', 'They'],
  verbs: ['was', 'were', 'became', 'replaced', 'superseded', 'used to'],
}

/** Bullet counts the exempt catalog and the reported wall both hit. */
const PEER_COUNT = 55

/** Characters a bullet averages in each of the two shapes the corpus holds. */
const CATALOG_BULLET = 94
const PARAGRAPH_BULLET = 394

function prose(count: number): string {
  return Array.from({ length: count }, (_, index) => `Line ${index + 1}.`).join(
    '\n',
  )
}

function bullets(count: number, indent = ''): string {
  return Array.from(
    { length: count },
    (_, index) => `${indent}- Item ${index + 1}`,
  ).join('\n')
}

function weightedBullets(count: number, width: number): string {
  return Array.from({ length: count }, (_, index) =>
    `- Item ${index + 1} `.padEnd(width, 'weight '),
  ).join('\n')
}

function table(rows: string[]): string {
  return ['| Name | Purpose |', '| --- | --- |', ...rows].join('\n')
}

function catalogRows(count: number): string[] {
  return Array.from(
    { length: count },
    (_, index) => `| \`aitk cmd-${index}\` | Does a thing |`,
  )
}

/** A bullet of an exact character count, so a boundary case lands on it. */
function bullet(characters: number): string {
  return `- ${'w'.repeat(characters - 2)}`
}

describe('measureEntry', () => {
  it('should count the whole file including its frontmatter', () => {
    const entry = measureEntry('ci.md', `${FRONTMATTER}# CI\n\n${prose(3)}\n`)

    expect(entry.lines).toBe(10)
  })

  it('should measure entry length in rendered lines rather than source lines', () => {
    const source = `${FRONTMATTER}# CI\n\n${weightedBullets(3, PARAGRAPH_BULLET)}\n`

    // Ten short lines render as ten, and each 394-character bullet wraps to
    // five, so three bullets stand in for fifteen of the checkpoint's budget.
    expect(measureEntry('ci.md', source).lines).toBe(22)
  })

  it('should report a table whose rows name artifacts as a growing catalog', () => {
    const source = `${FRONTMATTER}# CI\n\n${table(catalogRows(CATALOG_ROW_CHECKPOINT))}\n`

    expect(measureEntry('ci.md', source).catalogTables).toEqual([
      { line: 8, rows: CATALOG_ROW_CHECKPOINT },
    ])
  })

  it('should leave a fixed table of the same size unreported', () => {
    const rows = Array.from(
      { length: CATALOG_ROW_CHECKPOINT },
      (_, index) => `| Concern ${index} | Some prose about it |`,
    )
    const source = `${FRONTMATTER}# CI\n\n${table(rows)}\n`

    expect(measureEntry('ci.md', source).catalogTables).toEqual([])
  })

  it('should leave a short catalog table unreported', () => {
    const source = `${FRONTMATTER}# CI\n\n${table(catalogRows(CATALOG_ROW_CHECKPOINT - 1))}\n`

    expect(measureEntry('ci.md', source).catalogTables).toEqual([])
  })

  it('should ignore a table that is an example inside a fenced block', () => {
    const source = `${FRONTMATTER}# CI\n\n\`\`\`markdown\n${table(catalogRows(CATALOG_ROW_CHECKPOINT))}\n\`\`\`\n`

    expect(measureEntry('ci.md', source).catalogTables).toEqual([])
  })

  it('should report a date narrating when a change landed', () => {
    const source = `${FRONTMATTER}# CI\n\nThe cap was 20 until 2026-07-30.\n`

    expect(measureEntry('ci.md', source).provenance).toEqual([
      { line: 8, kind: 'date', text: '2026-07-30' },
    ])
  })

  it('should report a change number narrating which pull request carried it', () => {
    const source = `${FRONTMATTER}# CI\n\nThe path moved under #668 and stayed.\n`

    expect(measureEntry('ci.md', source).provenance).toEqual([
      { line: 8, kind: 'change', text: '#668' },
    ])
  })

  it('should report a release label attached to a change', () => {
    const source = `${FRONTMATTER}# CI\n\nEighteen skills have one as of v16.2.\n`

    expect(measureEntry('ci.md', source).provenance).toEqual([
      { line: 8, kind: 'release', text: 'v16.2' },
    ])
  })

  it('should report markers sharing a line left to right across kinds', () => {
    const source = `${FRONTMATTER}# CI\n\nRuns on #632 and #634 landed 2026-08-02.\n`

    expect(
      measureEntry('ci.md', source).provenance.map((found) => found.text),
    ).toEqual(['#632', '#634', '2026-08-02'])
  })

  it('should leave a date in frontmatter unreported', () => {
    // A diagram entry stamps `verified` with a short SHA and an ISO date, so
    // the frontmatter strip is what keeps the field a record of the last check
    // rather than a marker the report asks a reader to go and settle.
    const source = `---\ntitle: Components\nverified: 7b1107ac 2026-08-02\n---\n\n# Components\n\nThe boundary holds three layers.\n`

    expect(measureEntry('components.md', source).provenance).toEqual([])
  })

  it('should leave a version pinned inside a fenced block unreported', () => {
    const source = `${FRONTMATTER}# CI\n\n\`\`\`bash\nbunx -y aitk@v1.2.3 --since 2026-01-01\n\`\`\`\n`

    expect(measureEntry('ci.md', source).provenance).toEqual([])
  })

  it('should leave an entry stating only current shape unreported', () => {
    const source = `${FRONTMATTER}# CI\n\nThe cap is 30, above the highest observed run.\n`

    expect(measureEntry('ci.md', source).provenance).toEqual([])
  })

  it('should order findings by the line carrying them', () => {
    const source = `${FRONTMATTER}# CI\n\nShipped in #626.\n\nMeasured 2026-08-03.\n`

    expect(
      measureEntry('ci.md', source).provenance.map((found) => found.line),
    ).toEqual([8, 10])
  })

  it('should leave a marker unreported when no standard claims the content', () => {
    const source = `${FRONTMATTER}# Components\n\nThe third layer arrived in #755.\n`

    expect(measureEntry('components.md', source, false).provenance).toEqual([])
  })

  it('should report a bullet narrating a decision the bullet above it replaced', () => {
    const source = `${FRONTMATTER}# CI\n\n- The cap is 30, above the highest observed run.\n- This was 20, which the longest run overshot.\n`

    expect(measureEntry('ci.md', source, true, TERMS).narration).toEqual([
      { line: 9, pronoun: 'This', verb: 'was' },
    ])
  })

  it('should leave the bullet opening a list unreported', () => {
    // Nothing sits above it to have been replaced, so the back-reference
    // points outside the list and the shape the rule names is absent.
    const source = `${FRONTMATTER}# CI\n\n- This was 20, which the longest run overshot.\n- The cap is 30 today.\n`

    expect(measureEntry('ci.md', source, true, TERMS).narration).toEqual([])
  })

  it('should leave a back-reference stating the current design unreported', () => {
    const source = `${FRONTMATTER}# CI\n\n- The cap is 30, above the highest observed run.\n- That number is what the timeout divides into.\n`

    expect(measureEntry('ci.md', source, true, TERMS).narration).toEqual([])
  })

  it('should leave a past-tense bullet naming its own subject unreported', () => {
    const source = `${FRONTMATTER}# CI\n\n- The cap is 30, above the highest observed run.\n- The timeout was raised with it and holds today.\n`

    expect(measureEntry('ci.md', source, true, TERMS).narration).toEqual([])
  })

  it('should leave a pronoun sitting mid-sentence unreported', () => {
    // The opening is anchored because a mid-sentence `this` is a determiner
    // rather than a reference back to the bullet above.
    const source = `${FRONTMATTER}# CI\n\n- The cap is 30, above the highest observed run.\n- Raising it was what this run needed.\n`

    expect(measureEntry('ci.md', source, true, TERMS).narration).toEqual([])
  })

  it('should leave a verb quoted in backticks unreported', () => {
    const source = `${FRONTMATTER}# CI\n\n- The cap is 30, above the highest observed run.\n- This field spells \`was\` for the caller.\n`

    expect(measureEntry('ci.md', source, true, TERMS).narration).toEqual([])
  })

  it('should leave a bullet pair inside a fenced block unreported', () => {
    const source = `${FRONTMATTER}# CI\n\n\`\`\`markdown\n- The cap is 30 today.\n- This was 20 before.\n\`\`\`\n`

    expect(measureEntry('ci.md', source, true, TERMS).narration).toEqual([])
  })

  it('should keep the run across a nested bullet under its parent', () => {
    const source = `${FRONTMATTER}# CI\n\n- The cap is 30, above the highest observed run.\n  - Measured across every stage.\n- This was 20, which the longest run overshot.\n`

    expect(measureEntry('ci.md', source, true, TERMS).narration).toEqual([
      { line: 10, pronoun: 'This', verb: 'was' },
    ])
  })

  it('should keep the run across a blank line inside a loose list', () => {
    // Markdown reads two bullets around a blank line as one loose list, so a
    // run that broke there would leave the shape reachable by spacing bullets.
    const source = `${FRONTMATTER}# CI\n\n- The cap is 30, above the highest observed run.\n\n- This was 20, which the longest run overshot.\n`

    expect(measureEntry('ci.md', source, true, TERMS).narration).toEqual([
      { line: 10, pronoun: 'This', verb: 'was' },
    ])
  })

  it('should leave a passive of use behind a copula unreported', () => {
    // `is used to resolve` is the passive of `use`, not the past habitual the
    // verb set means, and no other set term appears in the bullet.
    const source = `${FRONTMATTER}# CI\n\n- The cap is 30, above the highest observed run.\n- That glob is used to resolve the folder it scans.\n`

    expect(measureEntry('ci.md', source, true, TERMS).narration).toEqual([])
  })

  it('should report the past habitual standing on its own', () => {
    const source = `${FRONTMATTER}# CI\n\n- The cap is 30, above the highest observed run.\n- That glob used to resolve the folder it scans.\n`

    expect(measureEntry('ci.md', source, true, TERMS).narration).toEqual([
      { line: 9, pronoun: 'That', verb: 'used to' },
    ])
  })

  it('should still report a copula that is itself a listed verb', () => {
    // The guard rejects a verb sitting behind a copula, and `was` opening the
    // clause is not behind one, so a passive past still reports through it.
    const source = `${FRONTMATTER}# CI\n\n- The cap is 30, above the highest observed run.\n- This was replaced by the observed maximum.\n`

    expect(measureEntry('ci.md', source, true, TERMS).narration).toEqual([
      { line: 9, pronoun: 'This', verb: 'was' },
    ])
  })

  it('should end the run at a heading between two lists', () => {
    const source = `${FRONTMATTER}# CI\n\n- The cap is 30, above the highest observed run.\n\n## Gotchas\n\n- This was raised once and holds.\n`

    expect(measureEntry('ci.md', source, true, TERMS).narration).toEqual([])
  })

  it('should report a rejected alternative carrying the shape', () => {
    // The standard keeps what was tried and why it lost, so this is a
    // legitimate hit rather than a defect. No measure separates the two, which
    // is why the check reports and the report says so.
    const source = `${FRONTMATTER}# CI\n\n- The cap is 30, above the highest observed run.\n- That was the alternative and it lost to the observed maximum.\n`

    expect(measureEntry('ci.md', source, true, TERMS).narration).toEqual([
      { line: 9, pronoun: 'That', verb: 'was' },
    ])
  })

  it('should scan nothing when the caller loaded no term sets', () => {
    const source = `${FRONTMATTER}# CI\n\n- The cap is 30, above the highest observed run.\n- This was 20, which the longest run overshot.\n`

    expect(measureEntry('ci.md', source).narration).toEqual([])
  })

  it('should leave narration unreported when no standard claims the content', () => {
    const source = `${FRONTMATTER}# Components\n\n- The boundary holds three layers.\n- This was two before the split.\n`

    expect(
      measureEntry('components.md', source, false, TERMS).narration,
    ).toEqual([])
  })

  it('should report a required section declared as a heading', () => {
    const source = `${FRONTMATTER}# CI\n\n## Overview\n\nOwns the workflow.\n\n## Layout\n\n- \`.github/\` owns it\n`

    expect(measureEntry('ci.md', source).sections).toEqual([
      'Overview',
      'Layout',
    ])
  })

  it('should report a required section carried by the entry title', () => {
    // A split domain names the sibling holding its overview for the section,
    // so the heading is the `#` title rather than an `##` under it repeating
    // the filename. Every split folder in this repository is that shape.
    const source = `${FRONTMATTER}# Overview\n\n## Layout\n\n- \`scripts/\` owns them\n`

    expect(measureEntry('overview.md', source).sections).toEqual([
      'Overview',
      'Layout',
    ])
  })

  it('should return the sections in the order the standard states them', () => {
    const source = `${FRONTMATTER}# CI\n\n## Layout\n\n- \`.github/\` owns it\n\n## Overview\n\nOwns the workflow.\n`

    expect(measureEntry('ci.md', source).sections).toEqual([
      'Overview',
      'Layout',
    ])
  })

  it('should leave a heading that only opens with a section name undeclared', () => {
    const source = `${FRONTMATTER}# Slides\n\n## Layout catalog\n\nOne row a layout.\n`

    expect(measureEntry('slides.md', source).sections).toEqual([])
  })

  it('should leave a section named inside a fenced block undeclared', () => {
    const source = `${FRONTMATTER}# CI\n\n\`\`\`markdown\n## Overview\n\`\`\`\n`

    expect(measureEntry('ci.md', source).sections).toEqual([])
  })

  it('should declare no section when no standard claims the content', () => {
    const source = `${FRONTMATTER}# Components\n\n## Overview\n\nThree layers.\n`

    expect(measureEntry('components.md', source, false).sections).toEqual([])
  })

  it('should keep measuring length outside the governed folder', () => {
    const source = `${FRONTMATTER}# Components\n\n${prose(60)}\n`

    // Only the content rule narrows. A readability threshold generalizes
    // across entry types, so it keeps reaching every audited folder.
    expect(measureEntry('components.md', source, false).lines).toBeGreaterThan(
      LENGTH_CHECKPOINT / 3,
    )
  })
})

describe('measureFolders', () => {
  let root: string

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'aitk-audit-'))
  })

  afterEach(() => {
    rmSync(root, { recursive: true, force: true })
  })

  function seed(relativeDir: string, name: string, body: string): void {
    const dir = join(root, relativeDir)
    mkdirSync(dir, { recursive: true })
    writeFileSync(
      join(dir, 'index.md'),
      '---\ntitle: X\nsubtitle: Y\n---\n\n# X\n',
    )
    writeFileSync(join(dir, name), `${FRONTMATTER}${body}`)
  }

  const NARRATED = '# X\n\nThe third layer arrived in #755.\n'

  async function provenanceOf(rel: string): Promise<number> {
    const { folders } = await resolveFolders(root)
    const reports = await measureFolders(root, folders)

    return reports.find((entry) => entry.rel === rel)?.provenance.length ?? -1
  }

  it('should report a marker in an entry the rule governs', async () => {
    seed('.claude/context', 'ci.md', NARRATED)

    expect(await provenanceOf('.claude/context/ci.md')).toBe(1)
  })

  it('should leave a marker in a diagram entry unreported', async () => {
    seed('.claude/diagrams', 'components.md', NARRATED)

    expect(await provenanceOf('.claude/diagrams/components.md')).toBe(0)
  })

  it('should govern a split domain by the folder it sits beneath', async () => {
    seed('.claude/context', 'ci.md', '# X\n')
    seed('.claude/context/claude-plugin', 'skills.md', NARRATED)

    expect(await provenanceOf('.claude/context/claude-plugin/skills.md')).toBe(
      1,
    )
  })

  it('should leave a marker in a root folder unreported', async () => {
    seed('docs', 'agents.md', NARRATED)

    const { folders } = await resolveFolders(root, ['docs'], {
      canResolveAtRoot: true,
    })
    const [entry] = await measureFolders(root, folders)

    // Provenance is the context standard's own rule and stops at its folder.
    // The attribute-tier measures reach `docs/` through `aitk markdown audit`,
    // which needs no folder to resolve at all.
    expect(entry.rel).toBe('docs/agents.md')
    expect(entry.provenance).toEqual([])
  })

  it('should still measure a root folder for length', async () => {
    seed('docs', 'agents.md', '# X\n')

    const { folders } = await resolveFolders(root, ['docs'], {
      canResolveAtRoot: true,
    })
    const [entry] = await measureFolders(root, folders)

    expect(entry.lines).toBeGreaterThan(0)
  })
})

describe('missingSections', () => {
  let root: string

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'aitk-sections-'))
  })

  afterEach(() => {
    rmSync(root, { recursive: true, force: true })
  })

  const CONFORMING =
    '# CI\n\n## Overview\n\nOwns the workflow.\n\n## Layout\n\n- `.github/` owns it\n'

  function seedFolder(
    relativeDir: string,
    entries: Record<string, string>,
  ): void {
    const dir = join(root, relativeDir)
    mkdirSync(dir, { recursive: true })
    writeFileSync(
      join(dir, 'index.md'),
      '---\ntitle: X\nsubtitle: Y\n---\n\n# X\n',
    )
    for (const [name, body] of Object.entries(entries)) {
      writeFileSync(join(dir, name), `${FRONTMATTER}${body}`)
    }
  }

  async function missingIn(rel: string): Promise<readonly string[]> {
    const { folders } = await resolveFolders(root)
    const entries = await measureFolders(root, folders)

    return (
      missingSections(root, folders, entries).find(
        (folder) => folder.rel === rel,
      )?.missing ?? []
    )
  }

  it('should report both sections against the entry declaring neither', async () => {
    seedFolder('.claude/context', {
      'ci.md': '# CI\n\n## Triggers\n\nOn every push.\n',
    })

    expect(await missingIn('.claude/context/ci.md')).toEqual([
      'Overview',
      'Layout',
    ])
  })

  it('should report the one section the entry is short of', async () => {
    seedFolder('.claude/context', {
      'ci.md': '# CI\n\n## Overview\n\nOwns the workflow.\n',
    })

    expect(await missingIn('.claude/context/ci.md')).toEqual(['Layout'])
  })

  it('should leave an entry declaring every required section unreported', async () => {
    seedFolder('.claude/context', { 'ci.md': CONFORMING })

    expect(await missingIn('.claude/context/ci.md')).toEqual([])
  })

  it('should hold each entry of the named folder to the sections itself', async () => {
    // The named folder's entries are one domain each, so a conforming sibling
    // answers for nothing. Rolling this folder up let one entry stand in for
    // every other domain beside it.
    seedFolder('.claude/context', {
      'ci.md': CONFORMING,
      'web.md': '# Web\n\n## Overview\n\nOwns the client.\n',
    })

    expect(await missingIn('.claude/context/web.md')).toEqual(['Layout'])
  })

  it('should accept a split folder where one sibling carries the sections', async () => {
    seedFolder('.claude/context', { 'ci.md': CONFORMING })
    seedFolder('.claude/context/scripts', {
      'overview.md': '# Overview\n\n## Layout\n\n- `scripts/` owns them\n',
      'lib.md': '# Lib\n\n## Decisions\n\nOne concern a file.\n',
    })

    expect(await missingIn('.claude/context/scripts')).toEqual([])
  })

  it('should report a split folder against the folder rather than its entries', async () => {
    seedFolder('.claude/context', { 'ci.md': CONFORMING })
    seedFolder('.claude/context/scripts', {
      'lib.md': '# Lib\n\n## Decisions\n\nOne concern a file.\n',
    })

    expect(await missingIn('.claude/context/scripts')).toEqual([
      'Overview',
      'Layout',
    ])
    expect(await missingIn('.claude/context/scripts/lib.md')).toEqual([])
  })

  it('should leave a split parent carrying no entries of its own unreported', async () => {
    seedFolder('.claude/context', {})
    seedFolder('.claude/context/scripts', { 'overview.md': CONFORMING })

    expect(await missingIn('.claude/context')).toEqual([])
  })

  it('should leave a diagram folder unreported', async () => {
    seedFolder('.claude/diagrams', {
      'components.md': '# Components\n\n## Components\n\nThree layers.\n',
    })

    expect(await missingIn('.claude/diagrams/components.md')).toEqual([])
  })
})
