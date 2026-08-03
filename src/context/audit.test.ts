import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  BULLET_CHECKPOINT,
  CATALOG_ROW_CHECKPOINT,
  measureEntry,
  measureFolders,
  missingSections,
  RENDER_WIDTH,
  RUN_CHECKPOINT,
} from '@/context/audit'
import { resolveFolders } from '@/context/folders'

const FRONTMATTER = '---\ntitle: CI\ndescription: A domain\n---\n\n'

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

  it('should report the longest run of lines no heading breaks', () => {
    const source = `${FRONTMATTER}# CI\n\n${prose(60)}\n\n## Layout\n\n${prose(5)}\n`

    expect(measureEntry('ci.md', source).longestRun).toBeGreaterThan(
      RUN_CHECKPOINT,
    )
  })

  it('should point at the first non-blank line of the longest run', () => {
    const source = `${FRONTMATTER}# CI\n\n${prose(60)}\n`

    expect(measureEntry('ci.md', source).longestRunLine).toBe(8)
  })

  it('should let a heading of any level break a run', () => {
    const half = prose(30)
    const source = `${FRONTMATTER}# CI\n\n${half}\n\n#### Seam\n\n${half}\n`

    expect(measureEntry('ci.md', source).longestRun).toBeLessThan(
      RUN_CHECKPOINT,
    )
  })

  it('should not count a heading that is markdown inside a fenced block', () => {
    const source = `${FRONTMATTER}# CI\n\n${prose(20)}\n\n\`\`\`markdown\n## Not a real heading\n\n### Nor this\n\`\`\`\n\n${prose(20)}\n`

    // The fence neither breaks the run nor adds to it, so the two prose
    // stretches measure as the single run a reader scrolls through.
    expect(measureEntry('ci.md', source).longestRun).toBe(43)
  })

  it('should exempt a run whose lines are all list items at one level', () => {
    const source = `${FRONTMATTER}# CI\n\n${bullets(60)}\n`

    expect(measureEntry('ci.md', source).longestRun).toBe(0)
  })

  it('should count a wrapped line as the rows it renders', () => {
    const source = `${FRONTMATTER}# CI\n\n${'x'.repeat(RENDER_WIDTH * 3)}\n`

    // The blank line after the heading is one row and the long line is three.
    expect(measureEntry('ci.md', source).longestRun).toBe(4)
  })

  it('should exempt a flat catalog of short peers', () => {
    const source = `${FRONTMATTER}# CI\n\n${weightedBullets(PEER_COUNT, CATALOG_BULLET)}\n`

    expect(measureEntry('ci.md', source).longestRun).toBe(0)
  })

  it('should report paragraph bullets at the count the catalog is exempt at', () => {
    const source = `${FRONTMATTER}# CI\n\n${weightedBullets(PEER_COUNT, PARAGRAPH_BULLET)}\n`

    expect(measureEntry('ci.md', source).longestRun).toBeGreaterThan(
      RUN_CHECKPOINT,
    )
  })

  it('should report a bullet block whose source lines stay under the checkpoint', () => {
    const source = `${FRONTMATTER}# CI\n\n${weightedBullets(15, PARAGRAPH_BULLET)}\n`

    // Fifteen bullets and a blank line are sixteen source lines, so only the
    // rendered measure reaches the checkpoint.
    expect(measureEntry('ci.md', source).longestRun).toBeGreaterThan(
      RUN_CHECKPOINT,
    )
  })

  it('should end the exemption when the list nests a second level', () => {
    const source = `${FRONTMATTER}# CI\n\n${bullets(30)}\n${bullets(30, '  ')}\n`

    expect(measureEntry('ci.md', source).longestRun).toBeGreaterThan(
      RUN_CHECKPOINT,
    )
  })

  it('should end the exemption when prose is mixed into the list', () => {
    const source = `${FRONTMATTER}# CI\n\n${bullets(30)}\nA sentence between them.\n${bullets(30)}\n`

    expect(measureEntry('ci.md', source).longestRun).toBeGreaterThan(
      RUN_CHECKPOINT,
    )
  })

  it('should report a table whose rows name artifacts as a growing catalog', () => {
    const rows = Array.from(
      { length: CATALOG_ROW_CHECKPOINT },
      (_, index) => `| \`aitk cmd-${index}\` | Does a thing |`,
    )
    const source = `${FRONTMATTER}# CI\n\n${table(rows)}\n`

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
    const rows = Array.from(
      { length: CATALOG_ROW_CHECKPOINT - 1 },
      (_, index) => `| \`aitk cmd-${index}\` | Does a thing |`,
    )
    const source = `${FRONTMATTER}# CI\n\n${table(rows)}\n`

    expect(measureEntry('ci.md', source).catalogTables).toEqual([])
  })

  it('should ignore a table that is an example inside a fenced block', () => {
    const rows = Array.from(
      { length: CATALOG_ROW_CHECKPOINT },
      (_, index) => `| \`aitk cmd-${index}\` | Does a thing |`,
    )
    const source = `${FRONTMATTER}# CI\n\n\`\`\`markdown\n${table(rows)}\n\`\`\`\n`

    expect(measureEntry('ci.md', source).catalogTables).toEqual([])
  })

  it('should report a top-level bullet past the character checkpoint', () => {
    const source = `${FRONTMATTER}# CI\n\n${bullet(BULLET_CHECKPOINT + 1)}\n`

    expect(measureEntry('ci.md', source).heavyBullets).toEqual([
      { line: 8, characters: BULLET_CHECKPOINT + 1 },
    ])
  })

  it('should leave a bullet at the checkpoint unreported', () => {
    const source = `${FRONTMATTER}# CI\n\n${bullet(BULLET_CHECKPOINT)}\n`

    expect(measureEntry('ci.md', source).heavyBullets).toEqual([])
  })

  it('should leave a nested bullet unreported', () => {
    const source = `${FRONTMATTER}# CI\n\n- Parent\n  ${bullet(BULLET_CHECKPOINT + 1)}\n`

    expect(measureEntry('ci.md', source).heavyBullets).toEqual([])
  })

  it('should ignore a bullet that is an example inside a fenced block', () => {
    const source = `${FRONTMATTER}# CI\n\n\`\`\`markdown\n${bullet(BULLET_CHECKPOINT + 1)}\n\`\`\`\n`

    expect(measureEntry('ci.md', source).heavyBullets).toEqual([])
  })

  it('should fold a continuation line into the bullet it belongs to', () => {
    const half = Math.ceil((BULLET_CHECKPOINT + 1) / 2)
    const source = `${FRONTMATTER}# CI\n\n${bullet(half)}\n${'w'.repeat(half)}\n`

    // Neither source line reaches the checkpoint on its own, so a wrapped
    // bullet only reports once the two are measured as the one bullet they are.
    expect(measureEntry('ci.md', source).heavyBullets).toEqual([
      { line: 8, characters: half * 2 + 1 },
    ])
  })

  it('should leave a heavy bullet unreported when no standard claims the content', () => {
    const source = `${FRONTMATTER}# Components\n\n${bullet(BULLET_CHECKPOINT + 1)}\n`

    // The remedy is to move an incident out and keep the decision, which an
    // entry type carrying no decisions has no way to act on.
    expect(measureEntry('components.md', source, false).heavyBullets).toEqual(
      [],
    )
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

  it('should keep measuring length and depth outside the governed folder', () => {
    const source = `${FRONTMATTER}# Components\n\n${prose(60)}\n`

    // Only the content rule narrows. A readability threshold generalizes
    // across entry types, so it keeps reaching every audited folder.
    expect(
      measureEntry('components.md', source, false).longestRun,
    ).toBeGreaterThan(RUN_CHECKPOINT)
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

  it('should leave a marker and a heavy bullet in a root folder unreported', async () => {
    const heavy = `- ${'word '.repeat(BULLET_CHECKPOINT / 2)}\n`
    seed('docs', 'agents.md', `${NARRATED}\n${heavy}`)

    const { folders } = await resolveFolders(root, ['docs'])
    const [entry] = await measureFolders(root, folders)

    expect(entry.rel).toBe('docs/agents.md')
    expect(entry.provenance).toEqual([])
    expect(entry.heavyBullets).toEqual([])
  })

  it('should still measure a root folder for length', async () => {
    seed('docs', 'agents.md', '# X\n')

    const { folders } = await resolveFolders(root, ['docs'])
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
